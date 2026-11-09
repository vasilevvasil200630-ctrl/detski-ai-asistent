'use client';

import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Loader2, PackageOpen, Printer, RefreshCw, X } from 'lucide-react';
import { PrintOptions } from '@/components/print/PrintOptions';
import { GameKitSheets } from '@/components/print/GameKitSheets';
import { DEFAULT_SHEET_KINDS } from '@/services/printables/kit';
import { SHEET_KIND_ORDER } from '@/services/printables';
import { KIT_PART_LABELS, KIT_PART_ORDER, SHEET_KIND_LABELS, type GameKit, type KitPart, type SheetKind } from '@/services/printables/types';
import type { AgeGroup, GeneratedGame, LessonDirection } from '@/types';

const MAX_SHEET_KINDS = 4;

/** Печат само на комплекта: останалата страница се скрива, докато трае печатът. */
export function printKit() {
  document.body.classList.add('printing-kit');
  const done = () => {
    document.body.classList.remove('printing-kit');
    window.removeEventListener('afterprint', done);
  };
  window.addEventListener('afterprint', done);
  window.print();
}

/** Скритото копие на комплекта за печат (виж .printing-kit в globals.css). */
export function KitPrintPortal({ game, ageGroup, direction }: { game: GeneratedGame; ageGroup: AgeGroup; direction: LessonDirection | null }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(
    <div id="kit-print-root">
      <GameKitSheets game={game} ageGroup={ageGroup} direction={direction} />
    </div>,
    document.body,
  );
}

/**
 * „Материали към играта“: учителят отмята кои части иска (работен лист с избрани видове задачи,
 * карти, стихчето за стената, бележка до родителите, пособия), създава ги и печата всичко наведнъж.
 */
