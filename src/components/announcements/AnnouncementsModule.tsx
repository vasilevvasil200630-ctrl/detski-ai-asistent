"use client";

import { useCallback, useEffect, useState } from "react";
import { BellRing, CalendarDays, Check, Loader2, Megaphone, Pencil, Pin, Plus, Trash2, Users } from "lucide-react";
import { useMe } from "@/lib/client/useMe";
import { toast } from "@/components/Toaster";
import { VoiceMic } from "@/components/VoiceMic";
import { BODY_MAX, TITLE_MAX, type AnnouncementView } from "@/lib/announcements-shared";

export const ANNOUNCEMENTS_CHANGED = "detski-announcements-changed";

const dateBg = (iso: string) => new Date(iso).toLocaleDateString("bg-BG", { day: "numeric", month: "long", year: "numeric" });
const eventBg = (ymd: string) => new Date(`${ymd}T12:00:00Z`).toLocaleDateString("bg-BG", { weekday: "long", day: "numeric", month: "long" });

async function api<T>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json" } });
    const data = (await res.json().catch(() => ({}))) as T & { error?: string };
    if (!res.ok) {
      toast(data.error ?? "Действието не успя.", "error");
      return null;
    }
    return data;
  } catch {
    toast("Няма връзка със сървъра.", "error");
    return null;
  }
}

type Draft = { title: string; body: string; important: boolean; pinned: boolean; eventDate: string };
const EMPTY: Draft = { title: "", body: "", important: false, pinned: false, eventDate: "" };

