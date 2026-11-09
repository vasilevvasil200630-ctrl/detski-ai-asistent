import "server-only";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { BODY_MAX, TITLE_MAX, type AnnouncementView } from "@/lib/announcements-shared";

export const AnnouncementFields = z.object({
  title: z.string().trim().min(3, "Заглавието е твърде кратко.").max(TITLE_MAX),
  body: z.string().trim().min(3, "Напишете текста на обявата.").max(BODY_MAX, "Текстът е твърде дълъг."),
  important: z.boolean().default(false),
  pinned: z.boolean().default(false),
  /** „ГГГГ-ММ-ДД“ или празно */
  eventDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Невалидна дата.")
    .nullable()
    .default(null),
});

/** Датата се пази в 12:00 UTC — да не се измести с ден в часовата зона на браузъра. */
export function parseEventDate(v: string | null): Date | null {
  if (!v) return null;
  const d = new Date(`${v}T12:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export const ANNOUNCEMENT_INCLUDE = {
  author: { select: { name: true, avatar: true } },
  _count: { select: { reads: true } },
} satisfies Prisma.AnnouncementInclude;

type Row = Prisma.AnnouncementGetPayload<{ include: typeof ANNOUNCEMENT_INCLUDE }>;

export function toAnnouncementView(row: Row, readIds: Set<string>, team?: { total: number; readsInTeam: Map<string, number> }): AnnouncementView {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    important: row.important,
    pinned: row.pinned,
    eventDate: row.eventDate ? row.eventDate.toISOString().slice(0, 10) : null,
    authorName: row.author?.name ?? "Директор",
    authorAvatar: row.author?.avatar ?? "🏫",
    createdAt: row.createdAt.toISOString(),
    readByMe: readIds.has(row.id),
    ...(team ? { reads: { count: team.readsInTeam.get(row.id) ?? 0, total: team.total } } : {}),
  };
}

/** Членът на екипа (без премахнатите) или null. */
export async function teamMember(userId: string) {
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, kgRole: true, kindergartenId: true } });
  return me?.kindergartenId ? { id: me.id, isAdmin: me.kgRole === "ADMIN", kindergartenId: me.kindergartenId } : null;
}
