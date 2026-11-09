import "server-only";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { KG } from "@/config/kindergarten";
import { groupLabel, type GroupView, type ParentPostView } from "@/lib/parents-shared";

/** Групите и публикациите за родителите: заявки, изгледи и проверка на входа. */

const TEACHER_SELECT = { id: true, name: true, avatar: true, jobTitle: true } as const;

/** Учителите, които се показват публично: в екипа (не премахнати). */
const ACTIVE_TEACHER = { kindergartenId: KG.id, removedAt: null } as const;

export async function publicGroups(): Promise<GroupView[]> {
  const rows = await prisma.group.findMany({
    where: { kindergartenId: KG.id },
    orderBy: [{ ageGroup: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    include: { teachers: { where: ACTIVE_TEACHER, select: TEACHER_SELECT, orderBy: { name: "asc" } } },
  });
  return rows.map(toGroupView);
}

export function toGroupView(g: { id: string; name: string; ageGroup: string; slug: string; teachers: { id: string; name: string; avatar: string; jobTitle: string }[] }): GroupView {
  return { id: g.id, name: g.name, ageGroup: g.ageGroup, slug: g.slug, label: groupLabel(g), teachers: g.teachers };
}

export const PARENT_POST_INCLUDE = {
  author: { select: { id: true, name: true, avatar: true, kindergartenId: true } },
  group: { select: { name: true, ageGroup: true } },
} satisfies Prisma.ParentPostInclude;

type PostRow = Prisma.ParentPostGetPayload<{ include: typeof PARENT_POST_INCLUDE }>;

export function toParentPostView(p: PostRow, meId: string | null): ParentPostView {
  return {
    id: p.id,
    kind: p.kind,
    title: p.title,
    body: p.body,
    eventDate: p.eventDate ? p.eventDate.toISOString().slice(0, 10) : null,
    groupId: p.groupId,
    groupLabel: p.group ? groupLabel(p.group) : null,
    status: p.status,
    reviewNote: p.reviewNote,
    publishedAt: p.publishedAt?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
    author: { id: p.author.id, name: p.author.name, avatar: p.author.avatar },
    mine: meId === p.authorId,
    hasPrintable: p.printable !== null,
  };
}

/**
 * Публичните публикации: одобрени, авторът е в екипа; обявите и поканите с минала дата
 * изчезват седмица след събитието, за да не стоят стари покани.
 */
export function publicPostsWhere(extra: Prisma.ParentPostWhereInput = {}): Prisma.ParentPostWhereInput {
  const weekAgo = new Date(Date.now() - 7 * 86_400_000);
  return {
    kindergartenId: KG.id,
    status: "APPROVED",
    author: ACTIVE_TEACHER,
    OR: [{ eventDate: null }, { eventDate: { gte: weekAgo } }],
    ...extra,
  };
}

export const GroupFields = z.object({
  name: z.string().trim().min(2, "Името на групата е твърде кратко.").max(40, "Името е твърде дълго."),
  ageGroup: z.enum(["1", "2", "3", "4"]),
});

export const PostFields = z.object({
  kind: z.enum(["NOTICE", "LETTER", "VERSES"]),
  title: z.string().trim().min(3, "Заглавието е твърде кратко.").max(120, "Заглавието е твърде дълго."),
  body: z.string().trim().min(10, "Напишете малко повече текст.").max(6000, "Текстът е твърде дълъг."),
  eventDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Невалидна дата.")
    .nullable()
    .default(null),
  /** null — за цялата градина (само директорът) */
  groupId: z.string().min(1).max(40).nullable().default(null),
  /** Писмо или стихчета от „Материали за печат“ — пази се за печат */
  printable: z.unknown().optional(),
});

/** Членът на екипа, който публикува: id, роля, градина и неговата група. */
export async function postMember(userId: string) {
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, kgRole: true, kindergartenId: true, groupId: true, removedAt: true } });
  if (!me?.kindergartenId || me.removedAt) return null;
  return { id: me.id, isAdmin: me.kgRole === "ADMIN", kindergartenId: me.kindergartenId, groupId: me.groupId };
}

/** Текуща учебна година (началото ѝ): от септември. */
export function currentSchoolYear(now = new Date()): number {
  return now.getMonth() + 1 >= 9 ? now.getFullYear() : now.getFullYear() - 1;
}

/** Темата на седмицата за групата: от утвърденото разпределение на учител от групата, което той е показал на родителите. */
export async function weekThemeForGroup(teacherIds: string[], now = new Date()) {
  if (!teacherIds.length) return null;
  const plan = await prisma.thematicPlan.findFirst({
    where: { authorId: { in: teacherIds }, schoolYear: currentSchoolYear(now), approvedAt: { not: null }, showToParents: true },
    orderBy: { updatedAt: "desc" },
    select: { ageGroup: true },
  });
  if (!plan) return null;
  const today = new Date(`${now.toISOString().slice(0, 10)}T00:00:00.000Z`);
  const week = await prisma.thematicWeek.findFirst({
    where: {
      plan: { authorId: { in: teacherIds }, schoolYear: currentSchoolYear(now), approvedAt: { not: null }, showToParents: true },
      endDate: { gte: today },
      theme: { not: "" },
    },
    orderBy: { startDate: "asc" },
    select: { theme: true, startDate: true, endDate: true, situations: true },
  });
  if (!week) return null;
  const situations = Array.isArray(week.situations) ? (week.situations as { direction?: string; topic?: string }[]) : [];
  return {
    theme: week.theme,
    startDate: week.startDate.toISOString().slice(0, 10),
    endDate: week.endDate.toISOString().slice(0, 10),
    current: week.startDate <= now,
    topics: situations
      .filter((s) => typeof s.topic === "string" && s.topic.trim() && typeof s.direction === "string")
      .map((s) => ({ direction: s.direction as string, topic: (s.topic as string).trim() }))
      .slice(0, 20),
  };
}

/** Всичко за страницата на групата за родителите (само одобреното). */
export async function groupPageData(slug: string) {
  const group = await prisma.group.findUnique({
    where: { kindergartenId_slug: { kindergartenId: KG.id, slug } },
    include: { teachers: { where: ACTIVE_TEACHER, select: TEACHER_SELECT, orderBy: { name: "asc" } } },
  });
  if (!group) return null;
  const [posts, theme] = await Promise.all([
    prisma.parentPost.findMany({ where: publicPostsWhere({ groupId: group.id }), include: PARENT_POST_INCLUDE, orderBy: [{ eventDate: "asc" }, { publishedAt: "desc" }], take: 60 }),
    weekThemeForGroup(group.teachers.map((t) => t.id)),
  ]);
  return { group: toGroupView(group), posts: posts.map((p) => toParentPostView(p, null)), theme };
}
