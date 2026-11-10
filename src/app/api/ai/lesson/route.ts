import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { AUTH_REQUIRED } from "@/lib/teacher";
import { askGeminiJson, checkAiRateLimit, hasGeminiKey } from "@/lib/ai-route";
import { buildDemoLessonPlan, buildLessonAiPrompt } from "@/services/aiEngine";
import { extractJson, normalizeLessonPlan } from "@/services/aiValidation";
import { DIRECTION_STANDARDS } from "@/services/naredba5";
import { findBdpTheme } from "@/services/bdp";

export const maxDuration = 60;

const Params = z.object({
  ageGroup: z.enum(["1", "2", "3", "4"]),
  direction: z.enum(["bel", "world", "math", "art", "music", "construct", "pe", "bdp"]),
  topic: z.string().trim().max(120),
  // Официално ядро от Наредба № 5; празно — AI избира
  core: z.string().trim().max(80).optional(),
  // Вид на ситуацията (за нови знания, упражнение, обобщение, проверка)
  situationType: z.enum(["new", "practice", "summary", "check"]).optional(),
});

export async function POST(request: Request) {
  // Облакът е само за учителите на градината — генерирането изисква вход
  if (!(await getSession())) return NextResponse.json(AUTH_REQUIRED, { status: 401 });
  const parsed = Params.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Невалидни параметри." }, { status: 400 });
  // Приема се само официално ядро (или тема от програмите на МОН за БДП) за това направление
  const { direction, ageGroup } = parsed.data;
  const core =
    direction === "bdp"
      ? findBdpTheme(ageGroup, parsed.data.core)?.theme
      : DIRECTION_STANDARDS[direction].cores.find((c) => c === parsed.data.core);
  const params = { ...parsed.data, core };
  const demoPlan = buildDemoLessonPlan(params);

  if (!hasGeminiKey()) return NextResponse.json({ plan: demoPlan, source: "demo" });

  const rate = await checkAiRateLimit(request);
  if (!rate.allowed) return NextResponse.json({ plan: demoPlan, source: "demo", limited: true });

  try {
    const raw = await askGeminiJson(buildLessonAiPrompt(params, demoPlan), 8000);
    const plan = normalizeLessonPlan(typeof raw === "string" ? extractJson(raw) : raw, demoPlan, {
      // При БДП ядрото и направлението са фиксирани от програмата
      direction: direction === "bdp" ? undefined : direction,
      coreChosen: direction === "bdp" || Boolean(core),
      ageGroup,
    });
    return NextResponse.json({ plan, source: "ai" });
  } catch (error) {
    console.warn("[ai/lesson] fallback to demo:", error instanceof Error ? error.message : error);
    return NextResponse.json({ plan: demoPlan, source: "demo" });
  }
}
