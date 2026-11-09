import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { cleanSituations, holidaysByWeek, type PlanSummary, type PlanView } from "@/services/thematicPlan";
import type { AgeGroup } from "@/types";

export const PLAN_INCLUDE = {
  author: { select: { name: true } },
  approvedBy: { select: { name: true } },
  weeks: { orderBy: { week: "asc" } },
} satisfies Prisma.ThematicPlanInclude;

type PlanRow = Prisma.ThematicPlanGetPayload<{ include: typeof PLAN_INCLUDE }>;

export async function planMember(userId: string) {
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, kgRole: true, kindergartenId: true } });
  return me?.kindergartenId ? { id: me.id, isAdmin: me.kgRole === "ADMIN", kindergartenId: me.kindergartenId } : null;
}

/** Разпределението се вижда от автора, от директора и от колегите, ако е споделено. */
export function canSee(plan: { authorId: string | null; kindergartenId: string; shared: boolean }, me: { id: string; isAdmin: boolean; kindergartenId: string }) {
  if (plan.kindergartenId !== me.kindergartenId) return false;
  return plan.authorId === me.id || plan.shared || me.isAdmin;
}

export function toPlanView(row: PlanRow, meId: string): PlanView {
  const holidays = holidaysByWeek(row.schoolYear);
  const ageGroup = row.ageGroup as AgeGroup;
  return {
    id: row.id,
    ageGroup,
    groupName: row.groupName,
    schoolYear: row.schoolYear,
    shared: row.shared,
    mine: row.authorId === meId,
    authorName: row.author?.name ?? "Бивш колега",
    approvedAt: row.approvedAt?.toISOString() ?? null,
    approvedByName: row.approvedBy?.name ?? null,
    weeks: row.weeks.map((w) => ({
      week: w.week,
      startDate: w.startDate.toISOString().slice(0, 10),
      endDate: w.endDate.toISOString().slice(0, 10),
      theme: w.theme,
      notes: w.notes,
      situations: cleanSituations(ageGroup, w.situations),
      holidays: holidays.get(w.week) ?? [],
    })),
  };
}

export function toPlanSummary(row: Prisma.ThematicPlanGetPayload<{ include: { author: { select: { name: true } }; weeks: { select: { theme: true } } } }>, meId: string): PlanSummary {
  return {
    id: row.id,
    ageGroup: row.ageGroup as AgeGroup,
    groupName: row.groupName,
    schoolYear: row.schoolYear,
    shared: row.shared,
    mine: row.authorId === meId,
    authorName: row.author?.name ?? "Бивш колега",
    approvedAt: row.approvedAt?.toISOString() ?? null,
    weeksWithTheme: row.weeks.filter((w) => w.theme.trim()).length,
    weeksTotal: row.weeks.length,
  };
}
