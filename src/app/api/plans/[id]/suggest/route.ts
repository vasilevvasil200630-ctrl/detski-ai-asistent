import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { AUTH_REQUIRED } from "@/lib/teacher";
import { askGeminiJson, checkAiRateLimit, hasGeminiKey } from "@/lib/ai-route";
import { extractJson } from "@/services/aiValidation";
import { PLAN_INCLUDE, toPlanView } from "@/lib/plans";
import { demoTheme, holidaysByWeek } from "@/services/thematicPlan";
import { demoWeek, fitWeek, themesPrompt, weekPrompt } from "@/services/thematicPlanAi";
import type { AgeGroup } from "@/types";

export const maxDuration = 60;

const Body = z.discriminatedUnion("kind", [
  /** Теми за всички седмици без тема (записват се) */
  z.object({ kind: z.literal("themes") }),
  /** Ситуации за една седмица (само предложение — учителят ги прави свои и записва) */
  z.object({ kind: z.literal("week"), week: z.number().int().min(1).max(60), theme: z.string().trim().max(160).optional() }),
]);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json(AUTH_REQUIRED, { status: 401 });
  const { id } = await params;
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Невалидни данни." }, { status: 400 });
  const body = parsed.data;

  const plan = await prisma.thematicPlan.findUnique({ where: { id }, include: PLAN_INCLUDE });
  if (!plan || plan.authorId !== session.userId) return NextResponse.json({ error: "Разпределението не е намерено." }, { status: 404 });
  const ageGroup = plan.ageGroup as AgeGroup;
  const view = toPlanView(plan, session.userId);
  const holidays = holidaysByWeek(plan.schoolYear);
  const useModel = hasGeminiKey() && (await checkAiRateLimit(request)).allowed;

  if (body.kind === "themes") {
    const empty = view.weeks.filter((w) => !w.theme.trim());
    if (empty.length === 0) return NextResponse.json({ plan: view, source: "none" });
    // Вече дадените теми не се повтарят в резервния вариант
    const used = new Set(view.weeks.map((w) => w.theme.trim()).filter(Boolean));
    let themes = new Map(empty.map((w) => [w.week, demoTheme(w, w.holidays, used)]));
    let source = "demo";
    if (useModel) {
      try {
        const raw = await askGeminiJson(themesPrompt(ageGroup, empty), 4000);
        const list = (typeof raw === "string" ? extractJson(raw) : raw) as unknown;
        if (Array.isArray(list)) {
          for (const item of list) {
            const o = item as { week?: unknown; theme?: unknown };
            if (typeof o.week === "number" && typeof o.theme === "string" && themes.has(o.week) && o.theme.trim()) {
              themes.set(o.week, o.theme.trim().slice(0, 120));
            }
          }
          source = "ai";
        }
      } catch (error) {
        console.warn("[plans/suggest] themes fallback:", error instanceof Error ? error.message : error);
      }
    }
    themes = new Map([...themes].filter(([w]) => empty.some((e) => e.week === w)));
    await prisma.$transaction(
      [...themes].map(([week, theme]) => prisma.thematicWeek.update({ where: { planId_week: { planId: id, week } }, data: { theme } })),
    );
    const updated = await prisma.thematicPlan.findUniqueOrThrow({ where: { id }, include: PLAN_INCLUDE });
    return NextResponse.json({ plan: toPlanView(updated, session.userId), source });
  }

  const w = view.weeks.find((x) => x.week === body.week);
  if (!w) return NextResponse.json({ error: "Няма такава седмица." }, { status: 404 });
  const info = { ...w, theme: body.theme ?? w.theme, holidays: holidays.get(w.week) ?? [] };
  const fallback = demoWeek(ageGroup, info);
  if (!useModel) return NextResponse.json({ situations: fallback, source: "demo" });
  try {
    const raw = await askGeminiJson(weekPrompt(ageGroup, info), 6000);
    return NextResponse.json({ situations: fitWeek(ageGroup, typeof raw === "string" ? extractJson(raw) : raw, fallback), source: "ai" });
  } catch (error) {
    console.warn("[plans/suggest] week fallback:", error instanceof Error ? error.message : error);
    return NextResponse.json({ situations: fallback, source: "demo" });
  }
}
