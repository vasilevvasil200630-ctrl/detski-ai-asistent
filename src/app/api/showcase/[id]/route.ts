import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { AUTH_REQUIRED } from "@/lib/teacher";
import { ShowcaseFields, SHOWCASE_INCLUDE, toShowcaseView, validShowcaseImages } from "@/lib/showcase";

const NOT_FOUND = { error: "Дейността не е намерена." };

/** Промяна от автора: всяка промяна връща дейността за ново одобрение (и я сваля от витрината). */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json(AUTH_REQUIRED, { status: 401 });
  const { id } = await params;

  const parsed = ShowcaseFields.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Невалидни данни." }, { status: 400 });

  const [row, me] = await Promise.all([
    prisma.showcaseItem.findUnique({ where: { id }, select: { authorId: true, kindergartenId: true } }),
    prisma.user.findUnique({ where: { id: session.userId }, select: { id: true, kindergartenId: true } }),
  ]);
  if (!row || row.authorId !== session.userId || !me?.kindergartenId || me.kindergartenId !== row.kindergartenId) {
    return NextResponse.json(NOT_FOUND, { status: 404 });
  }
  const images = await validShowcaseImages(parsed.data.imageIds, { id: me.id, kindergartenId: me.kindergartenId }, parsed.data.noChildren);
  if (!images.ok) return NextResponse.json({ error: images.error }, { status: 400 });

  const updated = await prisma.showcaseItem.update({
    where: { id },
    data: {
      title: parsed.data.title,
      story: parsed.data.story,
      imageIds: images.ids,
      allowPrint: parsed.data.allowPrint,
      status: "PENDING",
      publishedAt: null,
      reviewNote: null,
      reviewedAt: null,
      reviewedById: null,
    },
    include: SHOWCASE_INCLUDE,
  });
  return NextResponse.json({ item: toShowcaseView(updated, { forPublic: false }) });
}

/** Сваляне от витрината и изтриване на предложението — от автора или от директора. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json(AUTH_REQUIRED, { status: 401 });
  const { id } = await params;
  const [row, me] = await Promise.all([
    prisma.showcaseItem.findUnique({ where: { id }, select: { authorId: true, kindergartenId: true } }),
    prisma.user.findUnique({ where: { id: session.userId }, select: { kgRole: true, kindergartenId: true } }),
  ]);
  const isAdmin = me?.kgRole === "ADMIN" && me.kindergartenId === row?.kindergartenId;
  if (!row || (row.authorId !== session.userId && !isAdmin)) return NextResponse.json(NOT_FOUND, { status: 404 });
  await prisma.showcaseItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
