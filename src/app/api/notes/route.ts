import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { AUTH_REQUIRED } from "@/lib/teacher";
import { MAX_NOTES, NoteCreateSchema, parseDueDate, toNoteItem } from "@/lib/notes";

/** Личният бележник: бележките се виждат само от собственика. */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json(AUTH_REQUIRED, { status: 401 });
  const rows = await prisma.note.findMany({
    where: { userId: session.userId },
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
    take: MAX_NOTES,
  });
  return NextResponse.json({ notes: rows.map(toNoteItem) });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json(AUTH_REQUIRED, { status: 401 });
  const rate = await checkRateLimit(`note-save:${session.userId}`, 120);
  if (!rate.allowed) return NextResponse.json({ error: "Твърде много записи за минута." }, { status: 429 });

  const parsed = NoteCreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Невалидни данни." }, { status: 400 });

  const count = await prisma.note.count({ where: { userId: session.userId } });
  if (count >= MAX_NOTES) return NextResponse.json({ error: "Бележникът е пълен. Изтрийте стари бележки." }, { status: 400 });

  const d = parsed.data;
  const row = await prisma.note.create({
    data: {
      userId: session.userId,
      title: d.title,
      body: d.body,
      color: d.color,
      pinned: d.pinned,
      dueDate: parseDueDate(d.dueDate) ?? null,
      done: d.done,
    },
  });
  return NextResponse.json({ note: toNoteItem(row) }, { status: 201 });
}
