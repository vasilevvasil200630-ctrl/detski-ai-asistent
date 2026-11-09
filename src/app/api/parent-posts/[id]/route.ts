import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { AUTH_REQUIRED } from "@/lib/teacher";
import { PARENT_POST_INCLUDE, PostFields, postMember, toParentPostView } from "@/lib/parents";

const NOT_FOUND = { error: "Публикацията не е намерена." };

/** Авторът поправя публикацията; ако не е директорът, тя отново чака одобрение. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json(AUTH_REQUIRED, { status: 401 });
  const me = await postMember(session.userId);
  const { id } = await params;
  const row = await prisma.parentPost.findUnique({ where: { id }, select: { authorId: true } });
  if (!me || !row || row.authorId !== me.id) return NextResponse.json(NOT_FOUND, { status: 404 });
  const parsed = PostFields.pick({ title: true, body: true, eventDate: true }).partial().safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Невалидни данни." }, { status: 400 });
  const { eventDate, ...rest } = parsed.data;
  const now = new Date();
  const updated = await prisma.parentPost.update({
    where: { id },
    data: {
      ...rest,
      ...(eventDate !== undefined ? { eventDate: eventDate ? new Date(`${eventDate}T12:00:00.000Z`) : null } : {}),
      ...(me.isAdmin
        ? { status: "APPROVED" as const, publishedAt: now, reviewedAt: now, reviewedById: me.id, reviewNote: null }
        : { status: "PENDING" as const, publishedAt: null, reviewNote: null }),
    },
    include: PARENT_POST_INCLUDE,
  });
  return NextResponse.json({ post: toParentPostView(updated, me.id) });
}

/** Изтрива авторът или директорът. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json(AUTH_REQUIRED, { status: 401 });
  const me = await postMember(session.userId);
  const { id } = await params;
  const row = await prisma.parentPost.findUnique({ where: { id }, select: { authorId: true, kindergartenId: true } });
  if (!me || !row || row.kindergartenId !== me.kindergartenId || (row.authorId !== me.id && !me.isAdmin)) return NextResponse.json(NOT_FOUND, { status: 404 });
  await prisma.parentPost.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
