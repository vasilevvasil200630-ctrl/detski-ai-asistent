"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CalendarDays, Check, ExternalLink, EyeOff, Loader2, Pencil, QrCode, Send, ShieldCheck, Trash2, Undo2, X } from "lucide-react";
import { toast } from "@/components/Toaster";
import { PARENT_POST_KINDS, PARENT_POST_LABEL, type GroupView, type ParentPostKind, type ParentPostView } from "@/lib/parents-shared";

/** Чернова от „Материали за печат“ („Покажи на родителите“) — пази се до отварянето на тази страница. */
export const PARENT_DRAFT_KEY = "detski-parent-post-draft";
export type ParentDraft = { kind: ParentPostKind; title: string; body: string; printable?: unknown };

type Data = { posts: ParentPostView[]; group: { id: string; slug: string; label: string } | null; isAdmin: boolean };
type Draft = { kind: ParentPostKind; title: string; body: string; eventDate: string; groupId: string; printable?: unknown };

const EMPTY: Draft = { kind: "NOTICE", title: "", body: "", eventDate: "", groupId: "", printable: undefined };

async function api<T>(url: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init.headers ?? {}) } });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data.error ?? "Нещо се обърка. Опитайте пак.");
  return data;
}

const STATUS: Record<ParentPostView["status"], { label: string; tone: string }> = {
  PENDING: { label: "Чака одобрение", tone: "bg-amber-100 text-amber-900" },
  APPROVED: { label: "Публикувано", tone: "bg-emerald-100 text-emerald-900" },
  RETURNED: { label: "Върнато", tone: "bg-rose-100 text-rose-900" },
};

const dateLabel = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString("bg-BG", { day: "numeric", month: "long", weekday: "long" });

/**
 * „За родителите“: учителят предлага обява, покана или писмо и стихче или песен за страницата на
 * своята група; директорът одобрява, връща с бележка или скрива (публикациите на директора — веднага).
 */