/** Обявите от директора: директорът пише, учителите четат и потвърждават важните. */
export function AnnouncementsModule() {
  const { user } = useMe();
  const isAdmin = user?.kgRole === "ADMIN";
  const [items, setItems] = useState<AnnouncementView[] | null>(null);
  const [editing, setEditing] = useState<{ id: string | null; draft: Draft } | null>(null);
  const [busy, setBusy] = useState(false);
  const [readers, setReaders] = useState<{ id: string; read: { name: string; avatar: string; readAt: string }[]; notRead: { name: string; avatar: string }[] } | null>(null);

  const load = useCallback(async () => {
    const data = await api<{ items: AnnouncementView[] }>("/api/announcements");
    const list = data?.items ?? [];
    setItems(list);
    // Обикновените обяви се отбелязват като прочетени при отваряне; важните — с бутона „Прочетох“
    const plain = list.filter((i) => !i.important && !i.readByMe);
    if (plain.length) {
      await Promise.all(plain.map((i) => fetch(`/api/announcements/${i.id}/read`, { method: "POST" }).catch(() => null)));
      const done = new Set(plain.map((i) => i.id));
      setItems((prev) => prev?.map((i) => (done.has(i.id) ? { ...i, readByMe: true } : i)) ?? prev);
      window.dispatchEvent(new Event(ANNOUNCEMENTS_CHANGED));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const markRead = async (item: AnnouncementView) => {
    if (await api(`/api/announcements/${item.id}/read`, { method: "POST" })) {
      setItems((prev) => prev?.map((i) => (i.id === item.id ? { ...i, readByMe: true } : i)) ?? prev);
      window.dispatchEvent(new Event(ANNOUNCEMENTS_CHANGED));
    }
  };

  const save = async () => {
    if (!editing || busy) return;
    setBusy(true);
    const { id, draft } = editing;
    const body = JSON.stringify({ ...draft, eventDate: draft.eventDate || null });
    const data = await api<{ item: AnnouncementView }>(id ? `/api/announcements/${id}` : "/api/announcements", { method: id ? "PATCH" : "POST", body });
    setBusy(false);
    if (data) {
      toast(id ? "Обявата е променена." : "Обявата е публикувана за екипа.", "success");
      setEditing(null);
      void load();
    }
  };

  const remove = async (item: AnnouncementView) => {
    if (!window.confirm(`Да изтрия ли обявата „${item.title}“?`)) return;
    if (await api(`/api/announcements/${item.id}`, { method: "DELETE" })) {
      setItems((prev) => prev?.filter((i) => i.id !== item.id) ?? prev);
      window.dispatchEvent(new Event(ANNOUNCEMENTS_CHANGED));
    }
  };

  const showReaders = async (item: AnnouncementView) => {
    if (readers?.id === item.id) return setReaders(null);
    const data = await api<{ read: { name: string; avatar: string; readAt: string }[]; notRead: { name: string; avatar: string }[] }>(`/api/announcements/${item.id}/read`);
    if (data) setReaders({ id: item.id, ...data });
  };

  const d = editing?.draft;
  const setD = (patch: Partial<Draft>) => setEditing((e) => (e ? { ...e, draft: { ...e.draft, ...patch } } : e));
  const problem = d ? (d.title.trim().length < 3 ? "Напишете заглавие." : d.body.trim().length < 3 ? "Напишете текста." : null) : null;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            <Megaphone className="h-7 w-7 text-[#0a4b82]" aria-hidden /> Обяви
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {isAdmin
              ? "Съобщения до целия екип: съвети, срокове, празници. При „Важно“ виждате кой е прочел."
              : "Съобщенията от директора. Потвърдете важните с „Прочетох“."}
          </p>
        </div>
        {isAdmin && !editing && (
          <button
            type="button"
            onClick={() => setEditing({ id: null, draft: EMPTY })}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#0a4b82] px-4 py-2 text-sm font-semibold text-white hover:bg-[#083861]"
          >
            <Plus className="h-4 w-4" aria-hidden /> Нова обява
          </button>
        )}
      </div>

      {editing && d && (
        <section aria-label={editing.id ? "Промяна на обява" : "Нова обява"} className="mt-5 space-y-4 rounded-2xl border border-[#0a4b82]/30 bg-sky-50/40 p-4 sm:p-5">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-800">Заглавие</span>
            <input
              value={d.title}
              onChange={(e) => setD({ title: e.target.value })}
              maxLength={TITLE_MAX}
              placeholder="Напр. „Педагогически съвет в четвъртък“"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm"
            />
          </label>
          <div>
            <label htmlFor="announcement-body" className="mb-1.5 block text-sm font-semibold text-slate-800">
              Текст
            </label>
            <div className="flex items-start gap-2">
              <textarea
                id="announcement-body"
                value={d.body}
                onChange={(e) => setD({ body: e.target.value })}
                maxLength={BODY_MAX}
                rows={5}
                className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm leading-relaxed"
              />
              <VoiceMic onTranscript={(t) => setD({ body: d.body ? `${d.body} ${t}` : t })} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <CalendarDays className="h-4 w-4 text-slate-500" aria-hidden /> Дата на събитието
              <input type="date" value={d.eventDate} onChange={(e) => setD({ eventDate: e.target.value })} className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm" />
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={d.important} onChange={(e) => setD({ important: e.target.checked })} className="h-4 w-4 accent-[#0a4b82]" />
              Важно — учителите потвърждават, че са прочели
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={d.pinned} onChange={(e) => setD({ pinned: e.target.checked })} className="h-4 w-4 accent-[#0a4b82]" />
              Закачи най-горе
            </label>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {problem && <p className="mr-auto text-sm font-semibold text-amber-700">{problem}</p>}
            <button type="button" onClick={() => setEditing(null)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Отказ
            </button>
            <button
              type="button"
              onClick={save}
              disabled={busy || Boolean(problem)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0a4b82] px-5 py-2 text-sm font-semibold text-white hover:bg-[#083861] disabled:opacity-50"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} {editing.id ? "Запази" : "Публикувай"}
            </button>
          </div>
        </section>
      )}

      <section className="mt-6">
        {items === null ? (
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-slate-400" aria-label="Зареждане" />
        ) : items.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
            {isAdmin ? "Още няма обяви. Напишете първата с „Нова обява“." : "Още няма обяви от директора."}
          </p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item.id}
                className={`rounded-2xl border bg-white p-4 shadow-sm sm:p-5 ${item.important && !item.readByMe ? "border-amber-300 ring-1 ring-amber-200" : "border-slate-200"}`}
              >
                <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
                  {item.pinned && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-700">
                      <Pin className="h-3.5 w-3.5" aria-hidden /> Закачена
                    </span>
                  )}
                  {item.important && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-amber-900">
                      <BellRing className="h-3.5 w-3.5" aria-hidden /> Важно
                    </span>
                  )}
                  {item.eventDate && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-0.5 text-[#0a4b82]">
                      <CalendarDays className="h-3.5 w-3.5" aria-hidden /> {eventBg(item.eventDate)}
                    </span>
                  )}
                </div>
                <h2 className="mt-2 text-lg font-bold text-slate-900">{item.title}</h2>
                <p className="text-xs text-slate-500">
                  {item.authorAvatar} {item.authorName} · {dateBg(item.createdAt)}
                </p>
                <p className="mt-3 whitespace-pre-wrap leading-relaxed text-slate-800">{item.body}</p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {item.readByMe ? (
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">
                      <Check className="h-4 w-4" aria-hidden /> Прочетено
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => markRead(item)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
                    >
                      <Check className="h-4 w-4" aria-hidden /> Прочетох
                    </button>
                  )}
                  {isAdmin && (
                    <>
                      {item.reads && (
                        <button
                          type="button"
                          onClick={() => showReaders(item)}
                          aria-expanded={readers?.id === item.id}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <Users className="h-4 w-4" aria-hidden /> Прочели: {item.reads.count} от {item.reads.total}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setEditing({ id: item.id, draft: { title: item.title, body: item.body, important: item.important, pinned: item.pinned, eventDate: item.eventDate ?? "" } })
                        }
                        aria-label={`Промени „${item.title}“`}
                        className="ml-auto grid h-9 w-9 place-items-center rounded-lg text-slate-600 hover:bg-slate-100"
                      >
                        <Pencil className="h-4 w-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(item)}
                        aria-label={`Изтрий „${item.title}“`}
                        className="grid h-9 w-9 place-items-center rounded-lg text-rose-700 hover:bg-rose-50"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </>
                  )}
                </div>

                {readers?.id === item.id && (
                  <div className="mt-3 grid gap-3 rounded-xl bg-slate-50 p-3 text-sm sm:grid-cols-2">
                    <div>
                      <p className="font-semibold text-emerald-800">Прочели ({readers.read.length})</p>
                      <ul className="mt-1 space-y-0.5 text-slate-700">
                        {readers.read.map((u) => (
                          <li key={u.name + u.readAt}>
                            {u.avatar} {u.name} <span className="text-xs text-slate-500">· {dateBg(u.readAt)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold text-amber-800">Още не са прочели ({readers.notRead.length})</p>
                      <ul className="mt-1 space-y-0.5 text-slate-700">
                        {readers.notRead.map((u) => (
                          <li key={u.name}>
                            {u.avatar} {u.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
