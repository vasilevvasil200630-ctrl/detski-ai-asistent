import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { AUTH_REQUIRED } from "@/lib/teacher";
import { NotePatchSchema, parseDueDate, toNoteItem } from "@/lib/notes";

const NOT_FOUND = { error: "Бележката не е намерена." };

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json(AUTH_REQUIRED, { status: 401 });
  const rate = await checkRateLimit(`note-save:${session.userId}`, 120);
  if (!rate.allowed) return NextResponse.json({ error: "Твърде много записи за минута." }, { status: 429 });
  const { id } = await params;

  const parsed = NotePatchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Невалидни данни." }, { status: 400 });

  const existing = await prisma.note.findUnique({ where: { id }, select: { userId: true } });
  if (!existing || existing.userId !== session.userId) return NextResponse.json(NOT_FOUND, { status: 404 });

  const { dueDate, snoozedUntil, ...rest } = parsed.data;
  const row = await prisma.note.update({
    where: { id },
    data: {
      ...rest,
      ...(dueDate !== undefined ? { dueDate: parseDueDate(dueDate) } : {}),
      // Нов срок или отметка „изпълнена“ започват напомнянето отначало
      ...(snoozedUntil !== undefined ? { snoozedUntil: parseDueDate(snoozedUntil) } : dueDate !== undefined || rest.done !== undefined ? { snoozedUntil: null } : {}),
    },
  });
  return NextResponse.json({ note: toNoteItem(row) });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json(AUTH_REQUIRED, { status: 401 });
  const { id } = await params;
  const { count } = await prisma.note.deleteMany({ where: { id, userId: session.userId } });
  if (count === 0) return NextResponse.json(NOT_FOUND, { status: 404 });
  return NextResponse.json({ ok: true });
}
