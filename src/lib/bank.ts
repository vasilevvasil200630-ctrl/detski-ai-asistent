import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { relativeDate } from "@/lib/materials";
import type { AgeGroup, GeneratedGame, GroupMood, PlayLocation, PlayResources, SavedBankGame } from "@/types";

/**
 * Колективната банка с игри = споделените материали от вид GAME.
 * (До миграция 1_teacher_library банката беше отделна таблица BankGame.)
 */
export const BANK_GAME_INCLUDE = {
  kindergarten: { select: { id: true, name: true } },
  author: { select: { id: true, name: true, avatar: true, groupName: true } },
  _count: { select: { likes: true } },
} satisfies Prisma.MaterialInclude;

type BankRow = Prisma.MaterialGetPayload<{ include: typeof BANK_GAME_INCLUDE }>;

/** Материал-игра → формата, която UI-ят на банката ползва (SavedBankGame). */
export function toSavedBankGame(row: BankRow, likedIds: Set<string>): SavedBankGame {
  const meta = (row.meta ?? {}) as { mood?: string; location?: string; resources?: string };
  return {
    id: row.id,
    kindergartenId: row.kindergartenId ?? "",
    kindergartenName: row.kindergarten?.name ?? "",
    authorId: row.author?.id ?? "",
    authorName: row.author?.name ?? "Бивш колега",
    authorAvatar: row.author?.avatar ?? "👩‍🏫",
    authorGroupName: row.author?.groupName ?? "",
    ageGroup: row.ageGroup as AgeGroup,
    mood: (meta.mood ?? "noisy") as GroupMood,
    location: (meta.location ?? "classroom") as PlayLocation,
    resources: (meta.resources ?? "none") as PlayResources,
    createdAt: relativeDate(row.createdAt),
    likes: row._count.likes,
    likedByMe: likedIds.has(row.id),
    game: row.content as unknown as GeneratedGame,
  };
}
