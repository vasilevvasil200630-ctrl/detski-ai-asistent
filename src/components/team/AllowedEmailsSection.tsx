"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { Loader2, MailCheck, Plus, X } from "lucide-react";
import { toast } from "@/components/Toaster";

type Row = { email: string; addedAt: string; name: string | null; admin: boolean };

async function api(url: string, init: RequestInit = {}): Promise<{ emails: Row[]; max: number }> {
  const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init.headers ?? {}) } });
  const data = (await res.json().catch(() => ({}))) as { emails?: Row[]; max?: number; error?: string };
  if (!res.ok || !data.emails) throw new Error(data.error ?? "Действието не успя. Опитайте пак.");
  return { emails: data.emails, max: data.max ?? 9 };
}

/**
 * „Разрешени имейли“ в панела на директора. Празен списък — регистрацията е с кода. Първият имейл
 * включва списъка (вече регистрираните влизат в него автоматично) и тогава учителски профил имат
 * само имейлите от списъка. Махнат имейл губи достъп веднага.
 */
export function AllowedEmailsSection({ onActiveChange }: { onActiveChange: (active: boolean) => void }) {
  const inputId = useId();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);
  // Местата: директор и 8 учители
  const [max, setMax] = useState(9);

  const apply = useCallback(
    (emails: Row[], seats?: number) => {
      setRows(emails);
      if (seats) setMax(seats);
      onActiveChange(emails.length > 0);
    },
    [onActiveChange],
  );

  useEffect(() => {
    api("/api/admin/allowed-emails")
      .then((d) => apply(d.emails, d.max))
      .catch(() => setRows([]));
  }, [apply]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    const wasEmpty = (rows?.length ?? 0) === 0;
    setBusy(true);
    try {
      const d = await api("/api/admin/allowed-emails", { method: "POST", body: JSON.stringify({ emails: text }) });
      apply(d.emails, d.max);
      setText("");
      toast(wasEmpty ? "Списъкът е включен. Вече се регистрират само имейлите от него." : "Имейлите са добавени.", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Не успях да добавя имейлите.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function remove(email: string) {
    setBusy(true);
    try {
      const d = await api(`/api/admin/allowed-emails?email=${encodeURIComponent(email)}`, { method: "DELETE" });
      apply(d.emails, d.max);
      setConfirm(null);
      toast("Имейлът е махнат. Профил с него вече няма достъп.", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Не успях да махна имейла.", "error");
    } finally {
      setBusy(false);
    }
  }

  const active = (rows?.length ?? 0) > 0;

  return (
    <section aria-labelledby="allowed-title" className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
      <h2 id="allowed-title" className="flex items-center gap-2 text-sm font-semibold text-slate-500">
        <MailCheck className="h-4 w-4" aria-hidden /> Разрешени имейли на учителите
      </h2>
      <p className="mt-1.5 text-lg font-bold text-slate-900">
        {rows === null ? "Зареждане…" : active ? `Включено — заети ${rows.length} от ${max} места` : "Изключено — регистрацията е с кода на градината"}
      </p>
      <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">
        {active
          ? "Учителски профил могат да създадат и да ползват само имейлите от списъка. Всички останали са гости и виждат само публичната част за родителите. Ако махнете имейл, профилът с него губи достъп веднага."
          : "Добавете имейлите на учителите. С първия добавен имейл списъкът се включва: вече регистрираните колеги влизат в него автоматично, а кодът за регистрация вече не е нужен."}
      </p>

      <form onSubmit={add} className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-start">
        <label htmlFor={inputId} className="sr-only">
          Имейли за добавяне
        </label>
        <textarea
          id={inputId}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          placeholder="petrova@abv.bg, ivanova@gmail.com"
          className="min-h-[44px] w-full flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0a4b82] focus:outline-none focus:ring-2 focus:ring-[#0a4b82]/20"
        />
        <button
          type="submit"
          disabled={busy || !text.trim()}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#0a4b82] px-4 py-2 text-sm font-semibold text-white hover:bg-[#083861] disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />} Добави
        </button>
      </form>
      <p className="mt-1 text-xs text-slate-500">
        Може няколко наведнъж — разделени със запетая или на нов ред. Местата са {max}: директор и {max - 1} учители
        {active && rows ? ` · свободни: ${Math.max(0, max - rows.length)}` : ""}.
      </p>

      {active && rows && (
        <ul className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-200">
          {rows.map((r) => (
            <li key={r.email} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5">
              <span className="min-w-0 flex-1 break-all text-sm font-medium text-slate-900">{r.email}</span>
              <span className="text-xs text-slate-500">{r.name ? `${r.name}${r.admin ? " · директор" : ""}` : "още не е регистриран(а)"}</span>
              {confirm === r.email ? (
                <span className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void remove(r.email)}
                    className="rounded-md bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                  >
                    Махни
                  </button>
                  <button type="button" onClick={() => setConfirm(null)} className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                    Отказ
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirm(r.email)}
                  aria-label={`Махни ${r.email} от списъка`}
                  className="grid h-8 w-8 place-items-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-rose-700"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
