import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { AUTH_REQUIRED } from "@/lib/teacher";
import { cleanSituations } from "@/services/thematicPlan";
import type { AgeGroup } from "@/types";

const Body = z.object({
  theme: z.string().trim().max(160).default(""),
  notes: z.string().trim().max(1500).default(""),
  situations: z.array(z.unknown()).max(40).default([]),
});

/**
 * Записва седмица: тема, бележки и ситуациите по направления. Ядрата и очакваните резултати се
 * приемат само дословно от Наредба № 5 за групата; всяка промяна сваля утвърждаването на директора.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; week: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json(AUTH_REQUIRED, { status: 401 });
  const { id, week } = await params;
  const weekNo = Number(week);
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !Number.isInteger(weekNo)) return NextResponse.json({ error: "Невалидни данни." }, { status: 400 });

  const plan = await prisma.thematicPlan.findUnique({ where: { id }, select: { authorId: true, ageGroup: true, approvedAt: true } });
  if (!plan || plan.authorId !== session.userId) return NextResponse.json({ error: "Разпределението не е намерено." }, { status: 404 });
  const row = await prisma.thematicWeek.findUnique({ where: { planId_week: { planId: id, week: weekNo } }, select: { id: true } });
  if (!row) return NextResponse.json({ error: "Няма такава седмица." }, { status: 404 });

  const situations = cleanSituations(plan.ageGroup as AgeGroup, parsed.data.situations);
  await prisma.$transaction([
    prisma.thematicWeek.update({ where: { id: row.id }, data: { theme: parsed.data.theme, notes: parsed.data.notes, situations: JSON.parse(JSON.stringify(situations)) } }),
    ...(plan.approvedAt ? [prisma.thematicPlan.update({ where: { id }, data: { approvedAt: null, approvedById: null } })] : [prisma.thematicPlan.update({ where: { id }, data: { updatedAt: new Date() } })]),
  ]);
  return NextResponse.json({ ok: true, situations, unapproved: Boolean(plan.approvedAt) });
}
