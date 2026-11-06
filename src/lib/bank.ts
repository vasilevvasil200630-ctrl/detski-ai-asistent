import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import type { AgeGroup, GeneratedGame, GroupMood, PlayLocation, PlayResources, SavedBankGame } from "@/types";

export const BANK_GAME_INCLUDE = {
  kindergarten: { select: { id: true, name: true } },
  author: { select: { id: true, name: true, avatar: true, groupName: true } },
  _count: { select: { likes: true } },
} satisfies Prisma.BankGameInclude;

type BankRow = Prisma.BankGameGetPayload<{ include: typeof BANK_GAME_INCLUDE }>;

function relativeDate(d: Date): string {
  const diffMin = Math.round((Date.now() - d.getTime()) / 60000);
  if (diffMin < 2) return "Току-що";
  if (diffMin < 60) return `Преди ${diffMin} мин`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `Преди ${diffH} ч`;
  const diffD = Math.round(diffH / 24);
  if (diffD < 30) return `Преди ${diffD} дни`;
  return d.toLocaleDateString("bg-BG");
}

/** Ред от базата → формата, която UI-ят на банката вече ползва (SavedBankGame). */
export function toSavedBankGame(row: BankRow, likedIds: Set<string>): SavedBankGame {
  return {
    id: row.id,
    kindergartenId: row.kindergartenId,
    kindergartenName: row.kindergarten.name,
    authorId: row.author?.id ?? "",
    authorName: row.author?.name ?? "Бивш колега",
    authorAvatar: row.author?.avatar ?? "👩‍🏫",
    authorGroupName: row.author?.groupName ?? "",
    ageGroup: row.ageGroup as AgeGroup,
    mood: row.mood as GroupMood,
    location: row.location as PlayLocation,
    resources: row.resources as PlayResources,
    createdAt: relativeDate(row.createdAt),
    likes: row._count.likes,
    likedByMe: likedIds.has(row.id),
    game: row.game as unknown as GeneratedGame,
  };
}
