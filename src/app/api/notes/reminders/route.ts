import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { AUTH_REQUIRED } from "@/lib/teacher";
import { toNoteItem } from "@/lib/notes";
import { addDaysIso, isReminderActive, todayInSofia } from "@/lib/notes-shared";

/** Напомнянията за днес: неизпълнените задачи, чийто ден за напомняне е дошъл (и закъснелите). */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json(AUTH_REQUIRED, { status: 401 });
  const today = todayInSofia();
  // Най-ранното напомняне е седмица преди срока
  const horizon = new Date(`${addDaysIso(today, 7)}T23:59:59.000Z`);
  const rows = await prisma.note.findMany({
    where: { userId: session.userId, done: false, remindDays: { not: null }, dueDate: { not: null, lte: horizon } },
    orderBy: [{ dueDate: "asc" }, { dueTime: "asc" }],
    take: 200,
  });
  const reminders = rows.map(toNoteItem).filter((n) => isReminderActive(n, today));
  return NextResponse.json({ today, reminders });
}
