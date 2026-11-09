import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { AUTH_REQUIRED } from "@/lib/teacher";
import { teamMember } from "@/lib/announcements";

const NOT_FOUND = { error: "Обявата не е намерена." };

/** „Прочетох“ — учителят потвърждава обявата (повторното натискане не променя датата). */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json(AUTH_REQUIRED, { status: 401 });
  const { id } = await params;
  const me = await teamMember(session.userId);
  const row = await prisma.announcement.findUnique({ where: { id }, select: { kindergartenId: true } });
  if (!me || !row || row.kindergartenId !== me.kindergartenId) return NextResponse.json(NOT_FOUND, { status: 404 });
  await prisma.announcementRead.upsert({
    where: { announcementId_userId: { announcementId: id, userId: me.id } },
    create: { announcementId: id, userId: me.id },
    update: {},
  });
  return NextResponse.json({ ok: true });
}

/** За директора: кой от екипа е прочел обявата и кой — още не. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json(AUTH_REQUIRED, { status: 401 });
  const { id } = await params;
  const me = await teamMember(session.userId);
  if (!me?.isAdmin) return NextResponse.json({ error: "Само за директора." }, { status: 403 });
  const row = await prisma.announcement.findUnique({ where: { id }, select: { kindergartenId: true } });
  if (!row || row.kindergartenId !== me.kindergartenId) return NextResponse.json(NOT_FOUND, { status: 404 });

  const [team, reads] = await Promise.all([
    prisma.user.findMany({ where: { kindergartenId: me.kindergartenId }, select: { id: true, name: true, avatar: true }, orderBy: { name: "asc" } }),
    prisma.announcementRead.findMany({ where: { announcementId: id }, select: { userId: true, readAt: true } }),
  ]);
  const readAt = new Map(reads.map((r) => [r.userId, r.readAt.toISOString()]));
  return NextResponse.json({
    read: team.filter((u) => readAt.has(u.id)).map((u) => ({ name: u.name, avatar: u.avatar, readAt: readAt.get(u.id)! })),
    notRead: team.filter((u) => !readAt.has(u.id)).map((u) => ({ name: u.name, avatar: u.avatar })),
  });
}
