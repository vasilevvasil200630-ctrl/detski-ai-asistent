import type { AgeGroup, GameMode, GameTask, LessonDirection } from '../types';
import { DIRECTION_STANDARDS } from './naredba5';
import { isExpectedResult, resultsForGroup } from './naredba5Results';
import { BDP, BDP_THEMES } from './bdp';

/**
 * Режимите на Магическата кутия и образователните задачи, които учителят избира сам —
 * очакваните резултати от приложенията към Наредба № 5 (за БДП — темите от програмите на МОН).
 */

export const MAX_TASKS = 3;

export const GAME_MODES: Record<GameMode, { label: string; hint: string; tasks: 'none' | 'optional' | 'required' }> = {
  quick: {
    label: 'Бърза игра',
    hint: 'Да запълните 5–15 минути. Без образователни задачи — само правила, стихче и ход.',
    tasks: 'none',
  },
  theme: {
    label: 'Игра към тема',
    hint: 'Допълнение към празник или темата от седмицата. Задачи — по желание, до 3.',
    tasks: 'optional',
  },
  dos: {
    label: 'Ситуация по ДОС',
    hint: 'Планирана педагогическа ситуация. Изберете 1–3 задачи от Наредба № 5.',
    tasks: 'required',
  },
};

export const GAME_MODE_ORDER: GameMode[] = ['quick', 'theme', 'dos'];

/** Кратко име на направлението за задачите. */
export function taskDirectionLabel(direction: LessonDirection): string {
  return direction === 'bdp' ? BDP.shortLabel : DIRECTION_STANDARDS[direction].label;
}

/** Ядрата с очакваните резултати за групата, от които учителят избира (за БДП — темите). */
export function taskOptions(direction: LessonDirection, ageGroup: AgeGroup): { core: string; results: string[] }[] {
  if (direction === 'bdp') return BDP_THEMES[ageGroup].map((t) => ({ core: t.theme, results: [t.expected] }));
  return resultsForGroup(direction, ageGroup);
}

/** Задачата съществува ли дословно в наредбата (или в програмата по БДП) за тази група. */
export function isValidTask(task: GameTask, ageGroup: AgeGroup): boolean {
  if (task.direction === 'bdp') return BDP_THEMES[ageGroup].some((t) => t.theme === task.core && t.expected === task.result);
  return isExpectedResult(task.direction, task.core, ageGroup, task.result);
}

export function sameTask(a: GameTask, b: GameTask): boolean {
  return a.direction === b.direction && a.core === b.core && a.result === b.result;
}

/** Задачата като един ред текст, напр. „Математика, ядро „Измерване“: Сравнява…“. */
export function taskLine(task: GameTask): string {
  const where = task.direction === 'bdp' ? `${BDP.label}, тема „${task.core}“` : `${taskDirectionLabel(task.direction)}, ядро „${task.core}“`;
  return `${where}: ${task.result}`;
}

/** Каква грешка има в режима и задачите (null — всичко е наред). */
export function tasksError(mode: GameMode, tasks: GameTask[], direction: LessonDirection | 'mixed' | undefined): string | null {
  if (tasks.length > MAX_TASKS) return `Изберете най-много ${MAX_TASKS} задачи.`;
  if (mode === 'quick' && tasks.length > 0) return 'Бързата игра е без образователни задачи.';
  if (mode === 'dos') {
    if (!direction || direction === 'mixed') return 'За ситуация по ДОС изберете направление.';
    if (tasks.length === 0) return 'За ситуация по ДОС изберете поне една задача.';
  }
  return null;
}

/** Частта от промпта за режима и задачите. */
export function tasksPromptBlock(mode: GameMode, tasks: GameTask[]): string {
  if (mode === 'quick') {
    return [
      'Режим: БЪРЗА ИГРА за запълване на време (допълнителна форма по чл. 26) — без образователни задачи.',
      'Игрите са кратки, лесни за обяснение за минута и не изискват подготовка.',
      'Полето "pedagogicalGoal" е едно изречение каква е ползата (напр. внимание, раздвижване, успокояване, сплотяване) — БЕЗ направления и ядра.',
    ].join('\n');
  }
  const head =
    mode === 'dos'
      ? 'Режим: СИТУАЦИЯ ПО ДОС — игри за основната форма, педагогическата ситуация (чл. 23).'
      : 'Режим: ИГРА КЪМ ТЕМА — допълнение към темата от седмицата или празника.';
  if (tasks.length === 0) return head;
  return [
    head,
    'Образователните задачи са избрани от учителя — очакваните резултати по Наредба № 5 за тази група:',
    ...tasks.map((t, i) => `${i + 1}) ${taskLine(t)}`),
    'И ТРИТЕ игри работят по ВСИЧКИ тези задачи — стъпките водят децата точно към тези резултати. Не добавяй други задачи.',
    'Полето "pedagogicalGoal" започва с направлението и ядрото на задачите с точните им имена и казва с кои стъпки играта води към всяка задача.',
  ].join('\n');
}
