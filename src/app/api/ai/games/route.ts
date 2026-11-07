import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { AUTH_REQUIRED } from "@/lib/teacher";
import { askGeminiJson, checkAiRateLimit, hasGeminiKey } from "@/lib/ai-route";
import { buildDemoContext, buildGamesAiPrompt } from "@/services/aiEngine";
import { buildDemoGames } from "@/services/demoGames";
import { extractJson, normalizeGames } from "@/services/aiValidation";

export const maxDuration = 60;

const Filters = z.object({
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
  const demoGames = buildDemoGames(buildDemoContext(filters));

  if (!hasGeminiKey()) return NextResponse.json({ games: demoGames, source: "demo" });

  const rate = await checkAiRateLimit(request);
  if (!rate.allowed) return NextResponse.json({ games: demoGames, source: "demo", limited: true });

  try {
    const raw = await askGeminiJson(buildGamesAiPrompt(filters));
    const games = normalizeGames(typeof raw === "string" ? extractJson(raw) : raw, demoGames);
    return NextResponse.json({ games, source: "ai" });
  } catch (error) {
    console.warn("[ai/games] fallback to demo:", error instanceof Error ? error.message : error);
    return NextResponse.json({ games: demoGames, source: "demo" });
  }
}
