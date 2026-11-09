import type { AgeGroup, LessonDirection, MaterialKind } from "@/types";

/** Типовете на витрината — общи за сървъра и браузъра. */

export type ShowcaseStatus = "PENDING" | "APPROVED" | "RETURNED";

export interface ShowcaseTeacher {
  id: string;
  name: string;
  avatar: string;
  groupName: string;
  ageGroup: AgeGroup;
  bio?: string;
}

export interface ShowcaseItemView {
  id: string;
  kind: MaterialKind;
  title: string;
  story: string;
  ageGroup: AgeGroup;
  direction: LessonDirection | null;
  holiday: string | null;
  /** Копието на материала (игра, план-конспект или материал за печат) */
  content: unknown;
  images: { id: string; url: string }[];
  /** „Днес в групата“: дейност от деня (разказ и снимки), не материал от библиотеката */
  activity: boolean;
  allowPrint: boolean;
  status: ShowcaseStatus;
  reviewNote: string | null;
  publishedAt: string | null;
  createdAt: string;
  author: ShowcaseTeacher;
}

export const SHOWCASE_STATUS_LABELS: Record<ShowcaseStatus, string> = {
  PENDING: "Чака одобрение",
  APPROVED: "На витрината",
  RETURNED: "Върнато за промяна",
};

/** Вид и знак за картите: дейност от деня или вида на материала. */
export function showcaseKind(item: Pick<ShowcaseItemView, "kind" | "activity">): { label: string; emoji: string } {
  if (item.activity) return { label: "Днес в групата", emoji: "📷" };
  return { GAME: { label: "Игра", emoji: "🎲" }, LESSON: { label: "Педагогическа ситуация", emoji: "📋" }, MATERIAL: { label: "Материал", emoji: "📝" } }[item.kind];
}

export const STORY_MIN = 20;
export const STORY_MAX = 1500;
