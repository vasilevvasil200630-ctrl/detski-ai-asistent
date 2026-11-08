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

export const STORY_MIN = 20;
export const STORY_MAX = 1500;
