"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BellRing, CalendarClock, Check, Clock, X } from "lucide-react";
import { toast } from "@/components/Toaster";
import { updateNote } from "@/lib/client/notes";
import { notesChanged, refreshReminders, useReminders } from "@/lib/client/reminders";
import { addDaysIso, type NoteItem } from "@/lib/notes-shared";
import { dueInfo } from "./noteDates";

const SEEN_KEY = "detski-reminders-seen";
const NOTIFIED_KEY = "detski-reminders-notified";

/** Списък с id за деня в паметта на браузъра (кое е затворено / за кое е звъннато). */
function readDay(key: string, today: string): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(key) ?? "null") as { day?: string; ids?: string[] } | null;
    return raw?.day === today && Array.isArray(raw.ids) ? raw.ids : [];
  } catch {
    return [];
  }
}
function writeDay(key: string, today: string, ids: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify({ day: today, ids }));
  } catch {
    // без памет в браузъра — пак работи, само ще се покаже отново
  }
}

export const noteLabel = (n: Pick<NoteItem, "title" | "body">) => n.title || n.body.split(/\r?\n/).find((l) => l.trim()) || "Задача";

export function dueText(n: NoteItem): string {
  const due = dueInfo(n.dueDate!, false);
  return n.dueTime ? `${due.label}, ${n.dueTime} ч.` : due.label;
}

/**
 * „Напомняния за днес“: малък прозорец горе вдясно при отваряне на сайта, със „Готово“ и
 * „Утре пак“. Затвореният не се показва повторно до утре (освен ако не дойде ново напомняне).
 * Ако учителят е разрешил известия, браузърът показва и системно известие веднъж на ден.
 */
export function ReminderCenter() {
  const pathname = usePathname();
  const router = useRouter();
  const { today, reminders } = useReminders();
  const [hidden, setHidden] = useState<string[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    void refreshReminders();
  }, [pathname]);

  useEffect(() => {
    const refresh = () => void refreshReminders();
    const onVisible = () => document.visibilityState === "visible" && refresh();
    window.addEventListener("detski-notes-changed", refresh);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("detski-notes-changed", refresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  useEffect(() => {
    if (today) setHidden(readDay(SEEN_KEY, today));
  }, [today]);

  const fresh = useMemo(() => (hidden === null ? [] : reminders.filter((r) => !hidden.includes(r.id))), [reminders, hidden]);

  // Системно известие (ако е разрешено) — по веднъж на ден за задача
  useEffect(() => {
    if (!today || fresh.length === 0 || typeof Notification === "undefined" || Notification.permission !== "granted") return;
    const done = readDay(NOTIFIED_KEY, today);
    const todo = fresh.filter((n) => !done.includes(n.id));
    if (todo.length === 0) return;
    try {
      const first = todo[0]!;
      const note = new Notification(todo.length === 1 ? `Напомняне: ${noteLabel(first)}` : `Имате ${todo.length} напомняния`, {
        body: todo.length === 1 ? dueText(first) : todo.slice(0, 3).map((n) => `• ${noteLabel(n)} — ${dueText(n)}`).join("\n"),
        tag: "detski-reminders",
        icon: "/icon-192.png",
      });
      note.onclick = () => {
        window.focus();
        router.push("/notebook");
      };
    } catch {
      // някои телефони показват известия само през приложението — прозорецът в сайта остава
    }
    writeDay(NOTIFIED_KEY, today, [...done, ...todo.map((n) => n.id)]);
  }, [fresh, today, router]);

  if (!today || pathname === "/notebook" || fresh.length === 0) return null;

  const dismiss = () => {
    const ids = [...(hidden ?? []), ...reminders.map((r) => r.id)];
    writeDay(SEEN_KEY, today, ids);
    setHidden(ids);
  };

  async function act(n: NoteItem, kind: "done" | "snooze") {
    setBusy(n.id);
    const saved = await updateNote(n.id, kind === "done" ? { done: true } : { snoozedUntil: addDaysIso(today!, 1) });
    setBusy(null);
    if (!saved) return;
    toast(kind === "done" ? "Отметнато като изпълнено." : "Ще ви напомня утре.", "success");
    notesChanged();
  }

  const shown = fresh.slice(0, 4);
  return (
    <section
      role="region"
      aria-label="Напомняния за днес"
      className="fixed inset-x-3 top-[4.5rem] z-40 mx-auto max-w-sm rounded-2xl border border-amber-200 bg-white p-4 shadow-xl print:hidden sm:inset-x-auto sm:right-5"
    >
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-amber-100 text-amber-700">
          <BellRing className="h-4 w-4" aria-hidden />
        </span>
        <h2 className="flex-1 text-sm font-bold text-slate-900">
          {fresh.length === 1 ? "Напомняне" : `Напомняния · ${fresh.length}`}
        </h2>
        <button type="button" onClick={dismiss} aria-label="Затвори до утре" title="Затвори до утре" className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800">
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
      <ul className="mt-3 space-y-2.5">
        {shown.map((n) => {
          const overdue = n.dueDate! < today;
          return (
            <li key={n.id} className="rounded-xl bg-slate-50 px-3 py-2.5">
              <p className="line-clamp-2 text-sm font-semibold text-slate-900">{noteLabel(n)}</p>
              <p className={`mt-0.5 flex items-center gap-1 text-xs ${overdue ? "font-semibold text-rose-700" : "text-slate-600"}`}>
                <CalendarClock className="h-3.5 w-3.5" aria-hidden /> {dueText(n)}
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  disabled={busy === n.id}
                  onClick={() => void act(n, "done")}
                  className="inline-flex items-center gap-1 rounded-lg bg-[#1a7f45] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#146636] disabled:opacity-60"
                >
                  <Check className="h-3.5 w-3.5" aria-hidden /> Готово
                </button>
                <button
                  type="button"
                  disabled={busy === n.id}
                  onClick={() => void act(n, "snooze")}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                >
                  <Clock className="h-3.5 w-3.5" aria-hidden /> Утре пак
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="mt-3 flex items-center justify-between text-sm">
        <Link href="/notebook" className="font-semibold text-[#0a4b82] hover:underline">
          {fresh.length > shown.length ? `Още ${fresh.length - shown.length} в бележника` : "Към бележника"}
        </Link>
        <button type="button" onClick={dismiss} className="text-xs text-slate-500 hover:text-slate-800">
          Затвори до утре
        </button>
      </div>
    </section>
  );
}
