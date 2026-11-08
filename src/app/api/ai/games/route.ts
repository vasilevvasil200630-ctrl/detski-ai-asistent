import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { AUTH_REQUIRED } from "@/lib/teacher";
import { askGeminiJson, checkAiRateLimit, hasGeminiKey } from "@/lib/ai-route";
import { buildDemoContext, buildGamesAiPrompt, finalizeGames } from "@/services/aiEngine";
import { isValidTask, MAX_TASKS, tasksError } from "@/services/gameTasks";
import { buildDemoGames } from "@/services/demoGames";
import { extractJson, normalizeGames } from "@/services/aiValidation";

export const maxDuration = 60;

const DIRECTION = z.enum(["bel", "world", "math", "art", "music", "construct", "pe", "bdp"]);

const Filters = z.object({
  mode: z.enum(["quick", "theme", "dos"]).default("theme"),
  tasks: z
    .array(z.object({ direction: DIRECTION, core: z.string().max(120), result: z.string().max(400) }))
    .max(MAX_TASKS)
    .default([]),
  ageGroup: z.enum(["1", "2", "3", "4"]),
  mood: z.enum(["noisy", "tired", "distracted"]),
  location: z.enum(["classroom", "music_hall", "yard"]),
  duration: z.enum(["5", "15", "30"]),
  resources: z.enum(["none", "balls", "music", "paper_pencils", "hoops_ribbons"]),
  customTheme: z.string().trim().max(80).optional(),
  direction: z.enum(["mixed", "bel", "world", "math", "art", "music", "construct", "pe", "bdp"]).optional(),
});

export async function POST(request: Request) {
  // Облакът е само за учителите на градината — генерирането изисква вход
  if (!(await getSession())) return NextResponse.json(AUTH_REQUIRED, { status: 401 });
  const parsed = Filters.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Невалидни филтри." }, { status: 400 });
  const filters = parsed.data;
  // Задачите се приемат само дословно от наредбата за избраната група — без свободен текст в промпта
  const taskProblem =
    tasksError(filters.mode, filters.tasks, filters.direction) ??
    (filters.tasks.every((t) => isValidTask(t, filters.ageGroup)) ? null : "Някоя от задачите не е от Наредба № 5 за тази група.");
  if (taskProblem) return NextResponse.json({ error: taskProblem }, { status: 400 });

  const demoGames = finalizeGames(buildDemoGames(buildDemoContext(filters)), filters, true);

  if (!hasGeminiKey()) return NextResponse.json({ games: demoGames, source: "demo" });

  const rate = await checkAiRateLimit(request);
  if (!rate.allowed) return NextResponse.json({ games: demoGames, source: "demo", limited: true });

  try {
    const raw = await askGeminiJson(buildGamesAiPrompt(filters));
    const games = finalizeGames(normalizeGames(typeof raw === "string" ? extractJson(raw) : raw, demoGames), filters);
    return NextResponse.json({ games, source: "ai" });
  } catch (error) {
    console.warn("[ai/games] fallback to demo:", error instanceof Error ? error.message : error);
    return NextResponse.json({ games: demoGames, source: "demo" });
  }
}
