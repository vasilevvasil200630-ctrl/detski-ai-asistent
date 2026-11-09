import "server-only";
import { z } from "zod";
import type { Note } from "@/generated/prisma/client";
import type { NoteItem } from "@/lib/notes-shared";
import { NOTE_COLORS, REMIND_DAYS } from "@/lib/notes-shared";

const COLOR = z.enum(NOTE_COLORS);
/** Дата „ГГГГ-ММ-ДД“ или null (без срок). */
const DATE = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Невалидна дата.")
  .nullable();
/** Час „ЧЧ:ММ“ или null (без час). */
const TIME = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Невалиден час.")
  .nullable();
const REMIND = z
  .number()
  .int()
  .refine((n) => (REMIND_DAYS as readonly number[]).includes(n), "Невалидно напомняне.")
  .nullable();

export const NoteCreateSchema = z
  .object({
    title: z.string().trim().max(160, "Заглавието е твърде дълго.").default(""),
    body: z.string().max(8000, "Бележката е твърде дълга.").default(""),
    color: COLOR.default("yellow"),
    pinned: z.boolean().default(false),
    dueDate: DATE.default(null),
    dueTime: TIME.default(null),
    remindDays: REMIND.default(null),
    done: z.boolean().default(false),
  })
  .refine((n) => n.title.trim() || n.body.trim(), { message: "Бележката е празна." });

export const NotePatchSchema = z.object({
  title: z.string().trim().max(160, "Заглавието е твърде дълго.").optional(),
  body: z.string().max(8000, "Бележката е твърде дълга.").optional(),
  color: COLOR.optional(),
  pinned: z.boolean().optional(),
  dueDate: DATE.optional(),
  dueTime: TIME.optional(),
  remindDays: REMIND.optional(),
  snoozedUntil: DATE.optional(),
  done: z.boolean().optional(),
});

/** Датата се пази като 12:00 UTC на деня, за да не се мести при часовата зона. */
export function parseDueDate(value: string | null | undefined): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return new Date(`${value}T12:00:00.000Z`);
}

const isoDay = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null);

export function toNoteItem(n: Note): NoteItem {
  return {
    id: n.id,
    title: n.title,
    body: n.body,
    color: (NOTE_COLORS as readonly string[]).includes(n.color) ? (n.color as NoteItem["color"]) : "yellow",
    pinned: n.pinned,
    dueDate: isoDay(n.dueDate),
    dueTime: n.dueDate ? n.dueTime : null,
    remindDays: n.dueDate ? n.remindDays : null,
    snoozedUntil: isoDay(n.snoozedUntil),
    done: n.done,
    updatedAt: n.updatedAt.toISOString(),
  };
}

export const MAX_NOTES = 2000;
