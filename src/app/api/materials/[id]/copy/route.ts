import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { AUTH_REQUIRED } from "@/lib/teacher";
import { MATERIAL_INCLUDE, toSavedMaterial } from "@/lib/materials";
import { findVisibleMaterial } from "@/lib/material-access";

/** Копира споделен материал на колега в моята библиотека (като мой, несподелен). */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json(AUTH_REQUIRED, { status: 401 });
  const { id } = await params;

  const rate = await checkRateLimit(`material-save:${session.userId}`, 60);
  if (!rate.allowed) return NextResponse.json({ error: "Твърде много записи за минута." }, { status: 429 });

  const source = await findVisibleMaterial(id, session.userId, { anyKindergartenGames: true });
  if (!source) return NextResponse.json({ error: "Материалът не е намерен." }, { status: 404 });
  if (source.authorId === session.userId) {
    return NextResponse.json({ error: "Материалът вече е в твоята библиотека." }, { status: 400 });
  }
  const already = await prisma.material.findFirst({
    where: { authorId: session.userId, copiedFromId: source.id },
    select: { id: true },
  });
  if (already) return NextResponse.json({ error: "Вече си запазил(а) този материал." }, { status: 409 });

  const me = await prisma.user.findUnique({ where: { id: session.userId }, select: { kindergartenId: true } });
  const row = await prisma.material.create({
    data: {
      authorId: session.userId,
      kindergartenId: me?.kindergartenId ?? null,
      kind: source.kind,
      title: source.title,
      ageGroup: source.ageGroup,
      direction: source.direction,
      core: source.core,
      holiday: source.holiday,
      ...(source.meta !== null ? { meta: source.meta as object } : {}),
      content: source.content as object,
      shared: false,
      copiedFromId: source.id,
    },
    include: MATERIAL_INCLUDE,
  });
  return NextResponse.json({ material: toSavedMaterial(row, session.userId, new Set()) }, { status: 201 });
}
