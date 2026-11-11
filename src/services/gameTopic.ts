import type { GeneratedGame, LessonDirection } from '../types';
import { themeFor, themeStems } from './printables/themes';

/**
 * Темата в игрите: конкретните предмети от нея („Ябълка“ → ябълка, банан, грозде…), стъпка по
 * темата, когато шаблонът я споменава само веднъж, и проверка дали игра от модела е по темата.
 */

export type GameTopic = { kw: string; list: string; stems: string[] };

const wordStems = (text: string) =>
  text
    .toLowerCase()
    .split(/[^\p{L}]+/u)
    .filter((w) => w.length >= 4)
    .map((w) => w.slice(0, -1));

export function gameTopic(kw: string | undefined): GameTopic | undefined {
  const t = kw?.trim();
  if (!t) return undefined;
  const theme = themeFor(t);
  const list = theme.id === 'default' ? '' : theme.pics.slice(0, 5).map((x) => x.w).join(', ');
  return { kw: t, list, stems: [...new Set([...wordStems(t), ...themeStems(theme)])].filter((st) => st.length >= 3) };
}

/** „Ябълка“ (ябълка, банан, грозде, морков) — темата с конкретните предмети. */
export const aboutTopic = (tp: GameTopic) => (tp.list ? `„${tp.kw}“ (${tp.list})` : `„${tp.kw}“`);

/**
 * Споменава ли текстът темата: дума, която започва с корен от темата и не е много по-дълга от него
 * („ябълките“ — да; „домакини“ не е „домат“).
 */
const mentions = (text: string, tp: GameTopic) =>
  text
    .toLowerCase()
    .split(/[^\p{L}]+/u)
    .some((w) => tp.stems.some((st) => w.startsWith(st) && w.length <= st.length + 3));

/** Дали мястото в текста е вътре в скоби — там не се добавят още скоби. */
const insideParens = (s: string, at: number) => {
  let depth = 0;
  for (let i = 0; i < at; i++) depth += s[i] === '(' ? 1 : s[i] === ')' ? -1 : 0;
  return depth > 0;
};

/** Стъпка, която връща играта към темата — според направлението. */
const CLOSING: Record<LessonDirection | 'mood', (tp: GameTopic) => string> = {
  math: (tp) => `Накрая — по темата: децата броят предмети от ${aboutTopic(tp)} и казват къде са повече и къде по-малко.`,
  bel: (tp) => `Накрая — по темата: всяко дете казва изречение за предмет от ${aboutTopic(tp)}.`,
  world: (tp) => `Накрая — по темата: децата казват какво знаят за ${aboutTopic(tp)} — какво е, къде го срещаме и как се грижим за него.`,
  art: (tp) => `Накрая — по темата: децата нарисуват с пръст във въздуха, а после на лист предмет от ${aboutTopic(tp)}.`,
  music: (tp) => `Накрая — по темата: децата изпляскват по срички думите от ${aboutTopic(tp)}.`,
  construct: (tp) => `Накрая — по темата: децата построяват или изработват от подръчни материали предмет от ${aboutTopic(tp)}.`,
  pe: (tp) => `Накрая — по темата: децата показват с движение предмет от ${aboutTopic(tp)}, а другите познават какъв е.`,
  bdp: (tp) => `Накрая — по темата „${tp.kw}“: всяко дете казва едно правило за безопасност на пътя, свързано с нея.`,
  mood: (tp) => `Накрая — по темата: децата назовават и показват с жест предмети от ${aboutTopic(tp)}.`,
};

/** Заглавието на вградена игра: ако шаблонът е общ („Кой с какво работи?“), темата се добавя. */
export function topicTitle(title: string, kw: string | undefined): string {
  const tp = gameTopic(kw);
  return !tp || mentions(title, tp) ? title : `${title} — „${tp.kw}“`;
}

/**
 * Стъпките на вградена игра по темата: първото споменаване става с конкретните предмети. Игра,
 * построена около темата (темата е в заглавието на шаблона), остава така; в общите шаблони, ако
 * темата е само в една стъпка, се добавя стъпка по темата.
 */
export function topicSteps(steps: string[], kw: string | undefined, kind: LessonDirection | 'mood', templateTitle = ''): string[] {
  const tp = gameTopic(kw);
  if (!tp) return steps;
  const quoted = `„${tp.kw}“`;
  let replaced = false;
  const out = steps.map((s) => {
    const at = s.indexOf(quoted);
    if (replaced || !tp.list || at < 0 || insideParens(s, at)) return s;
    replaced = true;
    return s.replace(quoted, aboutTopic(tp));
  });
  const built = mentions(templateTitle, tp) && out.some((s) => mentions(s, tp));
  return built || out.filter((s) => mentions(s, tp)).length >= 2 ? out : [...out, CLOSING[kind](tp)];
}

/**
 * Игра от модела по темата: темата е в заглавието или стихчето и поне в две стъпки (или във
 * всички, ако са по-малко). Без тема — всяка игра е приета.
 */
export function gameOnTopic(game: Pick<GeneratedGame, 'title' | 'rhymeLines' | 'steps'>, kw: string | undefined): boolean {
  const tp = gameTopic(kw);
  if (!tp || !tp.stems.length) return true;
  const head = mentions(`${game.title} ${game.rhymeLines.join(' ')}`, tp);
  const inSteps = game.steps.filter((s) => mentions(s, tp)).length;
  return head && inSteps >= Math.min(2, game.steps.length);
}

/** Правилото за темата към модела. */
export function gameTopicRule(kw: string | undefined): string {
  const tp = gameTopic(kw);
  if (!tp) return '';
  return [
    `ТЕМАТА Е ЗАДЪЛЖИТЕЛНА: всяка игра е за „${tp.kw}“. Заглавието, римуваният стих и стъпките са по темата — децата броят, назовават, търсят, подреждат, рисуват или показват с движение предмети от нея.`,
    tp.list ? `Предмети от темата: ${tp.list} (може и други от същата тема).` : '',
    'Игра, в която темата е само споменавана в едно изречение, не се приема.',
  ]
    .filter(Boolean)
    .join('\n');
}
