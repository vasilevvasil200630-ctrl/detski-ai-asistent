"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Bell, BellOff, BellRing, CalendarClock, CalendarPlus, Check, Clock, FolderLock, Library, Loader2, Lock, Pencil, Pin, PinOff, Search, Trash2, X } from "lucide-react";
import { toast } from "@/components/Toaster";
import { VoiceMic } from "@/components/VoiceMic";
import { DEFAULT_REMIND_DAYS, isReminderActive, NOTE_COLORS, REMIND_OPTIONS, remindLabel, type NoteColor, type NoteItem } from "@/lib/notes-shared";
import { createNote, deleteNote, listNotes, updateNote, type NoteDraft, type NotePatch } from "@/lib/client/notes";
import { notesChanged } from "@/lib/client/reminders";
import { dueInfo, shortDate, sortNotes, todayIso } from "./noteDates";
import { ReminderSettings } from "./ReminderSettings";

const COLOR_STYLE: Record<NoteColor, { card: string; dot: string; name: string }> = {
  yellow: { card: "bg-amber-50 border-amber-200", dot: "bg-amber-300", name: "жълто" },
  blue: { card: "bg-sky-50 border-sky-200", dot: "bg-sky-300", name: "синьо" },
  green: { card: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-300", name: "зелено" },
  pink: { card: "bg-pink-50 border-pink-200", dot: "bg-pink-300", name: "розово" },
  violet: { card: "bg-violet-50 border-violet-200", dot: "bg-violet-300", name: "лилаво" },
};

const EMPTY: NoteDraft = { title: "", body: "", color: "yellow", pinned: false, dueDate: null, dueTime: null, remindDays: null };

const TABS = [
  { id: "all", label: "Всички" },
  { id: "tasks", label: "Със срок" },
  { id: "done", label: "Изпълнени" },
] as const;
type Tab = (typeof TABS)[number]["id"];

/** Полетата на бележка — за новата най-горе и за редакция на място. */
function NoteEditor({
  initial,
  onSave,
  onCancel,
  autoFocus,
  idPrefix,
}: {
  initial: NoteDraft;
  onSave: (d: NoteDraft) => Promise<boolean>;
  onCancel?: () => void;
  autoFocus?: boolean;
  idPrefix: string;
}) {
  const [d, setD] = useState<NoteDraft>(initial);
  const [saving, setSaving] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const empty = !d.title.trim() && !d.body.trim();

  useEffect(() => {
    if (autoFocus) bodyRef.current?.focus();
  }, [autoFocus]);

  async function submit() {
    if (empty || saving) return;
    setSaving(true);
    const ok = await onSave(d);
    setSaving(false);
    if (ok && !onCancel) setD({ ...EMPTY, color: d.color });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          void submit();
        }
        if (e.key === "Escape" && onCancel) onCancel();
      }}
      className={`rounded-2xl border p-4 ${COLOR_STYLE[d.color].card}`}
    >
      <label htmlFor={`${idPrefix}-title`} className="sr-only">
        Заглавие
      </label>
      <input
        id={`${idPrefix}-title`}
        value={d.title}
        maxLength={160}
        onChange={(e) => setD({ ...d, title: e.target.value })}
        placeholder="Заглавие (по желание)"
        className="w-full bg-transparent text-base font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none"
      />
      <div className="mt-1 flex items-start gap-2">
        <label htmlFor={`${idPrefix}-body`} className="sr-only">
          Бележка
        </label>
        <textarea
          id={`${idPrefix}-body`}
          ref={bodyRef}
          value={d.body}
          maxLength={8000}
          rows={onCancel ? 5 : 3}
          onChange={(e) => setD({ ...d, body: e.target.value })}
          placeholder="Напишете бележка — напр. „Да подготвя табло за есента“ или „Родителска среща в четвъртък“"
          className="min-h-[4.5rem] w-full resize-y bg-transparent text-sm leading-relaxed text-slate-800 placeholder:text-slate-400 focus:outline-none"
        />
        <VoiceMic onTranscript={(t) => setD((prev) => ({ ...prev, body: prev.body ? `${prev.body.trimEnd()} ${t}` : t }))} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-black/5 pt-3">
        <div role="radiogroup" aria-label="Цвят на бележката" className="flex items-center gap-1.5">
          {NOTE_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={d.color === c}
              aria-label={COLOR_STYLE[c].name}
              onClick={() => setD({ ...d, color: c })}
              className={`h-6 w-6 rounded-full ${COLOR_STYLE[c].dot} ring-offset-2 transition-shadow ${d.color === c ? "ring-2 ring-slate-700" : "hover:ring-2 hover:ring-slate-300"}`}
            />
          ))}
        </div>
        <label className="flex items-center gap-1.5 text-sm text-slate-600">
          <CalendarClock className="h-4 w-4" aria-hidden />
          <span>Срок</span>
          <input
            type="date"
            value={d.dueDate ?? ""}
            onChange={(e) => {
              const v = e.target.value || null;
              // Нова задача напомня по подразбиране денят преди; без срок — без час и напомняне
              setD({ ...d, dueDate: v, dueTime: v ? d.dueTime : null, remindDays: v ? (d.dueDate ? d.remindDays : DEFAULT_REMIND_DAYS) : null });
            }}
            className="rounded-md border border-black/10 bg-white/70 px-2 py-1 text-sm text-slate-800"
          />
        </label>
        {d.dueDate && (
          <>
            <label className="flex items-center gap-1.5 text-sm text-slate-600">
              <Clock className="h-4 w-4" aria-hidden />
              <span>Час</span>
              <input
                type="time"
                value={d.dueTime ?? ""}
                onChange={(e) => setD({ ...d, dueTime: e.target.value || null })}
                className="rounded-md border border-black/10 bg-white/70 px-2 py-1 text-sm text-slate-800"
              />
            </label>
            <label className="flex items-center gap-1.5 text-sm text-slate-600">
              <Bell className="h-4 w-4" aria-hidden />
              <span>Напомни</span>
              <select
                value={d.remindDays === null ? "" : String(d.remindDays)}
                onChange={(e) => setD({ ...d, remindDays: e.target.value === "" ? null : Number(e.target.value) })}
                className="rounded-md border border-black/10 bg-white/70 px-2 py-1 text-sm text-slate-800"
              >
                {REMIND_OPTIONS.map((o) => (
                  <option key={String(o.value)} value={o.value === null ? "" : String(o.value)}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
        <button
          type="button"
          onClick={() => setD({ ...d, pinned: !d.pinned })}
          aria-pressed={d.pinned}
          className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm ${d.pinned ? "bg-slate-900/80 text-white" : "text-slate-600 hover:bg-black/5"}`}
        >
          <Pin className="h-4 w-4" aria-hidden /> Закачи горе
        </button>
        <div className="ml-auto flex items-center gap-2">
          {onCancel && (
            <button type="button" onClick={onCancel} className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-black/5">
              Откажи
            </button>
          )}
          <button
            type="submit"
            disabled={empty || saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0a4b82] px-4 py-1.5 text-sm font-semibold text-white hover:bg-[#083861] disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {onCancel ? "Запази" : "Добави"}
          </button>
        </div>
      </div>
    </form>
  );
}

function NoteCard({
  note,
  onToggleDone,
  onTogglePin,
  onEdit,
  onDelete,
}: {
  note: NoteItem;
  onToggleDone: () => void;
  onTogglePin: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const due = note.dueDate ? dueInfo(note.dueDate, note.done) : null;
  const today = todayIso();
  const ringing = isReminderActive(note, today);
  const snoozed = !note.done && note.snoozedUntil && note.snoozedUntil > today ? note.snoozedUntil : null;
  return (
    <article className={`group mb-4 break-inside-avoid rounded-2xl border p-4 ${COLOR_STYLE[note.color].card} ${note.done ? "opacity-70" : ""} ${ringing ? "ring-2 ring-amber-400" : ""}`}>
      <div className="flex items-start gap-3">
        {note.dueDate && (
          <button
            type="button"
            onClick={onToggleDone}
            aria-pressed={note.done}
            aria-label={note.done ? "Отбележи като неизпълнена" : "Отбележи като изпълнена"}
            className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 transition-colors ${
              note.done ? "border-[#1a7f45] bg-[#1a7f45] text-white" : "border-slate-400 bg-white hover:border-[#1a7f45]"
            }`}
          >
            {note.done && <Check className="h-3.5 w-3.5" aria-hidden />}
          </button>
        )}
        <div className="min-w-0 flex-1">
          {note.title && <h3 className={`font-semibold text-slate-900 ${note.done ? "line-through" : ""}`}>{note.title}</h3>}
          {note.body && (
            <p className={`whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-800 ${note.title ? "mt-1" : ""} ${note.done && !note.title ? "line-through" : ""}`}>
              {note.body}
            </p>
          )}
        </div>
        {note.pinned && <Pin className="h-4 w-4 shrink-0 text-slate-500" aria-label="Закачена" />}
      </div>
      <div className="mt-3 flex items-center gap-2">
        {due && (
          <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${due.tone}`}>
            <CalendarClock className="h-3.5 w-3.5" aria-hidden /> {due.label}
            {note.dueTime && `, ${note.dueTime}`}
          </span>
        )}
        {note.dueDate && !note.done && (
          <span
            className={`inline-flex items-center gap-1 text-xs ${ringing ? "font-semibold text-amber-800" : "text-slate-500"}`}
            title={note.remindDays === null ? "Без напомняне" : `Напомня ${remindLabel(note.remindDays)}`}
          >
            {ringing ? (
              <><BellRing className="h-3.5 w-3.5" aria-hidden /> напомня</>
            ) : snoozed ? (
              <><Clock className="h-3.5 w-3.5" aria-hidden /> пак на {shortDate(snoozed)}</>
            ) : note.remindDays === null ? (
              <BellOff className="h-3.5 w-3.5" aria-label="Без напомняне" />
            ) : (
              <><Bell className="h-3.5 w-3.5" aria-hidden /> {remindLabel(note.remindDays)}</>
            )}
          </span>
        )}
        <div className="ml-auto flex items-center gap-0.5 opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
          {note.dueDate && !note.done && (
            <a href={`/api/notes/${note.id}/ics`} download aria-label="В календара" title="Добави в календара на телефона или компютъра" className="rounded-md p-1.5 text-slate-600 hover:bg-black/5">
              <CalendarPlus className="h-4 w-4" aria-hidden />
            </a>
          )}
          <button type="button" onClick={onTogglePin} aria-label={note.pinned ? "Откачи" : "Закачи горе"} className="rounded-md p-1.5 text-slate-600 hover:bg-black/5">
            {note.pinned ? <PinOff className="h-4 w-4" aria-hidden /> : <Pin className="h-4 w-4" aria-hidden />}
          </button>
          <button type="button" onClick={onEdit} aria-label="Редактирай" className="rounded-md p-1.5 text-slate-600 hover:bg-black/5">
            <Pencil className="h-4 w-4" aria-hidden />
          </button>
          <button type="button" onClick={onDelete} aria-label="Изтрий" className="rounded-md p-1.5 text-rose-700 hover:bg-rose-100/60">
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </article>
  );
}

/** Личният бележник на учителя: бележки, задачи със срок, закачени. Вижда ги само собственикът. */
export function NotebookModule() {
  const [notes, setNotes] = useState<NoteItem[] | null>(null);
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    void listNotes().then((n) => setNotes(n ?? []));
  }, []);

  const replace = (n: NoteItem) => setNotes((prev) => prev?.map((x) => (x.id === n.id ? n : x)) ?? null);

  async function patch(note: NoteItem, p: NotePatch) {
    replace({ ...note, ...p }); // веднага, после — отговорът от сървъра
    const saved = await updateNote(note.id, p);
    replace(saved ?? note);
    if (saved) notesChanged();
    return Boolean(saved);
  }

  async function remove(note: NoteItem) {
    if (!window.confirm(`Да изтрия ли бележката${note.title ? ` „${note.title}“` : ""}?`)) return;
    if (await deleteNote(note.id)) {
      setNotes((prev) => prev?.filter((x) => x.id !== note.id) ?? null);
      notesChanged();
    }
  }

  const counts = useMemo(() => {
    const list = notes ?? [];
    return { all: list.filter((n) => !n.done).length, tasks: list.filter((n) => n.dueDate && !n.done).length, done: list.filter((n) => n.done).length };
  }, [notes]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = (notes ?? []).filter((n) => {
      if (tab === "tasks" && (!n.dueDate || n.done)) return false;
      if (tab === "done" && !n.done) return false;
      if (tab === "all" && n.done) return false;
      return !q || n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q);
    });
    return sortNotes(list, tab === "tasks");
  }, [notes, tab, query]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Моят бележник</h1>
          <p className="mt-1.5 flex items-center gap-1.5 text-slate-600">
            <Lock className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
            Бележки, задачи и срокове. Вижда ги само вашият профил.
          </p>
        </div>
        <nav aria-label="Лични материали" className="flex flex-wrap gap-2">
          <Link href="/cloud?scope=private" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
            <FolderLock className="h-4 w-4" aria-hidden /> Моите лични файлове
          </Link>
          <Link href="/library" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
            <Library className="h-4 w-4" aria-hidden /> Моята библиотека
          </Link>
        </nav>
      </header>

      <div className="mt-6 max-w-2xl">
        <NoteEditor
          idPrefix="new-note"
          initial={EMPTY}
          onSave={async (d) => {
            const n = await createNote(d);
            if (!n) return false;
            setNotes((prev) => [n, ...(prev ?? [])]);
            notesChanged();
            if (tab === "done") setTab("all");
            return true;
          }}
        />
        <p className="mt-1.5 text-xs text-slate-500">Ctrl + Enter запазва. Бележка със срок става задача, която отмятате и която ви напомня.</p>
      </div>
      <ReminderSettings />

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div role="tablist" aria-label="Филтър" className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${tab === t.id ? "bg-[#eef5fb] text-[#0a4b82]" : "text-slate-600 hover:text-slate-900"}`}
            >
              {t.label} <span className="tabular-nums text-slate-400">{counts[t.id]}</span>
            </button>
          ))}
        </div>
        <label className="relative sm:w-72">
          <span className="sr-only">Търсене в бележките</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Търсене в бележките"
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-8 text-sm focus:border-[#0a4b82] focus:outline-none focus:ring-2 focus:ring-[#0a4b82]/20"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} aria-label="Изчисти" className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700">
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          )}
        </label>
      </div>

      {notes === null ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" aria-label="Зареждане" />
        </div>
      ) : visible.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
          {query
            ? "Няма бележки с този текст."
            : tab === "done"
              ? "Още няма изпълнени задачи."
              : tab === "tasks"
                ? "Няма задачи със срок. Добавете бележка и изберете дата."
                : "Бележникът е празен. Запишете първата си бележка по-горе."}
        </p>
      ) : (
        <div className="mt-5 columns-1 gap-4 sm:columns-2 lg:columns-3">
          {visible.map((n) =>
            editingId === n.id ? (
              <div key={n.id} className="mb-4 break-inside-avoid">
                <NoteEditor
                  idPrefix={`edit-${n.id}`}
                  autoFocus
                  initial={{ title: n.title, body: n.body, color: n.color, pinned: n.pinned, dueDate: n.dueDate, dueTime: n.dueTime, remindDays: n.remindDays }}
                  onCancel={() => setEditingId(null)}
                  onSave={async (d) => {
                    const ok = await patch(n, d);
                    if (ok) {
                      setEditingId(null);
                      toast("Бележката е запазена.", "success");
                    }
                    return ok;
                  }}
                />
              </div>
            ) : (
              <NoteCard
                key={n.id}
                note={n}
                onToggleDone={() => void patch(n, { done: !n.done })}
                onTogglePin={() => void patch(n, { pinned: !n.pinned })}
                onEdit={() => setEditingId(n.id)}
                onDelete={() => void remove(n)}
              />
            ),
          )}
        </div>
      )}
    </main>
  );
}
