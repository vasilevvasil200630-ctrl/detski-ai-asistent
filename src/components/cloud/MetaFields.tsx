"use client";

import { Lock, Users } from "lucide-react";
import { AGE_SHORT } from "@/services/materialText";
import { DIRECTION_ORDER, DIRECTION_STANDARDS } from "@/services/naredba5";
import { BDP } from "@/services/bdp";
import { CLOUD_FOLDERS } from "@/lib/cloud/folders";

export type MetaState = {
  folder: string;
  ageGroup: string;
  direction: string;
  shared: boolean;
  description: string;
};

const FIELD =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#4d7a0a] focus:outline-none focus:ring-2 focus:ring-[#4d7a0a]/20";

/** Папка, група, направление, описание и „за всички / само за мен“ — общи за качване и редакция. */
export function MetaFields({ value, onChange, idPrefix }: { value: MetaState; onChange: (v: MetaState) => void; idPrefix: string }) {
  const set = <K extends keyof MetaState>(k: K, v: MetaState[K]) => onChange({ ...value, [k]: v });
  const folderHint = CLOUD_FOLDERS.find((f) => f.id === value.folder)?.hint;
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div>
        <label htmlFor={`${idPrefix}-folder`} className="text-sm font-medium text-slate-700">
          Папка
        </label>
        <select id={`${idPrefix}-folder`} value={value.folder} onChange={(e) => set("folder", e.target.value)} className={`mt-1 ${FIELD}`}>
          {CLOUD_FOLDERS.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </select>
        {folderHint && <p className="mt-1 text-xs text-slate-500">{folderHint}</p>}
      </div>
      <div>
        <label htmlFor={`${idPrefix}-age`} className="text-sm font-medium text-slate-700">
          Група
        </label>
        <select id={`${idPrefix}-age`} value={value.ageGroup} onChange={(e) => set("ageGroup", e.target.value)} className={`mt-1 ${FIELD}`}>
          <option value="">За всички групи</option>
          {Object.entries(AGE_SHORT).map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor={`${idPrefix}-dir`} className="text-sm font-medium text-slate-700">
          Направление
        </label>
        <select id={`${idPrefix}-dir`} value={value.direction} onChange={(e) => set("direction", e.target.value)} className={`mt-1 ${FIELD}`}>
          <option value="">Без направление</option>
          {DIRECTION_ORDER.map((d) => (
            <option key={d} value={d}>
              {DIRECTION_STANDARDS[d].shortLabel}
            </option>
          ))}
          <option value="bdp">{BDP.shortLabel}</option>
        </select>
      </div>
      <div className="sm:col-span-3">
        <label htmlFor={`${idPrefix}-desc`} className="text-sm font-medium text-slate-700">
          Описание <span className="font-normal text-slate-400">(по желание)</span>
        </label>
        <textarea
          id={`${idPrefix}-desc`}
          value={value.description}
          onChange={(e) => set("description", e.target.value)}
          rows={2}
          maxLength={600}
          placeholder="Напр. „За седмицата на есента, печата се на A4 цветно“"
          className={`mt-1 ${FIELD}`}
        />
      </div>
      <fieldset className="sm:col-span-3">
        <legend className="text-sm font-medium text-slate-700">Кой го вижда</legend>
        <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
          {[
            { shared: true, icon: Users, title: "Всички учители", text: "Целият екип на градината може да го отвори и свали." },
            { shared: false, icon: Lock, title: "Само за мен", text: "Личен файл — виждате го само вие." },
          ].map((o) => (
            <label
              key={String(o.shared)}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors duration-150 ${
                value.shared === o.shared ? "border-[#4d7a0a] bg-[#f4f9e8]" : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <input
                type="radio"
                name={`${idPrefix}-shared`}
                checked={value.shared === o.shared}
                onChange={() => set("shared", o.shared)}
                className="mt-1 accent-[#4d7a0a]"
              />
              <span>
                <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                  <o.icon className="h-4 w-4" aria-hidden /> {o.title}
                </span>
                <span className="block text-xs text-slate-500">{o.text}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
