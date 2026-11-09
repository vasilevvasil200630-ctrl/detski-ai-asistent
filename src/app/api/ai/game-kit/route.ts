import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { AUTH_REQUIRED } from "@/lib/teacher";
import { askGeminiJson, checkAiRateLimit, hasGeminiKey } from "@/lib/ai-route";
import { extractJson } from "@/services/aiValidation";
import { isValidTask } from "@/services/gameTasks";
import { buildDemoKit, buildKitPrompt, normalizeKitResponse, type KitRequest } from "@/services/printables/kit";

export const maxDuration = 60;

const AGE = z.enum(["1", "2", "3", "4"]);
const DIRECTION = z.enum(["bel", "world", "math", "art", "music", "construct", "pe", "bdp"]);
const SHORT = z.string().trim().max(300);

const Params = z.object({
  ageGroup: AGE,
  direction: DIRECTION,
  topic: z.string().trim().max(120).default(""),
  parts: z.array(z.enum(["worksheet", "cards", "poster", "parent", "supplies"])).min(1).max(5),
  sheetKinds: z.array(z.enum(["count", "match", "odd", "sequence", "trace", "sound", "draw", "maze", "differences", "half"])).max(4).default([]),
  resources: z.string().trim().max(200).optional(),
  game: z.object({
    title: z.string().trim().min(1).max(160),
    rhymeLines: z.array(SHORT).max(8).default([]),
    steps: z.array(z.string().trim().max(600)).min(1).max(8),
    pedagogicalGoal: z.string().trim().max(800).default(""),
    tasks: z.array(z.object({ direction: DIRECTION, core: z.string().max(120), result: z.string().max(400) })).max(3).default([]),
  }),
});

/** Комплект към играта: работен лист, карти, стихче за стената, бележка до родителите, пособия. */
export async function POST(request: Request) {
  if (!(await getSession())) return NextResponse.json(AUTH_REQUIRED, { status: 401 });
  const parsed = Params.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Невалидни параметри." }, { status: 400 });
  const req: KitRequest = { ...parsed.data, parts: [...new Set(parsed.data.parts)], sheetKinds: [...new Set(parsed.data.sheetKinds)] };

  if (req.parts.includes("worksheet") && req.sheetKinds.length === 0) {
    return NextResponse.json({ error: "Изберете поне един вид задача за работния лист." }, { status: 400 });
  }
  // Задачите влизат в промпта — приемат се само дословно от наредбата за групата
  if (!(req.game.tasks ?? []).every((t) => isValidTask(t, req.ageGroup))) {
    return NextResponse.json({ error: "Някоя от задачите не е от Наредба № 5 за тази група." }, { status: 400 });
  }

  const demo = buildDemoKit(req);
  // Само стихчето за стената не иска генериране
  const needsModel = req.parts.some((p) => p !== "poster");
  if (!needsModel || !hasGeminiKey()) return NextResponse.json({ kit: demo, source: "demo" });

  const rate = await checkAiRateLimit(request);
  if (!rate.allowed) return NextResponse.json({ kit: demo, source: "demo", limited: true });

  try {
    const raw = await askGeminiJson(buildKitPrompt(req), 6000);
    const kit = normalizeKitResponse(typeof raw === "string" ? extractJson(raw) : raw, req, demo);
    return NextResponse.json({ kit, source: "ai" });
  } catch (error) {
    console.warn("[ai/game-kit] fallback to demo:", error instanceof Error ? error.message : error);
    return NextResponse.json({ kit: demo, source: "demo" });
  }
}
