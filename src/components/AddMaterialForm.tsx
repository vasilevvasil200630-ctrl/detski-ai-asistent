"use client";

import { useState, type FormEvent } from "react";
import { Loader2, Plus } from "lucide-react";
import type { AgeGroup, LessonDirection, MaterialKind, SavedMaterial } from "@/types";
import { DIRECTION_ORDER, DIRECTION_STANDARDS } from "@/services/naredba5";
import { BDP } from "@/services/bdp";
import { HOLIDAYS, HOLIDAY_CORE } from "@/services/holidays";
import { AGE_SHORT } from "@/services/materialText";
import { saveMaterial } from "@/lib/client/materials";

type Props = {
  defaultAgeGroup: AgeGroup;
  /** Предварително избран празник (секция „Празници“). */
  defaultHoliday?: string;
  canShare: boolean;
  onCreated: (m: SavedMaterial) => void;
};

const fieldClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none";

/**
 * Собствен материал на учителя: игра, стихче, гатанка, песничка, текст за табло…
 * Направлението и ядрото са по Наредба № 5 (за празниците по подразбиране „Културни и национални ценности“).
 */
export function AddMaterialForm({ defaultAgeGroup, defaultHoliday, canShare, onCreated }: Props) {
  const [kind, setKind] = useState<MaterialKind>("MATERIAL");
  const [title, setTitle] = useState("");
  const [ageGroup, setAgeGroup] = useState<AgeGroup>(defaultAgeGroup);
  const [holiday, setHoliday] = useState(defaultHoliday ?? "");
  const [direction, setDirection] = useState<LessonDirection | "">(defaultHoliday ? HOLIDAY_CORE.direction : "");
  const [core, setCore] = useState(defaultHoliday ? HOLIDAY_CORE.core : "");
  const [text, setText] = useState("");
  const [shared, setShared] = useState(canShare);
  const [busy, setBusy] = useState(false);

  const cores = direction && direction !== "bdp" ? DIRECTION_STANDARDS[direction].cores : [];

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await saveMaterial({
      kind,
      title,
      ageGroup,
      direction: direction || null,
      core: core || null,
      holiday: holiday || null,
      content: { text },
      shared: canShare && shared,
    });
    setBusy(false);
    if (res && "material" in res) {
      onCreated(res.material);
      setTitle("");
      setText("");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm sm:p-5">
      <h3 className="text-base font-extrabold text-slate-900">Добави собствен материал</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm font-bold text-slate-700">
          Вид
          <select value={kind} onChange={(e) => setKind(e.target.value as MaterialKind)} className={fieldClass}>
            <option value="MATERIAL">📎 Помощен материал (стихче, гатанка, песничка, табло…)</option>
            <option value="GAME">🎲 Игра</option>
          </select>
        </label>
        <label className="space-y-1 text-sm font-bold text-slate-700">
          Възрастова група
          <select value={ageGroup} onChange={(e) => setAgeGroup(e.target.value as AgeGroup)} className={fieldClass}>
            {(["1", "2", "3", "4"] as AgeGroup[]).map((g) => (
              <option key={g} value={g}>
                {AGE_SHORT[g]}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm font-bold text-slate-700 sm:col-span-2">
          Заглавие
          <input value={title} onChange={(e) => setTitle(e.target.value)} required minLength={2} maxLength={140} className={fieldClass} placeholder="напр. Гатанки за есента" />
        </label>
        <label className="space-y-1 text-sm font-bold text-slate-700">
          Направление (Наредба № 5)
          <select
            value={direction}
            onChange={(e) => {
              setDirection(e.target.value as LessonDirection | "");
              setCore("");
            }}
            className={fieldClass}
          >
            <option value="">— не е посочено —</option>
            {DIRECTION_ORDER.map((d) => (
              <option key={d} value={d}>
                {DIRECTION_STANDARDS[d].label}
              </option>
            ))}
            <option value="bdp">{BDP.label} (интегрирано)</option>
          </select>
        </label>
        <label className="space-y-1 text-sm font-bold text-slate-700">
          Образователно ядро
          <select value={core} onChange={(e) => setCore(e.target.value)} disabled={cores.length === 0} className={`${fieldClass} disabled:bg-slate-50`}>
            <option value="">— не е посочено —</option>
            {cores.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm font-bold text-slate-700 sm:col-span-2">
          Празник (по желание)
          <select value={holiday} onChange={(e) => setHoliday(e.target.value)} className={fieldClass}>
            <option value="">— без празник —</option>
            {HOLIDAYS.map((h) => (
              <option key={h.id} value={h.id}>
                {h.emoji} {h.name} ({h.when})
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm font-bold text-slate-700 sm:col-span-2">
          Съдържание
          <textarea value={text} onChange={(e) => setText(e.target.value)} required minLength={3} rows={6} className={fieldClass} placeholder="Текстът на материала: стъпките на играта, стихчето, гатанките…" />
        </label>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        {canShare ? (
          <label className="inline-flex items-center gap-2 text-sm font-bold text-slate-700">
            <input type="checkbox" checked={shared} onChange={(e) => setShared(e.target.checked)} className="h-4 w-4 accent-indigo-600" />
            Сподели с колегите от детската градина
          </label>
        ) : (
          <span className="text-xs text-slate-500">Свържете профила с детска градина, за да споделяте.</span>
        )}
        <button type="submit" disabled={busy} className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Запази
        </button>
      </div>
    </form>
  );
}
