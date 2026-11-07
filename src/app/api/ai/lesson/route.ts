import { NextResponse } from "next/server";
import { z } from "zod";
import { askGeminiJson, checkAiRateLimit, hasGeminiKey } from "@/lib/ai-route";
import { buildDemoLessonPlan, buildLessonAiPrompt } from "@/services/aiEngine";
import { extractJson, normalizeLessonPlan } from "@/services/aiValidation";
import { DIRECTION_STANDARDS } from "@/services/naredba5";

export const maxDuration = 60;

const Params = z.object({
  ageGroup: z.enum(["1", "2", "3", "4"]),
  direction: z.enum(["bel", "world", "math", "art", "music", "construct", "pe"]),
  topic: z.string().trim().max(120),
  // Официално ядро от Наредба № 5; празно — AI избира
  core: z.string().trim().max(80).optional(),
});

export async function POST(request: Request) {
  const parsed = Params.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Невалидни параметри." }, { status: 400 });
  // Приема се само ядро, което съществува в приложението за това направление
  const core = DIRECTION_STANDARDS[parsed.data.direction].cores.find((c) => c === parsed.data.core);
  const params = { ...parsed.data, core };
  const demoPlan = buildDemoLessonPlan(params);

  if (!hasGeminiKey()) return NextResponse.json({ plan: demoPlan, source: "demo" });

  const rate = await checkAiRateLimit(request);
  if (!rate.allowed) return NextResponse.json({ plan: demoPlan, source: "demo", limited: true });

  try {
    const raw = await askGeminiJson(buildLessonAiPrompt(params, demoPlan), 8000);
    const plan = normalizeLessonPlan(typeof raw === "string" ? extractJson(raw) : raw, demoPlan, {
      direction: params.direction,
      coreChosen: Boolean(core),
    });
    return NextResponse.json({ plan, source: "ai" });
  } catch (error) {
    console.warn("[ai/lesson] fallback to demo:", error instanceof Error ? error.message : error);
    return NextResponse.json({ plan: demoPlan, source: "demo" });
  }
}
