/** Обявите от директора — общи типове за сървъра и браузъра. */

export interface AnnouncementView {
  id: string;
  title: string;
  body: string;
  important: boolean;
  pinned: boolean;
  /** Дата на събитието или срока („ГГГГ-ММ-ДД“) */
  eventDate: string | null;
  authorName: string;
  authorAvatar: string;
  createdAt: string;
  readByMe: boolean;
  /** Само за директора: колко от екипа са я прочели */
  reads?: { count: number; total: number };
}

export const TITLE_MAX = 140;
export const BODY_MAX = 4000;
