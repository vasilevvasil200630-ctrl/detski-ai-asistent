"use client";

import { toast } from "@/components/Toaster";
import type { NoteColor, NoteItem } from "@/lib/notes-shared";

export type NoteDraft = { title: string; body: string; color: NoteColor; pinned: boolean; dueDate: string | null };

async function call<T>(url: string, init: RequestInit, fail: string): Promise<T | null> {
  try {
    const res = await fetch(url, init);
    const data = (await res.json().catch(() => ({}))) as T & { error?: string };
    if (!res.ok) {
      toast(data.error ?? fail, "error");
      return null;
    }
    return data;
  } catch {
    toast("Няма връзка със сървъра.", "error");
    return null;
  }
}

const JSON_HEADERS = { "Content-Type": "application/json" };

export async function listNotes(): Promise<NoteItem[] | null> {
  const r = await call<{ notes: NoteItem[] }>("/api/notes", { cache: "no-store" }, "Бележките не можаха да се заредят.");
  return r?.notes ?? null;
}

export async function createNote(d: NoteDraft): Promise<NoteItem | null> {
  const r = await call<{ note: NoteItem }>("/api/notes", { method: "POST", headers: JSON_HEADERS, body: JSON.stringify(d) }, "Бележката не беше запазена.");
  return r?.note ?? null;
}

export async function updateNote(id: string, p: Partial<NoteDraft & { done: boolean }>): Promise<NoteItem | null> {
  const r = await call<{ note: NoteItem }>(`/api/notes/${id}`, { method: "PATCH", headers: JSON_HEADERS, body: JSON.stringify(p) }, "Промяната не беше запазена.");
  return r?.note ?? null;
}

export async function deleteNote(id: string): Promise<boolean> {
  const r = await call<{ ok: true }>(`/api/notes/${id}`, { method: "DELETE" }, "Бележката не беше изтрита.");
  return Boolean(r);
}
