import type { NoteItem } from "@/lib/notes-shared";

/** Днешната дата като „ГГГГ-ММ-ДД“ в часовата зона на браузъра. */
export function todayIso(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function daysBetween(fromIso: string, toIso: string): number {
  const a = Date.UTC(+fromIso.slice(0, 4), +fromIso.slice(5, 7) - 1, +fromIso.slice(8, 10));
  const b = Date.UTC(+toIso.slice(0, 4), +toIso.slice(5, 7) - 1, +toIso.slice(8, 10));
  return Math.round((b - a) / 86_400_000);
}

export function shortDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString("bg-BG", { day: "numeric", month: "short" });
}

/** Етикет и цвят за срока: „Днес“, „Утре“, „Закъсняла · 3 ноем.“, „до 12 ноем.“ */
export function dueInfo(dueIso: string, done: boolean, now = new Date()): { label: string; tone: string; days: number } {
  const days = daysBetween(todayIso(now), dueIso);
  if (done) return { label: shortDate(dueIso), tone: "bg-white/70 text-slate-500", days };
  if (days < 0) return { label: `Закъсняла · ${shortDate(dueIso)}`, tone: "bg-rose-100 text-rose-800", days };
  if (days === 0) return { label: "Днес", tone: "bg-amber-200 text-amber-900", days };
  if (days === 1) return { label: "Утре", tone: "bg-amber-100 text-amber-900", days };
  if (days < 7) {
    const weekday = new Date(`${dueIso}T12:00:00`).toLocaleDateString("bg-BG", { weekday: "long" });
    return { label: `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} · ${shortDate(dueIso)}`, tone: "bg-white/70 text-slate-700", days };
  }
  return { label: `до ${shortDate(dueIso)}`, tone: "bg-white/70 text-slate-600", days };
}

/** Закачените горе; после неизпълнените; задачите — по срок; останалите — най-новите първо. */
export function sortNotes(list: NoteItem[], byDue = false): NoteItem[] {
  return [...list].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (byDue && a.dueDate && b.dueDate && a.dueDate !== b.dueDate) return a.dueDate < b.dueDate ? -1 : 1;
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

/** Неизпълнените задачи до 7 дни напред (и закъснелите) — за таблото. */
export function upcomingTasks(list: NoteItem[], now = new Date()): NoteItem[] {
  const today = todayIso(now);
  return list
    .filter((n) => n.dueDate && !n.done && daysBetween(today, n.dueDate) <= 7)
    .sort((a, b) => (a.dueDate! < b.dueDate! ? -1 : a.dueDate! > b.dueDate! ? 1 : 0));
}
