"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, FileText, Loader2, Minus, Plus, Save, Sparkles } from "lucide-react";
import { DIRECTION_STANDARDS } from "@/services/naredba5";
import { resultsForGroup } from "@/services/naredba5Results";
import { weeklySlots, type PlanSituation, type PlanWeekView } from "@/services/thematicPlan";
import type { AgeGroup, EducationalDirection } from "@/types";

const MAX_RESULTS = 4;

/**
 * Редакция на учебна седмица: тема, бележки и педагогическите ситуации по направления —
 * минимумът по Наредба № 5 за групата, с ядро, тема и очаквани резултати от приложенията.
 */
export function WeekEditor({
  ageGroup,
  week,
  onSave,
  onSuggest,
}: {
  ageGroup: AgeGroup;
  week: PlanWeekView;
  onSave: (draft: { theme: string; notes: string; situations: PlanSituation[] }) => Promise<boolean>;
  onSuggest: (theme: string) => Promise<PlanSituation[] | null>;
}) {
  const slots = weeklySlots(ageGroup);
  const initial = () => {
    const rows: PlanSituation[] = [];
    for (const { direction, count } of slots) {
      const mine = week.situations.filter((s) => s.direction === direction);
      rows.push(...mine);
      for (let i = mine.length; i < count; i++) rows.push({ direction, core: "", topic: "", results: [] });
    }
    return rows;
  };
  const [theme, setTheme] = useState(week.theme);
  const [notes, setNotes] = useState(week.notes);
  const [rows, setRows] = useState<PlanSituation[]>(initial);
  const [busy, setBusy] = useState<"save" | "suggest" | null>(null);
  const [dirty, setDirty] = useState(false);

  const update = (i: number, patch: Partial<PlanSituation>) => {
    setRows((prev) => prev.map((r, j) => (j === i ? { ...r, ...patch, ...(patch.core !== undefined ? { results: [] } : {}) } : r)));
    setDirty(true);
  };
  const addRow = (direction: EducationalDirection) => {
    setRows((prev) => {
      const last = prev.map((r) => r.direction).lastIndexOf(direction);
      const next = [...prev];
      next.splice(last + 1, 0, { direction, core: "", topic: "", results: [] });
      return next;
    });
    setDirty(true);
  };
  const removeRow = (i: number) => {
    setRows((prev) => prev.filter((_, j) => j !== i));
    setDirty(true);
  };

  const suggest = async () => {
    setBusy("suggest");
    const list = await onSuggest(theme);
    setBusy(null);
    if (list) {
      setRows(list);
      setDirty(true);
    }
  };
  const save = async () => {
    setBusy("save");
    const ok = await onSave({ theme, notes, situations: rows.filter((r) => r.core || r.topic.trim()) });
    setBusy(null);
    if (ok) setDirty(false);
  };

  return (
    <div className="space-y-4 rounded-2xl border border-[#4d7a0a]/25 bg-sky-50/30 p-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-slate-800">Тема на седмицата</span>
          <input
            value={theme}
            onChange={(e) => {
              setTheme(e.target.value);
              setDirty(true);
            }}
            maxLength={160}
            placeholder="Напр. „Есен в гората“"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
          />
        </label>
        <button
          type="button"
          onClick={suggest}
          disabled={busy !== null}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#4d7a0a] bg-white px-4 py-2 text-sm font-semibold text-[#4d7a0a] hover:bg-sky-50 disabled:opacity-50"
        >
          {busy === "suggest" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Sparkles className="h-4 w-4" aria-hidden />} Предложи ситуациите
        </button>
      </div>

      {slots.map(({ direction, count }) => {
        const indexes = rows.map((r, i) => (r.direction === direction ? i : -1)).filter((i) => i >= 0);
        const cores = resultsForGroup(direction, ageGroup);
        return (
          <fieldset key={direction} className="rounded-xl border border-slate-200 bg-white p-3">
            <legend className="px-1 text-sm font-bold text-slate-800">
              {DIRECTION_STANDARDS[direction].label}{" "}
              <span className="font-normal text-slate-500">
                · минимум {count} {count === 1 ? "ситуация" : "ситуации"} седмично
              </span>
            </legend>
            <div className="space-y-3">
              {indexes.map((i) => {
                const r = rows[i]!;
                const results = cores.find((c) => c.core === r.core)?.results ?? [];
                return (
                  <div key={i} className="space-y-2 border-b border-dashed border-slate-200 pb-3 last:border-0 last:pb-0">
                    <div className="grid gap-2 sm:grid-cols-[minmax(0,14rem)_1fr_auto]">
                      <select
                        value={r.core}
                        onChange={(e) => update(i, { core: e.target.value })}
                        aria-label="Образователно ядро"
                        className="min-w-0 rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm"
                      >
                        <option value="">— ядро —</option>
                        {DIRECTION_STANDARDS[direction].cores.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      <input
                        value={r.topic}
                        onChange={(e) => update(i, { topic: e.target.value })}
                        maxLength={160}
                        placeholder="Тема на ситуацията"
                        aria-label="Тема на ситуацията"
                        className="min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                      />
                      <div className="flex gap-1">
                        {r.topic.trim() && (
                          <Link
                            href={`/dos?dir=${direction}&group=${ageGroup}&topic=${encodeURIComponent(r.topic)}${r.core ? `&core=${encodeURIComponent(r.core)}` : ""}`}
                            title="Направи план-конспект за тази ситуация"
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            <FileText className="h-4 w-4" aria-hidden /> План
                          </Link>
                        )}
                        {indexes.length > count && (
                          <button type="button" onClick={() => removeRow(i)} aria-label="Махни ситуацията" className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100">
                            <Minus className="h-4 w-4" aria-hidden />
                          </button>
                        )}
                      </div>
                    </div>
                    {r.core && (
                      <details className="group rounded-lg bg-slate-50 px-3 py-2 text-sm">
                        <summary className="flex cursor-pointer list-none items-center gap-1 font-semibold text-slate-700">
                          <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden />
                          Очаквани резултати: {r.results.length ? `${r.results.length} избрани` : "изберете"}
                        </summary>
                        <ul className="mt-2 space-y-1">
                          {results.map((res) => {
                            const on = r.results.includes(res);
                            const disabled = !on && r.results.length >= MAX_RESULTS;
                            return (
                              <li key={res}>
                                <label className={`flex items-start gap-2 ${disabled ? "text-slate-400" : "text-slate-700"}`}>
                                  <input
                                    type="checkbox"
                                    checked={on}
                                    disabled={disabled}
                                    onChange={() => update(i, { results: on ? r.results.filter((x) => x !== res) : [...r.results, res] })}
                                    className="mt-0.5 h-4 w-4 shrink-0 accent-[#4d7a0a]"
                                  />
                                  {res}
                                </label>
                              </li>
                            );
                          })}
                        </ul>
                      </details>
                    )}
                    {!r.core && r.results.length === 0 && r.topic && <p className="text-xs text-amber-700">Изберете ядро, за да отбележите очакваните резултати.</p>}
                  </div>
                );
              })}
              <button type="button" onClick={() => addRow(direction)} className="inline-flex items-center gap-1 text-xs font-semibold text-[#4d7a0a] hover:underline">
                <Plus className="h-3.5 w-3.5" aria-hidden /> Още една ситуация
              </button>
            </div>
          </fieldset>
        );
      })}

      <label className="block">
        <span className="mb-1 block text-sm font-semibold text-slate-800">
          Бележки <span className="font-normal text-slate-500">(допълнителни форми, проследяване на постиженията — по желание)</span>
        </span>
        <textarea
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            setDirty(true);
          }}
          maxLength={1500}
          rows={2}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
        />
      </label>

      <div className="flex flex-wrap items-center justify-end gap-2">
        {dirty && <p className="mr-auto text-sm font-semibold text-amber-700">Има незапазени промени.</p>}
        <button
          type="button"
          onClick={save}
          disabled={busy !== null || !dirty}
          className="inline-flex items-center gap-2 rounded-xl bg-[#4d7a0a] px-5 py-2 text-sm font-semibold text-white hover:bg-[#3d6108] disabled:opacity-50"
        >
          {busy === "save" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />} Запази седмицата
        </button>
      </div>
    </div>
  );
}
