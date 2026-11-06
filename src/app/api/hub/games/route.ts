import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { AUTH_REQUIRED } from "@/lib/teacher";
import { BANK_GAME_INCLUDE, toSavedBankGame } from "@/lib/bank";
import { normalizeGames } from "@/services/aiValidation";

const ListQuery = z.object({
  scope: z.enum(["kg", "all"]).default("kg"),
  ageGroup: z.enum(["1", "2", "3", "4"]).optional(),
});

/** Колективната банка: игрите на моята градина (или на всички градини). */
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ games: [], guest: true });

  const url = new URL(request.url);
  const q = ListQuery.safeParse({
    scope: url.searchParams.get("scope") ?? undefined,
    ageGroup: url.searchParams.get("ageGroup") ?? undefined,
  });
  if (!q.success) return NextResponse.json({ error: "Невалиден филтър." }, { status: 400 });

  const me = await prisma.user.findUnique({ where: { id: session.userId }, select: { kindergartenId: true } });
  if (!me) return NextResponse.json(AUTH_REQUIRED, { status: 401 });

  const rows = await prisma.bankGame.findMany({
    where: {
      ...(q.data.scope === "kg" ? { kindergartenId: me.kindergartenId ?? "__none__" } : {}),
      ...(q.data.ageGroup ? { ageGroup: q.data.ageGroup } : {}),
    },
    include: BANK_GAME_INCLUDE,
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  const liked = await prisma.bankGameLike.findMany({
    where: { userId: session.userId, gameId: { in: rows.map((r) => r.id) } },
    select: { gameId: true },
  });
  const likedIds = new Set(liked.map((l) => l.gameId));
  return NextResponse.json({ games: rows.map((r) => toSavedBankGame(r, likedIds)) });
}

const SaveBody = z.object({
  ageGroup: z.enum(["1", "2", "3", "4"]),
  mood: z.enum(["noisy", "tired", "distracted"]),
  location: z.enum(["classroom", "music_hall", "yard"]),
  resources: z.enum(["none", "balls", "music", "paper_pencils", "hoops_ribbons"]),
  game: z.unknown(),
});

/** Споделяне на игра в банката на моята градина. */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json(AUTH_REQUIRED, { status: 401 });

  const rate = await checkRateLimit(`bank-save:${session.userId}`, 30);
  if (!rate.allowed) return NextResponse.json({ error: "Твърде много записи за минута." }, { status: 429 });

  const parsed = SaveBody.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Невалидни данни за играта." }, { status: 400 });

  // Играта минава през същата нормализация като AI отговорите — в базата влиза само валидна структура
  let game;
  try {
    [game] = normalizeGames([parsed.data.game], []);
  } catch {
    return NextResponse.json({ error: "Играта няма заглавие или стъпки." }, { status: 400 });
  }

  const me = await prisma.user.findUnique({ where: { id: session.userId }, select: { kindergartenId: true } });
  if (!me?.kindergartenId) {
    return NextResponse.json({ error: "Профилът ти не е свързан с детска градина." }, { status: 400 });
  }

  const row = await prisma.bankGame.create({
    data: {
      kindergartenId: me.kindergartenId,
      authorId: session.userId,
      ageGroup: parsed.data.ageGroup,
      mood: parsed.data.mood,
      location: parsed.data.location,
      resources: parsed.data.resources,
      game: JSON.parse(JSON.stringify(game)),
      likes: { create: { userId: session.userId } },
    },
    include: BANK_GAME_INCLUDE,
  });
  return NextResponse.json({ game: toSavedBankGame(row, new Set([row.id])) }, { status: 201 });
}
