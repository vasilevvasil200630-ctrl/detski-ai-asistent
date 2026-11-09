import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { AUTH_REQUIRED } from "@/lib/teacher";
import { checkRateLimit } from "@/lib/rate-limit";

/** Тайният адрес за абонамент на календара: виж, създай (или смени) и изключи. */
function feedUrl(request: Request, token: string | null) {
  return token ? `${new URL(request.url).origin}/api/calendar/${token}.ics` : null;
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json(AUTH_REQUIRED, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { calendarToken: true } });
  return NextResponse.json({ url: feedUrl(request, user?.calendarToken ?? null) }, { headers: { "Cache-Control": "no-store" } });
}

/** Нов адрес: старият спира да работи веднага (напр. ако телефонът е изгубен). */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json(AUTH_REQUIRED, { status: 401 });
  const rate = await checkRateLimit(`calendar-token:${session.userId}`, 10);
  if (!rate.allowed) return NextResponse.json({ error: "Твърде много опити. Изчакайте малко." }, { status: 429 });
  const token = randomBytes(24).toString("base64url");
  await prisma.user.update({ where: { id: session.userId }, data: { calendarToken: token } });
  return NextResponse.json({ url: feedUrl(request, token) }, { status: 201 });
}

export async function DELETE() {
  const session = await getSession();
  if (!session) return NextResponse.json(AUTH_REQUIRED, { status: 401 });
  await prisma.user.update({ where: { id: session.userId }, data: { calendarToken: null } });
  return NextResponse.json({ url: null });
}
