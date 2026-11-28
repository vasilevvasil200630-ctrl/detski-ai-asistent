"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Droplet, Type } from "lucide-react";

/**
 * Настройки за печат, общи за целия сайт и запомнени в браузъра:
 * „Пестелив печат“ — черно-бяло, без фонове и цветни плочки, картинките в светлосиво (децата ги оцветяват);
 * „Едър шрифт“ — по-едри условия, стихчета и текстове в листовете.
 * Прилагат се като класове на <html> и важат само при печат (виж globals.css).
 */

export type PrintPrefs = { eco: boolean; large: boolean };

const KEY = "detski-print-prefs";
const DEFAULT: PrintPrefs = { eco: false, large: false };
let prefs: PrintPrefs = DEFAULT;
let loaded = false;
const listeners = new Set<() => void>();

function apply(p: PrintPrefs) {
  const html = document.documentElement;
  html.classList.toggle("print-eco", p.eco);
  html.classList.toggle("print-large", p.large);
}

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "null") as Partial<PrintPrefs> | null;
    if (raw) prefs = { eco: raw.eco === true, large: raw.large === true };
  } catch {
    // без памет в браузъра — обикновен печат
  }
  apply(prefs);
}

export function setPrintPrefs(next: Partial<PrintPrefs>) {
  prefs = { ...prefs, ...next };
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    // настройката важи до презареждане
  }
  apply(prefs);
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  load();
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function usePrintPrefs(): PrintPrefs {
  return useSyncExternalStore(
    subscribe,
    () => prefs,
    () => DEFAULT,
  );
}

/** Прилага запомнените настройки при отваряне на сайта (без да рисува нищо). */
export function PrintPrefsSync() {
  useEffect(load, []);
  return null;
}

/** Двете отметки до бутона „Принтирай“. */
export function PrintOptions({ className = "" }: { className?: string }) {
  const p = usePrintPrefs();
  const box = "h-4 w-4 accent-[#4d7a0a]";
  return (
    <div className={`no-print flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-slate-600 ${className}`}>
      <label className="flex items-center gap-1.5" title="Черно-бяло, без фонове и цветни плочки; картинките са в светлосиво и децата ги оцветяват">
        <input type="checkbox" checked={p.eco} onChange={(e) => setPrintPrefs({ eco: e.target.checked })} className={box} />
        <Droplet className="h-3.5 w-3.5 text-slate-400" aria-hidden /> Пестелив печат (черно-бяло)
      </label>
      <label className="flex items-center gap-1.5" title="По-едри условия, стихчета и текстове">
        <input type="checkbox" checked={p.large} onChange={(e) => setPrintPrefs({ large: e.target.checked })} className={box} />
        <Type className="h-3.5 w-3.5 text-slate-400" aria-hidden /> Едър шрифт
      </label>
    </div>
  );
}
