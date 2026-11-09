import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { AUTH_REQUIRED } from "@/lib/teacher";
import { planMember, PLAN_INCLUDE, toPlanSummary, toPlanView } from "@/lib/plans";
import { schoolWeeks } from "@/services/thematicPlan";

/** Моите тематични разпределения и споделените от колегите (директорът вижда всички). */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json(AUTH_REQUIRED, { status: 401 });
  const me = await planMember(session.userId);
  if (!me) return NextResponse.json({ plans: [] });
  const rows = await prisma.thematicPlan.findMany({
    where: { kindergartenId: me.kindergartenId, ...(me.isAdmin ? {} : { OR: [{ authorId: me.id }, { shared: true }] }) },
    include: { author: { select: { name: true } }, weeks: { select: { theme: true } } },
    orderBy: [{ schoolYear: "desc" }, { ageGroup: "asc" }],
  });
  return NextResponse.json({ plans: rows.map((r) => toPlanSummary(r, me.id)) });
}

const CreateBody = z.object({
  ageGroup: z.enum(["1", "2", "3", "4"]),
  schoolYear: z.number().int().min(2024).max(2100),
  groupName: z.string().trim().max(80).default(""),
});

/** Ново разпределение: учебните седмици от 15 септември до 31 май, още без теми. */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json(AUTH_REQUIRED, { status: 401 });
  const me = await planMember(session.userId);
  if (!me) return NextResponse.json({ error: "Профилът не е в екипа на градината." }, { status: 403 });
  const parsed = CreateBody.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Невалидни данни." }, { status: 400 });
  const { ageGroup, schoolYear, groupName } = parsed.data;

  const exists = await prisma.thematicPlan.findFirst({ where: { authorId: me.id, ageGroup, schoolYear }, select: { id: true } });
  if (exists) return NextResponse.json({ error: "Вече имате разпределение за тази група и година.", id: exists.id }, { status: 409 });

  const row = await prisma.thematicPlan.create({
    data: {
      kindergartenId: me.kindergartenId,
      authorId: me.id,
      ageGroup,
      schoolYear,
      groupName,
      weeks: {
        create: schoolWeeks(schoolYear).map((w) => ({
          week: w.week,
          startDate: new Date(`${w.startDate}T00:00:00Z`),
          endDate: new Date(`${w.endDate}T00:00:00Z`),
        })),
      },
    },
    include: PLAN_INCLUDE,
  });
  return NextResponse.json({ plan: toPlanView(row, me.id) }, { status: 201 });
}
