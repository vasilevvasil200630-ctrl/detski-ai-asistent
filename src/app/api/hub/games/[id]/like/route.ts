import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { AUTH_REQUIRED } from "@/lib/teacher";

/** Харесване / отхаресване на игра от банката. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json(AUTH_REQUIRED, { status: 401 });
  const { id } = await params;

  const game = await prisma.bankGame.findUnique({ where: { id }, select: { id: true } });
  if (!game) return NextResponse.json({ error: "Играта не е намерена." }, { status: 404 });

  const key = { userId_gameId: { userId: session.userId, gameId: id } };
  const existing = await prisma.bankGameLike.findUnique({ where: key });
  if (existing) await prisma.bankGameLike.delete({ where: key });
  else await prisma.bankGameLike.create({ data: { userId: session.userId, gameId: id } }).catch(() => null);

  const likes = await prisma.bankGameLike.count({ where: { gameId: id } });
  return NextResponse.json({ likedByMe: !existing, likes });
}
