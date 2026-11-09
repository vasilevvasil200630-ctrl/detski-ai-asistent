import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { AUTH_REQUIRED } from "@/lib/teacher";
import { ANNOUNCEMENT_INCLUDE, AnnouncementFields, parseEventDate, teamMember, toAnnouncementView } from "@/lib/announcements";

const NOT_FOUND = { error: "Обявата не е намерена." };

async function adminAndRow(userId: string, id: string) {
  const me = await teamMember(userId);
  if (!me?.isAdmin) return { error: NextResponse.json({ error: "Само директорът променя обявите." }, { status: 403 }) };
  const row = await prisma.announcement.findUnique({ where: { id }, select: { kindergartenId: true } });
  if (!row || row.kindergartenId !== me.kindergartenId) return { error: NextResponse.json(NOT_FOUND, { status: 404 }) };
  return { me };
}

/** Промяна на обява (текст, „Важно“, закачване, дата) — само директорът. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json(AUTH_REQUIRED, { status: 401 });
  const { id } = await params;
  const check = await adminAndRow(session.userId, id);
  if ("error" in check) return check.error;

  const parsed = AnnouncementFields.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Невалидни данни." }, { status: 400 });
  const { eventDate, ...rest } = parsed.data;
  const row = await prisma.announcement.update({ where: { id }, data: { ...rest, eventDate: parseEventDate(eventDate) }, include: ANNOUNCEMENT_INCLUDE });
  return NextResponse.json({ item: toAnnouncementView(row, new Set([id])) });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json(AUTH_REQUIRED, { status: 401 });
  const { id } = await params;
  const check = await adminAndRow(session.userId, id);
  if ("error" in check) return check.error;
  await prisma.announcement.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
