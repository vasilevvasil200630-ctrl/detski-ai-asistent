import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { AUTH_REQUIRED } from "@/lib/teacher";
import { canSee, planMember, PLAN_INCLUDE, toPlanView } from "@/lib/plans";

/** Копие на споделено разпределение на колега (напр. двамата учители на една група) — като мое, неутвърдено. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json(AUTH_REQUIRED, { status: 401 });
  const me = await planMember(session.userId);
  const { id } = await params;
  const source = await prisma.thematicPlan.findUnique({ where: { id }, include: { weeks: true } });
  if (!me || !source || !canSee(source, me)) return NextResponse.json({ error: "Разпределението не е намерено." }, { status: 404 });
  if (source.authorId === me.id) return NextResponse.json({ error: "Това е вашето разпределение." }, { status: 400 });
  const exists = await prisma.thematicPlan.findFirst({ where: { authorId: me.id, ageGroup: source.ageGroup, schoolYear: source.schoolYear }, select: { id: true } });
  if (exists) return NextResponse.json({ error: "Вече имате разпределение за тази група и година.", id: exists.id }, { status: 409 });

  const row = await prisma.thematicPlan.create({
    data: {
      kindergartenId: me.kindergartenId,
      authorId: me.id,
      ageGroup: source.ageGroup,
      groupName: source.groupName,
      schoolYear: source.schoolYear,
      weeks: {
        create: source.weeks.map((w) => ({
          week: w.week,
          startDate: w.startDate,
          endDate: w.endDate,
          theme: w.theme,
          notes: w.notes,
          situations: w.situations ?? [],
        })),
      },
    },
    include: PLAN_INCLUDE,
  });
  return NextResponse.json({ plan: toPlanView(row, me.id) }, { status: 201 });
}
