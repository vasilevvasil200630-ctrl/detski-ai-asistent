import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { AUTH_REQUIRED } from "@/lib/teacher";
import { toNoteItem } from "@/lib/notes";
import { buildCalendar, ICS_HEADERS } from "@/lib/ics";
import { getBaseAppUrl } from "@/lib/email/config";

/** „В календара“: една задача като .ics файл — телефонът я добавя с напомнянето. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json(AUTH_REQUIRED, { status: 401 });
  const { id } = await params;
  const row = await prisma.note.findUnique({ where: { id } });
  if (!row || row.userId !== session.userId || !row.dueDate) return NextResponse.json({ error: "Задачата не е намерена." }, { status: 404 });
  const ics = buildCalendar([toNoteItem(row)], getBaseAppUrl());
  return new NextResponse(ics, {
    headers: { ...ICS_HEADERS, "Content-Disposition": `attachment; filename="zadacha-${row.dueDate.toISOString().slice(0, 10)}.ics"` },
  });
}
