import { NextResponse } from "next/server";
import { z } from "zod";
import { askGeminiJson, checkAiRateLimit, hasGeminiKey } from "@/lib/ai-route";
import { buildDemoLessonPlan, buildLessonAiPrompt } from "@/services/aiEngine";
import { extractJson, normalizeLessonPlan } from "@/services/aiValidation";

export const maxDuration = 60;

const Params = z.object({
  ageGroup: z.enum(["1", "2", "3", "4"]),
  direction: z.enum(["bel", "world", "math", "art", "music", "construct"]),
  topic: z.string().trim().max(120),
});

export async function POST(request: Request) {
  const parsed = Params.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Невалидни параметри." }, { status: 400 });
  const demoPlan = buildDemoLessonPlan(parsed.data);

  if (!hasGeminiKey()) return NextResponse.json({ plan: demoPlan, source: "demo" });

  const rate = await checkAiRateLimit(request);
  if (!rate.allowed) return NextResponse.json({ plan: demoPlan, source: "demo", limited: true });

  try {
    const raw = await askGeminiJson(buildLessonAiPrompt(parsed.data, demoPlan), 8000);
    const plan = normalizeLessonPlan(typeof raw === "string" ? extractJson(raw) : raw, demoPlan);
    return NextResponse.json({ plan, source: "ai" });
  } catch (error) {
    console.warn("[ai/lesson] fallback to demo:", error instanceof Error ? error.message : error);
    return NextResponse.json({ plan: demoPlan, source: "demo" });
  }
}
