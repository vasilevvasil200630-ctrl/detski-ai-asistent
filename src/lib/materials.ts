import "server-only";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { normalizeGames } from "@/services/aiValidation";
import { HOLIDAYS } from "@/services/holidays";
import { isPrintable } from "@/services/printables";
import type { AgeGroup, LessonDirection, MaterialKind, SavedMaterial } from "@/types";

export const MATERIAL_INCLUDE = {
  author: { select: { id: true, name: true, avatar: true, groupName: true } },
  _count: { select: { likes: true } },
} satisfies Prisma.MaterialInclude;

type MaterialRow = Prisma.MaterialGetPayload<{ include: typeof MATERIAL_INCLUDE }>;

export function relativeDate(d: Date): string {
  const diffMin = Math.round((Date.now() - d.getTime()) / 60000);
  if (diffMin < 2) return "Току-що";
  if (diffMin < 60) return `Преди ${diffMin} мин`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `Преди ${diffH} ч`;
  const diffD = Math.round(diffH / 24);
  if (diffD < 30) return `Преди ${diffD} дни`;
  return d.toLocaleDateString("bg-BG");
}

/** Ред от базата → формата за клиента. */
export function toSavedMaterial(row: MaterialRow, userId: string, likedIds: Set<string>): SavedMaterial {
  return {
    id: row.id,
    kind: row.kind as MaterialKind,
    title: row.title,
    ageGroup: row.ageGroup as AgeGroup,
    direction: (row.direction as LessonDirection | null) ?? null,
    core: row.core,
    holiday: row.holiday,
    meta: (row.meta as Record<string, unknown> | null) ?? null,
    content: row.content,
    shared: row.shared,
    mine: row.authorId === userId,
    authorName: row.author?.name ?? "Бивш колега",
    authorAvatar: row.author?.avatar ?? "👩‍🏫",
    authorGroupName: row.author?.groupName ?? "",
    createdAt: relativeDate(row.createdAt),
    likes: row._count.likes,
    likedByMe: likedIds.has(row.id),
    copiedFromId: row.copiedFromId,
    tried: row.triedAt ? { at: row.triedAt.toISOString(), note: row.triedNote ?? "" } : null,
  };
}

const AGE = z.enum(["1", "2", "3", "4"]);
const DIRECTION = z.enum(["bel", "world", "math", "art", "music", "construct", "pe", "bdp"]);
const HOLIDAY_IDS = HOLIDAYS.map((h) => h.id) as [string, ...string[]];

export const CreateMaterialBody = z.object({
  kind: z.enum(["GAME", "LESSON", "MATERIAL"]),
  title: z.string().trim().min(2, "Заглавието е твърде кратко.").max(140),
  ageGroup: AGE,
  direction: DIRECTION.nullish(),
  core: z.string().trim().max(160).nullish(),
  holiday: z.enum(HOLIDAY_IDS).nullish(),
  meta: z.record(z.string(), z.unknown()).nullish(),
  content: z.unknown(),
  shared: z.boolean().optional(),
});

export const ListMaterialsQuery = z.object({
  scope: z.enum(["mine", "shared"]).default("mine"),
  ageGroup: AGE.optional(),
  kind: z.enum(["GAME", "LESSON", "MATERIAL"]).optional(),
  holiday: z.enum(HOLIDAY_IDS).optional(),
  /** 1 — само изпитаните с деца */
  tried: z.enum(["1"]).optional(),
});

const MAX_CONTENT_CHARS = 60_000;

/**
 * Проверява съдържанието според вида и връща почистената стойност за базата.
 * Ръчно написан материал е винаги { text }; игрите минават през нормализацията на AI отговорите.
 */
export function sanitizeContent(kind: MaterialKind, content: unknown): { ok: true; value: Prisma.InputJsonValue } | { ok: false; error: string } {
  let json: string;
  try {
    json = JSON.stringify(content ?? null);
  } catch {
    return { ok: false, error: "Невалидно съдържание." };
  }
  if (json.length > MAX_CONTENT_CHARS) return { ok: false, error: "Материалът е твърде голям." };

  const obj = content && typeof content === "object" && !Array.isArray(content) ? (content as Record<string, unknown>) : null;
  if (!obj) return { ok: false, error: "Липсва съдържание." };

  // Ръчно написан текст — за всеки вид. Материалите за печат пазят и структурата си (за /print/[id]).
  if (typeof obj.text === "string") {
    const text = obj.text.trim();
    if (text.length < 3) return { ok: false, error: "Текстът е твърде кратък." };
    if (kind === "MATERIAL" && isPrintable(obj.printable)) {
      return { ok: true, value: { text, printable: JSON.parse(JSON.stringify(obj.printable)) } };
    }
    return { ok: true, value: { text } };
  }

  if (kind === "GAME") {
    try {
      const [game] = normalizeGames([obj], []);
      return { ok: true, value: JSON.parse(JSON.stringify(game)) };
    } catch {
      return { ok: false, error: "Играта няма заглавие или стъпки." };
    }
  }
  if (kind === "LESSON") {
    if (typeof obj.topic !== "string" || !Array.isArray(obj.stages) || obj.stages.length === 0) {
      return { ok: false, error: "Планът няма тема или етапи." };
    }
    return { ok: true, value: JSON.parse(json) };
  }
  return { ok: false, error: "Помощният материал трябва да има текст." };
}