export function GameKitDialog({
  game,
  ageGroup,
  direction,
  labelDirection,
  topic,
  resources,
  onClose,
  onKit,
}: {
  game: GeneratedGame;
  ageGroup: AgeGroup;
  /** Направлението на работния лист */
  direction: LessonDirection;
  /** Направлението на играта за листа на учителя (null — смесени) */
  labelDirection: LessonDirection | null;
  topic: string;
  resources?: string;
  onClose: () => void;
  onKit: (kit: GameKit) => void;
}) {
  const titleId = useId();
  const kit = game.kit;
  const [parts, setParts] = useState<KitPart[]>(() => (kit ? partsOf(kit) : ['worksheet', 'cards', 'poster', 'supplies']));
  const [kinds, setKinds] = useState<SheetKind[]>(() => kit?.worksheet?.tasks.map((t) => t.kind) ?? DEFAULT_SHEET_KINDS[ageGroup]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(!kit);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !busy && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [busy, onClose]);

  const kindOptions = SHEET_KIND_ORDER.filter((k) => k !== 'sound' || ageGroup === '3' || ageGroup === '4');
  const togglePart = (p: KitPart) => setParts((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  const toggleKind = (k: SheetKind) =>
    setKinds((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : prev.length >= MAX_SHEET_KINDS ? prev : [...prev, k]));

  const problem =
    parts.length === 0
      ? 'Отметнете поне една част.'
      : parts.includes('worksheet') && kinds.length === 0
        ? 'Изберете поне един вид задача за работния лист.'
        : null;

  const create = async () => {
    if (problem || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/game-kit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ageGroup,
          direction,
          topic,
          parts,
          sheetKinds: parts.includes('worksheet') ? kinds.filter((k) => kindOptions.includes(k)) : [],
          resources,
          game: { title: game.title, rhymeLines: game.rhymeLines, steps: game.steps, pedagogicalGoal: game.pedagogicalGoal, tasks: game.tasks ?? [] },
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { kit?: GameKit; error?: string };
      if (!res.ok || !data.kit) throw new Error(data.error ?? 'Материалите не можаха да се създадат. Опитайте пак.');
      onKit(data.kit);
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Няма връзка със сървъра.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="no-print fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-t-2xl bg-white shadow-xl sm:rounded-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <PackageOpen className="h-5 w-5 shrink-0 text-[#0a4b82]" aria-hidden /> Материали към играта
            </h2>
            <p className="truncate text-sm text-slate-500">„{game.title}“</p>
          </div>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Затвори" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-50">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {editing ? (
            <div className="space-y-5">
              <fieldset>
                <legend className="mb-2 text-sm font-semibold text-slate-800">Какво да приготвя?</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {KIT_PART_ORDER.map((p) => {
                    const on = parts.includes(p);
                    return (
                      <label key={p} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${on ? 'border-[#0a4b82] bg-sky-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                        <input type="checkbox" checked={on} onChange={() => togglePart(p)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#0a4b82]" />
                        <span>
                          <span className="block text-sm font-semibold text-slate-800">{KIT_PART_LABELS[p].label}</span>
                          <span className="block text-xs text-slate-500">{KIT_PART_LABELS[p].hint}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              {parts.includes('worksheet') && (
                <fieldset>
                  <legend className="mb-2 text-sm font-semibold text-slate-800">
                    Задачи в работния лист <span className="font-normal text-slate-500">(до {MAX_SHEET_KINDS}, в този ред)</span>
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {kindOptions.map((k) => {
                      const i = kinds.indexOf(k);
                      const on = i >= 0;
                      const disabled = !on && kinds.length >= MAX_SHEET_KINDS;
                      return (
                        <button
                          key={k}
                          type="button"
                          aria-pressed={on}
                          disabled={disabled}
                          onClick={() => toggleKind(k)}
                          className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${on ? 'border-[#0a4b82] bg-[#0a4b82] text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                        >
                          {on && <span className="grid h-5 w-5 place-items-center rounded-full bg-white text-xs text-[#0a4b82]">{i + 1}</span>}
                          {SHEET_KIND_LABELS[k]}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              )}

              {error && (
                <p role="alert" className="text-sm text-rose-700">
                  {error}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
                <Check className="h-4 w-4 shrink-0" aria-hidden /> Материалите са готови. Ето как ще изглеждат на хартия:
              </p>
              <div className="rounded-2xl bg-slate-100 p-3 sm:p-5">
                <GameKitSheets game={game} ageGroup={ageGroup} direction={labelDirection} />
              </div>
            </div>
          )}
        </div>

        <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 px-5 py-3">
          {editing ? (
            <>
              {problem && <p className="mr-auto text-sm font-semibold text-amber-700">{problem}</p>}
              {kit && (
                <button type="button" onClick={() => setEditing(false)} disabled={busy} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  Назад към материалите
                </button>
              )}
              <button
                type="button"
                onClick={create}
                disabled={busy || Boolean(problem)}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0a4b82] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#083861] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <PackageOpen className="h-4 w-4" aria-hidden />}
                {busy ? 'Приготвям материалите…' : kit ? 'Създай наново' : 'Създай материалите'}
              </button>
            </>
          ) : (
            <>
              <PrintOptions className="basis-full justify-end pb-1" />
              <button type="button" onClick={() => setEditing(true)} className="mr-auto inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                <RefreshCw className="h-4 w-4" aria-hidden /> Промени
              </button>
              <button type="button" onClick={printKit} className="inline-flex items-center gap-2 rounded-xl bg-[#0a4b82] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#083861]">
                <Printer className="h-4 w-4" aria-hidden /> Печат на всичко
              </button>
            </>
          )}
        </footer>
      </div>
    </div>
  );
}

function partsOf(kit: GameKit): KitPart[] {
  return KIT_PART_ORDER.filter((p) =>
    p === 'worksheet' ? kit.worksheet : p === 'cards' ? kit.cards : p === 'poster' ? kit.poster : p === 'parent' ? kit.parentNote : kit.supplies,
  );
}
