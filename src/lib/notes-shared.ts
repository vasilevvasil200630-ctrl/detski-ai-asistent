/** Личният бележник — общи типове за сървъра и браузъра. */

export const NOTE_COLORS = ["yellow", "blue", "green", "pink", "violet"] as const;
export type NoteColor = (typeof NOTE_COLORS)[number];

export interface NoteItem {
  id: string;
  title: string;
  body: string;
  color: NoteColor;
  pinned: boolean;
  /** „ГГГГ-ММ-ДД“ или null */
  dueDate: string | null;
  done: boolean;
  updatedAt: string;
}
