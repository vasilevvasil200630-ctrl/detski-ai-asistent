/** Личният бележник — общи типове и правила за сървъра и браузъра. */

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
  /** „ЧЧ:ММ“ или null — без час */
  dueTime: string | null;
  /** Колко дни преди срока да напомня (0 — в деня); null — без напомняне */
  remindDays: number | null;
  /** „ГГГГ-ММ-ДД“: отложено напомняне — показва се отново от този ден */
  snoozedUntil: string | null;
  done: boolean;
  updatedAt: string;
}

/** Изборът „Напомни ми“ в бележника. */
export const REMIND_OPTIONS: { value: number | null; label: string }[] = [
  { value: 0, label: "в деня" },
  { value: 1, label: "1 ден преди" },
  { value: 2, label: "2 дни преди" },
  { value: 7, label: "седмица преди" },
  { value: null, label: "без напомняне" },
];
export const REMIND_DAYS = [0, 1, 2, 7] as const;
/** По подразбиране при нова задача: денят преди — да има време за подготовка. */
export const DEFAULT_REMIND_DAYS = 1;

export function remindLabel(days: number | null): string {
  return REMIND_OPTIONS.find((o) => o.value === days)?.label ?? "без напомняне";
}

/** „ГГГГ-ММ-ДД“ + n дни. */
export function addDaysIso(iso: string, n: number): string {
  const d = new Date(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10) + n));
  return d.toISOString().slice(0, 10);
}

/**
 * Дали задачата напомня днес: не е изпълнена, има срок и напомняне, дошъл е денят за напомняне
 * (срокът минус избраните дни) и не е отложена за по-късно. Закъснелите напомнят, докато не се отметнат.
 */
export function isReminderActive(
  n: Pick<NoteItem, "done" | "dueDate" | "remindDays" | "snoozedUntil">,
  today: string,
): boolean {
  if (n.done || !n.dueDate || n.remindDays === null) return false;
  if (n.snoozedUntil && today < n.snoozedUntil) return false;
  return today >= addDaysIso(n.dueDate, -n.remindDays);
}

/** Днешната дата в България — за сървъра (часовата зона на Vercel е UTC). */
export function todayInSofia(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Sofia", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}
