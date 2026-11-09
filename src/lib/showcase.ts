import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { KG } from "@/config/kindergarten";
import { isPrintable } from "@/services/printables";
import type { GeneratedGame } from "@/types";
import { z } from "zod";
import { STORY_MAX, STORY_MIN, type ShowcaseItemView, type ShowcaseTeacher } from "@/lib/showcase-shared";

/**
 * Публичната витрина за родителите: учителят предлага свой материал с разказ какво са правили
 * децата и снимки без деца; директорът одобрява. Публично се вижда само одобреното и само докато
 * авторът е в екипа на градината.
 */

/** Снимките на витрината — само формати, които всеки браузър показва. */
export const SHOWCASE_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
export const MAX_SHOWCASE_IMAGES = 4;
export const MAX_OPEN_PROPOSALS = 30;

export const SHOWCASE_INCLUDE = {
  author: { select: { id: true, name: true, avatar: true, groupName: true, ageGroup: true, jobTitle: true, kindergartenId: true } },
} satisfies Prisma.ShowcaseItemInclude;

type Row = Prisma.ShowcaseItemGetPayload<{ include: typeof SHOWCASE_INCLUDE }>;

/** Одобреното и видимо публично (авторът още е в екипа). */
export function publicShowcaseWhere(extra: Prisma.ShowcaseItemWhereInput = {}): Prisma.ShowcaseItemWhereInput {
  return { kindergartenId: KG.id, status: "APPROVED", author: { kindergartenId: KG.id }, ...extra };
}

/** Публичното копие: бележката до родителите от комплекта е за групата, не за витрината. */
function publicContent(kind: Row["kind"], content: unknown): unknown {
  if (kind !== "GAME" || !content || typeof content !== "object") return content;
  const game = content as GeneratedGame;
  if (!game.kit?.parentNote) return game;
  const { parentNote: _note, ...kit } = game.kit;
  void _note;
  return { ...game, kit };
}

export function toShowcaseView(row: Row, opts: { forPublic: boolean }): ShowcaseItemView {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    story: row.story,
    ageGroup: row.ageGroup as ShowcaseItemView["ageGroup"],
    direction: (row.direction ?? null) as ShowcaseItemView["direction"],
    holiday: row.holiday,
    content: opts.forPublic ? publicContent(row.kind, row.content) : row.content,
    images: row.imageIds.map((fileId) => ({ id: fileId, url: `/api/showcase/${row.id}/images/${fileId}` })),
    activity: Boolean(row.content && typeof row.content === "object" && !Array.isArray(row.content) && (row.content as Record<string, unknown>).activity === true),
    allowPrint: row.allowPrint,
    status: row.status,
    reviewNote: opts.forPublic ? null : row.reviewNote,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    author: { id: row.author.id, name: row.author.name, avatar: row.author.avatar, groupName: row.author.groupName, ageGroup: row.author.ageGroup as ShowcaseTeacher["ageGroup"] },
  };
}

/** Учителите на витрината: тези с поне една одобрена дейност. */
export async function showcaseTeachers(): Promise<(ShowcaseTeacher & { count: number })[]> {
  const rows = await prisma.user.findMany({
    where: { kindergartenId: KG.id, showcaseItems: { some: { status: "APPROVED", kindergartenId: KG.id } } },
    select: {
      id: true,
      name: true,
      avatar: true,
      groupName: true,
      ageGroup: true,
      showcaseBio: true,
      _count: { select: { showcaseItems: { where: { status: "APPROVED", kindergartenId: KG.id } } } },
    },
    orderBy: [{ ageGroup: "asc" }, { name: "asc" }],
  });
  return rows.map((u) => ({
    id: u.id,
    name: u.name,
    avatar: u.avatar,
    groupName: u.groupName,
    ageGroup: u.ageGroup as ShowcaseTeacher["ageGroup"],
    bio: u.showcaseBio,
    count: u._count.showcaseItems,
  }));
}

/** Копие на съдържанието на материала към момента на предлагането. */
export function snapshotContent(content: Prisma.JsonValue): Prisma.InputJsonValue | null {
  if (!content || typeof content !== "object" || Array.isArray(content)) return null;
  const obj = content as Record<string, unknown>;
  if (typeof obj.text !== "string" && !Array.isArray(obj.steps) && !Array.isArray(obj.stages) && !isPrintable(obj.printable)) return null;
  return JSON.parse(JSON.stringify(obj)) as Prisma.InputJsonValue;
}

/** Общата проверка на текста и снимките — и при предлагане, и при промяна. */
export const ShowcaseFields = z.object({
  title: z.string().trim().min(3, "Заглавието е твърде кратко.").max(140),
  story: z
    .string()
    .trim()
    .min(STORY_MIN, `Разкажете с поне ${STORY_MIN} знака какво направихте с децата.`)
    .max(STORY_MAX, "Разказът е твърде дълъг."),
  imageIds: z.array(z.string().max(40)).max(MAX_SHOWCASE_IMAGES, `Най-много ${MAX_SHOWCASE_IMAGES} снимки.`).default([]),
  /** Учителят потвърждава, че на снимките няма деца */
  noChildren: z.boolean().default(false),
  allowPrint: z.boolean().default(true),
});

/** Снимките трябва да са на учителя, от облака на градината и в показваем формат. */
export async function validShowcaseImages(ids: string[], me: { id: string; kindergartenId: string }, noChildren: boolean) {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return { ok: true as const, ids: [] };
  if (!noChildren) return { ok: false as const, error: "Потвърдете, че на снимките няма деца." };
  const files = await prisma.cloudFile.findMany({
    where: { id: { in: unique }, uploaderId: me.id, kindergartenId: me.kindergartenId, mimeType: { in: SHOWCASE_IMAGE_TYPES } },
    select: { id: true },
  });
  if (files.length !== unique.length) return { ok: false as const, error: "Някоя от снимките не е ваша или не е снимка (JPG, PNG, GIF, WebP)." };
  return { ok: true as const, ids: unique };
}


/** „2026-11“ → начало и край на месеца (по UTC; за бюлетина е достатъчно точно). */
export function monthRange(ym: string): { from: Date; to: Date } | null {
  const m = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(ym);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  return { from: new Date(Date.UTC(y, mo, 1)), to: new Date(Date.UTC(y, mo + 1, 1)) };
}

/** Месеците с одобрени дейности (най-новите първи) — за бюлетините. */
export async function showcaseMonths(): Promise<{ ym: string; count: number }[]> {
  const rows = await prisma.showcaseItem.findMany({ where: publicShowcaseWhere(), select: { publishedAt: true } });
  const counts = new Map<string, number>();
  for (const r of rows) {
    if (!r.publishedAt) continue;
    const ym = r.publishedAt.toISOString().slice(0, 7);
    counts.set(ym, (counts.get(ym) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[0].localeCompare(a[0])).map(([ym, count]) => ({ ym, count }));
}

export function monthLabel(ym: string): string {
  const range = monthRange(ym);
  if (!range) return ym;
  return range.from.toLocaleDateString("bg-BG", { month: "long", year: "numeric", timeZone: "UTC" }).replace(/\s*г\.?$/, "");
}
