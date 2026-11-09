import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { toNoteItem } from "@/lib/notes";
import { addDaysIso, todayInSofia } from "@/lib/notes-shared";
import { buildCalendar, ICS_HEADERS } from "@/lib/ics";
import { getBaseAppUrl } from "@/lib/email/config";

/**
 * Абонамент за календара на телефона: неизпълнените задачи от бележника с напомнянията.
 * Без вход — достъпът е с тайния адрес, който учителят може да смени или изключи.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const token = (await params).token.replace(/\.ics$/i, "");
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return new NextResponse("Not found", { status: 404 });
  const rate = await checkRateLimit(`calendar-feed:${token}`, 30);
  if (!rate.allowed) return new NextResponse("Too many requests", { status: 429 });

  const user = await prisma.user.findUnique({ where: { calendarToken: token }, select: { id: true } });
  if (!user) return new NextResponse("Not found", { status: 404, headers: { "X-Robots-Tag": "noindex" } });

  // Закъснелите до месец назад остават, докато не се отметнат
  const from = new Date(`${addDaysIso(todayInSofia(), -30)}T00:00:00.000Z`);
  const rows = await prisma.note.findMany({
    where: { userId: user.id, done: false, dueDate: { gte: from } },
    orderBy: { dueDate: "asc" },
    take: 500,
  });
  return new NextResponse(buildCalendar(rows.map(toNoteItem), getBaseAppUrl(), "Моят бележник · ДГ „Пролет“"), {
    headers: { ...ICS_HEADERS, "Content-Disposition": 'inline; filename="belezhnik.ics"' },
  });
}
