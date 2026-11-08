'use client';

import { useState } from 'react';
import { Check, ListChecks, X } from 'lucide-react';
import type { AgeGroup, GameTask, LessonDirection } from '@/types';
import { MAX_TASKS, sameTask, taskDirectionLabel, taskOptions } from '@/services/gameTasks';

/**
 * Избор на образователни задачи: ядрата на направлението и очакваните резултати по Наредба № 5
 * само за избраната група. Задачите от различни направления може да се комбинират (интегриран подход).
 */
export function GameTaskPicker({
  ageGroup,
  direction,
  tasks,
  required,
  onChange,
}: {
  ageGroup: AgeGroup;
  /** null — учителят още не е избрал направление („Смесени“) */
  direction: LessonDirection | null;
  tasks: GameTask[];
  required: boolean;
  onChange: (tasks: GameTask[]) => void;
}) {
  const full = tasks.length >= MAX_TASKS;
  // Отворените ядра са в състоянието — иначе всяко пререндиране ги затваря
  const [openCores, setOpenCores] = useState<Set<string>>(() => new Set(tasks.map((t) => `${t.direction}|${t.core}`)));
  const setOpen = (key: string, open: boolean) =>
    setOpenCores((prev) => {
      if (prev.has(key) === open) return prev;
      const next = new Set(prev);
      if (open) next.add(key);
      else next.delete(key);
      return next;
    });
  const options = direction ? taskOptions(direction, ageGroup) : [];
  const toggle = (task: GameTask) =>
    onChange(tasks.some((t) => sameTask(t, task)) ? tasks.filter((t) => !sameTask(t, task)) : [...tasks, task]);

  return (
    <fieldset className="space-y-3">
      <legend className="flex flex-wrap items-center gap-2 text-sm sm:text-base font-semibold text-slate-800">
        <ListChecks className="h-5 w-5 text-[#0a4b82]" aria-hidden />
        3. Образователни задачи {required ? '(1–3, задължително)' : '(по желание, до 3)'}
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${tasks.length ? 'bg-[#0a4b82] text-white' : 'bg-slate-100 text-slate-600'}`}>
          Избрани: {tasks.length} от {MAX_TASKS}
        </span>
      </legend>

      {tasks.length > 0 && (
        <ul className="space-y-2" aria-label="Избрани задачи">
          {tasks.map((t) => (
            <li key={`${t.direction}|${t.core}|${t.result}`} className="flex items-start gap-2 rounded-xl border border-[#0a4b82]/20 bg-sky-50 px-3 py-2 text-sm">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#0a4b82]" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold text-[#0a4b82]">
                  {taskDirectionLabel(t.direction)} · {t.direction === 'bdp' ? 'тема' : 'ядро'} „{t.core}“
                </span>
                <span className="text-slate-800">{t.result}</span>
              </span>
              <button
                type="button"
                onClick={() => toggle(t)}
                aria-label={`Махни задачата: ${t.result}`}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-white hover:text-rose-700"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      {!direction ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Изберете направление по-горе, за да видите задачите за групата.
          {tasks.length > 0 && ' Вече избраните остават.'}
        </p>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-slate-500">
            {direction === 'bdp'
              ? 'Темите по БДП от програмите на МОН за групата. Отметнете до три задачи — може и от различни направления.'
              : 'Очакваните резултати по Наредба № 5 само за избраната група. Отметнете до три — може и от различни направления.'}
          </p>
          {options.map(({ core, results }) => {
            const chosenHere = tasks.filter((t) => t.direction === direction && t.core === core).length;
            return (
              <details
                key={core}
                open={openCores.has(`${direction}|${core}`)}
                onToggle={(e) => setOpen(`${direction}|${core}`, e.currentTarget.open)}
                className="group rounded-xl border border-slate-200 bg-white"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50">
                  <span>
                    {direction === 'bdp' ? 'Тема' : 'Ядро'} „{core}“
                    {chosenHere > 0 && <span className="ml-2 rounded-full bg-[#0a4b82] px-2 py-0.5 text-[11px] text-white">{chosenHere}</span>}
                  </span>
                  <span className="text-xs font-normal text-slate-500 group-open:hidden">{results.length} {results.length === 1 ? 'резултат' : 'резултата'}</span>
                </summary>
                <ul className="space-y-1 border-t border-slate-100 px-2 py-2">
                  {results.map((result) => {
                    const task: GameTask = { direction, core, result };
                    const checked = tasks.some((t) => sameTask(t, task));
                    const disabled = !checked && full;
                    return (
                      <li key={result}>
                        <label className={`flex items-start gap-3 rounded-lg px-2 py-2 text-sm ${disabled ? 'cursor-not-allowed text-slate-400' : 'cursor-pointer text-slate-700 hover:bg-slate-50'}`}>
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={disabled}
                            onChange={() => toggle(task)}
                            className="mt-0.5 h-4 w-4 shrink-0 accent-[#0a4b82]"
                          />
                          <span>{result}</span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </details>
            );
          })}
          {full && <p className="text-xs font-semibold text-amber-700">Избрахте три задачи — махнете някоя, за да изберете друга.</p>}
        </div>
      )}
    </fieldset>
  );
}
