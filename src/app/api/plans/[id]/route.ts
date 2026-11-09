import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { AUTH_REQUIRED } from "@/lib/teacher";
import { canSee, planMember, PLAN_INCLUDE, toPlanView } from "@/lib/plans";

const NOT_FOUND = { error: "Разпределението не е намерено." };

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json(AUTH_REQUIRED, { status: 401 });
  const me = await planMember(session.userId);
  const { id } = await params;
  const row = await prisma.thematicPlan.findUnique({ where: { id }, include: PLAN_INCLUDE });
  if (!me || !row || !canSee(row, me)) return NextResponse.json(NOT_FOUND, { status: 404 });
  return NextResponse.json({ plan: toPlanView(row, me.id) });
}

const PatchBody = z.object({
  shared: z.boolean().optional(),
  groupName: z.string().trim().max(80).optional(),
  showToParents: z.boolean().optional(),
  /** Само директорът: утвърждава (true) или сваля утвърждаването (false) */
  approve: z.boolean().optional(),
});

/** Авторът: споделяне и име на групата. Директорът: утвърждаване (чл. 23, ал. 4 от Наредба № 5). */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json(AUTH_REQUIRED, { status: 401 });
  const me = await planMember(session.userId);
  const { id } = await params;
  const parsed = PatchBody.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Невалидни данни." }, { status: 400 });
  const row = await prisma.thematicPlan.findUnique({ where: { id }, select: { authorId: true, kindergartenId: true, shared: true } });
  if (!me || !row || !canSee(row, me)) return NextResponse.json(NOT_FOUND, { status: 404 });

  const { approve, ...authorFields } = parsed.data;
  const isAuthor = row.authorId === me.id;
  if (Object.keys(authorFields).length > 0 && !isAuthor) return NextResponse.json({ error: "Само авторът променя разпределението." }, { status: 403 });
  if (approve !== undefined && !me.isAdmin) return NextResponse.json({ error: "Утвърждава само директорът." }, { status: 403 });

  const updated = await prisma.thematicPlan.update({
    where: { id },
    data: {
      ...authorFields,
      ...(approve === undefined ? {} : approve ? { approvedAt: new Date(), approvedById: me.id } : { approvedAt: null, approvedById: null }),
    },
    include: PLAN_INCLUDE,
  });
  return NextResponse.json({ plan: toPlanView(updated, me.id) });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json(AUTH_REQUIRED, { status: 401 });
  const { id } = await params;
  const row = await prisma.thematicPlan.findUnique({ where: { id }, select: { authorId: true } });
  if (!row || row.authorId !== session.userId) return NextResponse.json(NOT_FOUND, { status: 404 });
  await prisma.thematicPlan.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
