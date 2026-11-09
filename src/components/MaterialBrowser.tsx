"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { AgeGroup, MaterialKind, SavedMaterial } from "@/types";
import { AGE_SHORT, KIND_LABELS } from "@/services/materialText";
import { fetchMaterials } from "@/lib/client/materials";
import { MaterialCard } from "./MaterialCard";

type Props = {
  scope: "mine" | "shared";
  /** Само материали за този празник. */
  holiday?: string;
  /** Първоначален филтър по група ("" — всички). */
  initialAgeGroup?: AgeGroup | "";
  /** Смяна на стойността презарежда списъка (напр. след добавяне). */
  refreshKey?: number;
  /** Без материалите от този вид (напр. игрите в Хъба са в банката с игри). */
  excludeKind?: MaterialKind;
  emptyText: string;
};

const chip = (active: boolean) =>
  `rounded-xl border px-3 py-1.5 text-sm font-bold transition-colors ${
    active ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
  }`;

/** Списък с материали с филтри по възрастова група и вид. */
export function MaterialBrowser({ scope, holiday, initialAgeGroup = "", refreshKey = 0, excludeKind, emptyText }: Props) {
  const [ageGroup, setAgeGroup] = useState<AgeGroup | "">(initialAgeGroup);
  const [kind, setKind] = useState<MaterialKind | "">("");
  const [onlyTried, setOnlyTried] = useState(false);
  const [items, setItems] = useState<SavedMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [noKindergarten, setNoKindergarten] = useState(false);

  useEffect(() => setAgeGroup(initialAgeGroup), [initialAgeGroup]);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetchMaterials({ scope, ageGroup: ageGroup || undefined, kind: kind || undefined, holiday, tried: onlyTried ? "1" : undefined });
    setItems((res?.materials ?? []).filter((m) => m.kind !== excludeKind));
    setNoKindergarten(Boolean(res?.noKindergarten));
    setLoading(false);
  }, [scope, ageGroup, kind, holiday, excludeKind, onlyTried]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const kinds = (Object.keys(KIND_LABELS) as MaterialKind[]).filter((k) => k !== excludeKind);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Възрастова група">
        <button type="button" aria-pressed={ageGroup === ""} onClick={() => setAgeGroup("")} className={chip(ageGroup === "")}>
          Всички групи
        </button>
        {(["1", "2", "3", "4"] as AgeGroup[]).map((g) => (
          <button key={g} type="button" aria-pressed={ageGroup === g} onClick={() => setAgeGroup(g)} className={chip(ageGroup === g)}>
            {AGE_SHORT[g]}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Вид материал">
        <button type="button" aria-pressed={kind === ""} onClick={() => setKind("")} className={chip(kind === "")}>
          Всичко
        </button>
        {kinds.map((k) => (
          <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)} className={chip(kind === k)}>
            {KIND_LABELS[k].label}
          </button>
        ))}
        <button type="button" aria-pressed={onlyTried} onClick={() => setOnlyTried((v) => !v)} className={chip(onlyTried)}>
          ✓ Само изпитаните с деца
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-7 w-7 animate-spin text-indigo-600" aria-label="Зареждане" />
        </div>
      ) : noKindergarten ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-600">
          Профилът ви не е свързан с детска градина. Присъединете се с кода на градината, за да виждате споделеното от колегите.
        </p>
      ) : items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-600">{emptyText}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((m) => (
            <MaterialCard
              key={m.id}
              material={m}
              view={scope}
              onChange={(u) => setItems((prev) => prev.map((x) => (x.id === u.id ? u : x)))}
              onDelete={(id) => setItems((prev) => prev.filter((x) => x.id !== id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