export function ParentPostsModule() {
  const [data, setData] = useState<Data | null>(null);
  const [review, setReview] = useState<ParentPostView[] | null>(null);
  const [groups, setGroups] = useState<GroupView[]>([]);
  const [tab, setTab] = useState<"mine" | "review" | "published">("mine");
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const adminTabSet = useRef(false);

  const load = useCallback(async () => {
    try {
      const d = await api<Data>("/api/parent-posts");
      setData(d);
      if (d.isAdmin) {
        if (!adminTabSet.current) {
          adminTabSet.current = true;
          setTab("review");
        }
        const [r, g] = await Promise.all([api<{ posts: ParentPostView[] }>("/api/parent-posts?scope=review"), api<{ groups: GroupView[] }>("/api/admin/groups")]);
        setReview(r.posts);
        setGroups(g.groups);
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : "Не успях да заредя публикациите.", "error");
    }
  }, []);

  useEffect(() => {
    void load();
    // Чернова от „Материали за печат“
    try {
      const raw = sessionStorage.getItem(PARENT_DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw) as ParentDraft;
        setDraft({ ...EMPTY, kind: d.kind, title: d.title.slice(0, 120), body: d.body.slice(0, 6000), printable: d.printable });
        sessionStorage.removeItem(PARENT_DRAFT_KEY);
      }
    } catch {
      // без чернова
    }
  }, [load]);

  const pending = useMemo(() => review?.filter((p) => p.status === "PENDING") ?? [], [review]);
  const published = useMemo(() => review?.filter((p) => p.status === "APPROVED") ?? [], [review]);
  const canPost = Boolean(data && (data.isAdmin || data.group));

  async function submit() {
    if (!data) return;
    setBusy(true);
    try {
      const body = {
        kind: draft.kind,
        title: draft.title,
        body: draft.body,
        eventDate: draft.eventDate || null,
        ...(data.isAdmin ? { groupId: draft.groupId || null } : {}),
        ...(draft.printable ? { printable: draft.printable } : {}),
      };
      if (editing) {
        await api(`/api/parent-posts/${editing}`, { method: "PATCH", body: JSON.stringify({ title: body.title, body: body.body, eventDate: body.eventDate }) });
        toast(data.isAdmin ? "Публикацията е обновена." : "Поправено — отново чака одобрение от директора.", "success");
      } else {
        await api("/api/parent-posts", { method: "POST", body: JSON.stringify(body) });
        toast(data.isAdmin ? "Публикувано за родителите." : "Изпратено на директора за одобрение.", "success");
      }
      setDraft(EMPTY);
      setEditing(null);
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Не успях да запиша.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function remove(p: ParentPostView) {
    if (!window.confirm(`Да изтрия ли „${p.title}“? Родителите вече няма да я виждат.`)) return;
    try {
      await api(`/api/parent-posts/${p.id}`, { method: "DELETE" });
      toast("Изтрито.", "success");
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Не успях да изтрия.", "error");
    }
  }

  async function decide(p: ParentPostView, action: "approve" | "return" | "hide") {
    let note = "";
    if (action === "return") {
      note = window.prompt("Какво да промени колегата? (вижда го в „За родителите“)", "")?.trim() ?? "";
      if (note.length < 3) return;
    }
    if (action === "hide") note = "Скрито от директора.";
    try {
      await api(`/api/parent-posts/${p.id}/review`, { method: "POST", body: JSON.stringify(action === "approve" ? { action } : { action: "return", note }) });
      toast(action === "approve" ? "Одобрено — родителите го виждат." : action === "hide" ? "Скрито от родителите." : "Върнато на колегата.", "success");
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Не успях.", "error");
    }
  }

  function startEdit(p: ParentPostView) {
    setEditing(p.id);
    setDraft({ kind: p.kind, title: p.title, body: p.body, eventDate: p.eventDate ?? "", groupId: p.groupId ?? "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const input = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#4d7a0a] focus:outline-none focus:ring-2 focus:ring-[#4d7a0a]/20";
  const tabBtn = (on: boolean) => `rounded-lg px-3 py-1.5 text-sm font-medium ${on ? "bg-[#f4f9e8] text-[#4d7a0a]" : "text-slate-600 hover:text-slate-900"}`;

  const list = tab === "mine" ? data?.posts ?? [] : tab === "review" ? pending : published;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="flex flex-col gap-3 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">За родителите</h1>
          <p className="mt-1.5 max-w-2xl leading-relaxed text-slate-600">
            Обяви, покани и писма, стихчета и песни за страницата на групата. Родителите ги виждат, след като директорът ги одобри.
          </p>
        </div>
        {data?.group && (
          <Link href={`/grupi/${data.group.slug}`} target="_blank" className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
            <ExternalLink className="h-4 w-4" aria-hidden /> Страницата на {data.group.label}
          </Link>
        )}
        {data && (data.group || data.isAdmin) && (
          <Link href="/showcase/qr" className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
            <QrCode className="h-4 w-4" aria-hidden /> QR плакат
          </Link>
        )}
      </header>

      {data === null ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" aria-label="Зареждане" />
        </div>
      ) : !canPost ? (
        <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-relaxed text-amber-900">
          Директорът още не ви е сложил в група. Помолете го да го направи от „Управление на екипа“ — тогава ще можете да публикувате
          за родителите на вашата група.
        </p>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
          className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-5"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold text-slate-900">{editing ? "Поправка на публикацията" : "Нова публикация"}</h2>
            {editing && (
              <button type="button" onClick={() => (setEditing(null), setDraft(EMPTY))} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
                <X className="h-4 w-4" aria-hidden /> Откажи
              </button>
            )}
          </div>
          {!editing && (
            <div role="radiogroup" aria-label="Вид" className="flex flex-wrap gap-2">
              {PARENT_POST_KINDS.map((k) => (
                <button
                  key={k.id}
                  type="button"
                  role="radio"
                  aria-checked={draft.kind === k.id}
                  onClick={() => setDraft({ ...draft, kind: k.id })}
                  title={k.hint}
                  className={`rounded-xl border px-3.5 py-2 text-sm font-semibold ${draft.kind === k.id ? "border-[#4d7a0a] bg-[#4d7a0a] text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
                >
                  {k.label}
                </button>
              ))}
            </div>
          )}
          <p className="text-xs text-slate-500">{PARENT_POST_KINDS.find((k) => k.id === draft.kind)?.hint}</p>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-800">Заглавие</span>
            <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} maxLength={120} className={input} placeholder="напр. Родителска среща" required />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-800">Текст</span>
            <textarea value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} maxLength={6000} rows={7} className={`${input} resize-y leading-relaxed`} required />
          </label>
          <div className="flex flex-wrap gap-4">
            {draft.kind !== "VERSES" && (
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-800">Дата на събитието (по желание)</span>
                <input type="date" value={draft.eventDate} onChange={(e) => setDraft({ ...draft, eventDate: e.target.value })} className={input} />
              </label>
            )}
            {data.isAdmin && !editing && (
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-800">За кого</span>
                <select value={draft.groupId} onChange={(e) => setDraft({ ...draft, groupId: e.target.value })} className={input}>
                  <option value="">Цялата градина (началната страница)</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
          {draft.printable !== undefined && <p className="text-xs text-emerald-800">Добавен е и материалът за печат — родителите ще могат да го отпечатат.</p>}
          <p className="rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
            <ShieldCheck className="mr-1 inline h-3.5 w-3.5 text-[#1a7f45]" aria-hidden />
            Без имена, снимки или лични данни на деца. Страницата на групата е публична — вижда я всеки с връзката.
          </p>
          <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-[#4d7a0a] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#3d6108] disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
            {editing ? "Запази" : data.isAdmin ? "Публикувай" : "Изпрати за одобрение"}
          </button>
        </form>
      )}

      {data && (
        <section className="mt-8">
          {data.isAdmin && (
            <div role="tablist" aria-label="Публикации" className="mb-4 inline-flex rounded-xl border border-slate-200 bg-white p-1">
              <button type="button" role="tab" aria-selected={tab === "review"} onClick={() => setTab("review")} className={tabBtn(tab === "review")}>
                За одобрение {pending.length > 0 && <span className="ml-1 rounded-full bg-amber-500 px-1.5 text-xs font-bold text-white">{pending.length}</span>}
              </button>
              <button type="button" role="tab" aria-selected={tab === "published"} onClick={() => setTab("published")} className={tabBtn(tab === "published")}>
                Публикувани <span className="text-slate-400">{published.length}</span>
              </button>
              <button type="button" role="tab" aria-selected={tab === "mine"} onClick={() => setTab("mine")} className={tabBtn(tab === "mine")}>
                Моите <span className="text-slate-400">{data.posts.length}</span>
              </button>
            </div>
          )}
          {!data.isAdmin && <h2 className="mb-3 text-lg font-bold text-slate-900">Моите публикации</h2>}
          {list.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500">
              {tab === "review" ? "Няма нищо за одобрение." : tab === "published" ? "Още няма публикувано за родителите." : "Още нямате публикации."}
            </p>
          ) : (
            <ul className="space-y-3">
              {list.map((p) => (
                <li key={p.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-md bg-sky-50 px-2 py-0.5 font-semibold text-[#4d7a0a]">{PARENT_POST_LABEL[p.kind]}</span>
                    <span className={`rounded-md px-2 py-0.5 font-semibold ${STATUS[p.status].tone}`}>{STATUS[p.status].label}</span>
                    <span className="text-slate-500">{p.groupLabel ?? "Цялата градина"}</span>
                    {!p.mine && (
                      <span className="text-slate-500">
                        · {p.author.avatar} {p.author.name}
                      </span>
                    )}
                    {p.eventDate && (
                      <span className="inline-flex items-center gap-1 text-slate-600">
                        <CalendarDays className="h-3.5 w-3.5" aria-hidden /> {dateLabel(p.eventDate)}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-2 font-semibold text-slate-900">{p.title}</h3>
                  <p className="mt-1 line-clamp-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{p.body}</p>
                  {p.status === "RETURNED" && p.reviewNote && (
                    <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-900">Бележка от директора: {p.reviewNote}</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {data.isAdmin && p.status === "PENDING" && (
                      <>
                        <button type="button" onClick={() => void decide(p, "approve")} className="inline-flex items-center gap-1 rounded-lg bg-[#1a7f45] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#146636]">
                          <Check className="h-4 w-4" aria-hidden /> Одобри
                        </button>
                        <button type="button" onClick={() => void decide(p, "return")} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                          <Undo2 className="h-4 w-4" aria-hidden /> Върни с бележка
                        </button>
                      </>
                    )}
                    {data.isAdmin && p.status === "APPROVED" && !p.mine && (
                      <button type="button" onClick={() => void decide(p, "hide")} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                        <EyeOff className="h-4 w-4" aria-hidden /> Скрий от родителите
                      </button>
                    )}
                    {p.mine && (
                      <button type="button" onClick={() => startEdit(p)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                        <Pencil className="h-4 w-4" aria-hidden /> Поправи
                      </button>
                    )}
                    {(p.mine || data.isAdmin) && (
                      <button type="button" onClick={() => void remove(p)} className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold text-rose-700 hover:bg-rose-50">
                        <Trash2 className="h-4 w-4" aria-hidden /> Изтрий
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}
