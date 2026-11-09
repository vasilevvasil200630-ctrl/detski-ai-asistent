"use client";

import { useSyncExternalStore } from "react";
import type { NoteItem } from "@/lib/notes-shared";

/**
 * Напомнянията за днес — общи за менюто (брояча), долната лента и прозореца „Напомняния“.
 * Зареждат се при смяна на страницата и след всяка промяна в бележника (събитие `detski-notes-changed`).
 */

type State = { today: string | null; reminders: NoteItem[] };
let state: State = { today: null, reminders: [] };
const listeners = new Set<() => void>();
let inflight: Promise<void> | null = null;

function emit(next: State) {
  state = next;
  listeners.forEach((l) => l());
}

export function refreshReminders(): Promise<void> {
  if (inflight) return inflight;
  inflight = fetch("/api/notes/reminders", { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : null))
    .then((d: State | null) => {
      if (d) emit({ today: d.today, reminders: d.reminders });
    })
    .catch(() => undefined)
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/** Бележникът казва „нещо се промени“ — броячът и прозорецът се опресняват. */
export function notesChanged() {
  window.dispatchEvent(new Event("detski-notes-changed"));
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

const EMPTY: State = { today: null, reminders: [] };

export function useReminders(): State {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => EMPTY,
  );
}
