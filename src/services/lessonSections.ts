import type { GeneratedLessonPlan } from '../types';

/**
 * Частите на план-конспекта в реда, в който се показват — едно място за екрана, печата, Word и
 * текста за копиране. По-старите планове (без цел, задачи и резултати от Наредбата) се показват
 * както преди: „Цели“ и „Знания / Умения / Отношения“.
 */

export type PlanBlock = { title: string; items: string[]; numbered?: boolean; note?: string };

/** Преди хода на ситуацията: цел, задачи, очаквани резултати, методи, материали, връзки. */
export function planBlocksBefore(p: GeneratedLessonPlan): PlanBlock[] {
  const blocks: PlanBlock[] = [];
  if (p.aim) blocks.push({ title: 'Цел', items: [p.aim] });
  blocks.push({ title: p.aim ? 'Задачи' : 'Цели', items: p.goals, numbered: true });
  if (p.naredbaResults?.length) {
    blocks.push({ title: 'Очаквани резултати', items: p.naredbaResults, ...(p.resultsSource ? { note: `По ${p.resultsSource}` } : {}) });
  } else {
    const e = p.expectedResults;
    blocks.push({ title: 'Очаквани резултати', items: [`Знания: ${e.knowledge}`, `Умения: ${e.skills}`, `Отношения: ${e.attitudes}`] });
  }
  if (p.methods?.length) blocks.push({ title: 'Методи и похвати', items: [p.methods.join(', ')] });
  blocks.push({ title: 'Материали', items: p.materials });
  if (p.integrativeLinks?.length) blocks.push({ title: 'Интегративни връзки', items: p.integrativeLinks });
  return blocks;
}

/** След хода на ситуацията: проверка на резултатите и диференциран подход. */
export function planBlocksAfter(p: GeneratedLessonPlan): PlanBlock[] {
  return [
    ...(p.assessment ? [{ title: 'Проверка на резултатите', items: [p.assessment] }] : []),
    ...(p.differentiation ? [{ title: 'Диференциран подход', items: [p.differentiation] }] : []),
  ];
}

/** Блоковете като текст за копиране. */
export function blocksText(blocks: PlanBlock[]): string[] {
  return blocks.flatMap((b) => [
    `${b.title.toUpperCase()}:`,
    ...(b.note ? [`(${b.note})`] : []),
    ...b.items.map((x, i) => (b.items.length === 1 && !b.numbered ? x : b.numbered ? `${i + 1}. ${x}` : `• ${x}`)),
    '',
  ]);
}
