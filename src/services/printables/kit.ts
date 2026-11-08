import { KG } from '../../config/kindergarten';
import { AGE_GROUP_STANDARDS, naredba5PromptRules } from '../naredba5';
import { bdpPromptRules } from '../bdp';
import { taskLine } from '../gameTasks';
import type { AgeGroup, GameTask, GeneratedGame, LessonDirection } from '../../types';
import { COUNT_MAX, buildWorksheetFromKinds } from './worksheets';
import { themeFor } from './themes';
import { SHEET_KIND_SPECS, normalizeTask, pic } from './index';
import type { GameKit, KitParentNote, KitPart, Pic, PictureCards, SheetKind, Worksheet, WorksheetTask } from './types';

/**
 * Комплект към играта: работен лист с избраните от учителя видове задачи, карти с картинки,
 * стихчето за стената, бележка до родителите и списък с пособия. Всичко е за печат от профила.
 */

export const DEFAULT_SHEET_KINDS: Record<AgeGroup, SheetKind[]> = {
  '1': ['count', 'odd', 'draw'],
  '2': ['count', 'match', 'draw'],
  '3': ['count', 'match', 'sequence', 'draw'],
  '4': ['count', 'sound', 'sequence', 'trace'],
};

/** Какво описва играта — за промпта и за вградения двигател. */
export interface KitRequest {
  ageGroup: AgeGroup;
  /** Направлението на работния лист (от задачите, от избраното направление или „Околен свят“) */
  direction: LessonDirection;
  /** Темата от седмицата (ако има) */
  topic: string;
  parts: KitPart[];
  sheetKinds: SheetKind[];
  /** Наличните материали, напр. „цветна лека топка“ */
  resources?: string;
  game: Pick<GeneratedGame, 'title' | 'rhymeLines' | 'steps' | 'pedagogicalGoal'> & { tasks?: GameTask[] };
}

const DIRECTIONS: LessonDirection[] = ['bel', 'world', 'math', 'art', 'music', 'construct', 'pe', 'bdp'];

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/* ───────────────────────── Вграден двигател ───────────────────────── */

export function buildDemoKit(req: KitRequest): GameKit {
  const topic = req.topic.trim() || req.game.title;
  const kit: GameKit = {};
  if (req.parts.includes('worksheet')) kit.worksheet = buildWorksheetFromKinds(req.ageGroup, req.direction, topic, req.sheetKinds);
  if (req.parts.includes('cards')) {
    // Само по темата: думите в заглавието дават случайни съвпадения („Кралят“ → „лят“)
    const pics = themeFor(req.topic.trim()).pics;
    kit.cards = { title: `Карти за играта „${req.game.title}“`, cards: pics.slice(0, 8) };
  }
  if (req.parts.includes('poster')) kit.poster = true;
  if (req.parts.includes('parent')) {
    const tasks = req.game.tasks ?? [];
    kit.parentNote = {
      title: `Днес играхме „${req.game.title}“`,
      paragraphs: [
        `Мили родители, днес в групата играхме на „${req.game.title}“${req.topic.trim() ? ` по темата „${req.topic.trim()}“` : ''}. Децата се забавляваха и работиха заедно.`,
        tasks.length
          ? `С играта упражнявахме: ${tasks.map((t) => lower(t.result)).join('; ')}.`
          : 'Играта развива вниманието, речта и умението да играем заедно по правила.',
      ],
      homeIdea: `Ако желаете, попитайте детето как се играе „${req.game.title}“ и му позволете да ви научи — така ще преразкаже правилата със свои думи.`,
    };
  }
  if (req.parts.includes('supplies')) {
    kit.supplies = [
      ...(req.resources ? [req.resources] : []),
      ...(kit.cards || req.parts.includes('cards') ? ['изрязаните карти с картинки'] : []),
      ...(kit.worksheet ? ['копия на работния лист за всяко дете и моливи'] : []),
      'свободно място за игра в кръг',
    ];
  }
  return kit;
}

/* ───────────────────────── Промпт към модела ───────────────────────── */

export function buildKitPrompt(req: KitRequest): string {
  const g = AGE_GROUP_STANDARDS[req.ageGroup];
  const tasks = req.game.tasks ?? [];
  const want: string[] = [];
  if (req.parts.includes('worksheet')) {
    want.push(`"worksheet": {"title":"…","tasks":[…],"teacherNote":"цел по Наредба № 5 и отговорите"} — РАБОТЕН ЛИСТ точно с ${req.sheetKinds.length} задачи от тези видове и в този ред: ${req.sheetKinds.join(', ')}.
Картинките са ЕДНО емоджи всяка (без текст), с дума за учителя. Числата за броене са от 1 до ${COUNT_MAX[req.ageGroup]}. Условията са кратки — учителят ги чете на глас.
Формата на задачите:
${req.sheetKinds.map((k) => `- ${SHEET_KIND_SPECS[k]}`).join('\n')}`);
  }
  if (req.parts.includes('cards')) {
    want.push('"cards": {"title":"…","cards":[{"e":"🍎","w":"ябълка"}, …]} — точно 8 карти с картинки (едно емоджи + дума в именителен падеж), които се ползват В САМАТА игра.');
  }
  if (req.parts.includes('parent')) {
    want.push('"parentNote": {"title":"…","paragraphs":["…","…"],"homeIdea":"…"} — кратка топла бележка до родителите (2 абзаца) какво играхме и какво упражнявахме, без лични данни на деца; "homeIdea" е игра вкъщи САМО по желание на семейството (чл. 32 — без домашна работа).');
  }
  if (req.parts.includes('supplies')) {
    want.push('"supplies": ["…"] — 3–6 кратки реда: какво да приготви учителят преди играта (пособия, подредба на мястото).');
  }
  return `Ти си опитен учител в българска детска градина (${KG.fullName}, ${KG.village}). Пишеш на БЪЛГАРСКИ, топло и ясно, за деца на ${g.ageRange} (${g.name}).
${naredba5PromptRules(req.ageGroup)}
${req.direction === 'bdp' || tasks.some((t) => t.direction === 'bdp') ? bdpPromptRules(req.ageGroup) : ''}

Подготви материали към тази игра:
Заглавие: „${req.game.title}“${req.topic.trim() ? `\nТема на седмицата: „${req.topic.trim()}“` : ''}
Ход на играта:
${req.game.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}
${tasks.length ? `Образователни задачи (Наредба № 5), към които водят и материалите:\n${tasks.map((t) => `- ${taskLine(t)}`).join('\n')}` : `Умения: ${req.game.pedagogicalGoal}`}
${req.resources ? `Налични материали: ${req.resources}` : ''}

Всички материали са свързани със същата игра, тема и задачи. Върни САМО валиден JSON обект (без markdown) с тези ключове:
${want.join('\n')}`;
}

/* ───────────────────────── Проверка на отговора ───────────────────────── */

function o(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}
function s(v: unknown, max = 400): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}
function list(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

function normalizeWorksheet(raw: unknown, req: KitRequest, fallback: Worksheet): Worksheet {
  const w = o(raw);
  const tasks = list(w.tasks)
    .map((t) => normalizeTask(t, req.ageGroup))
    .filter((t): t is WorksheetTask => t !== null)
    .slice(0, 4);
  if (tasks.length < Math.min(2, req.sheetKinds.length)) return fallback;
  return { ...fallback, title: s(w.title, 120) || fallback.title, tasks, teacherNote: s(w.teacherNote, 800) || fallback.teacherNote };
}

function normalizeCards(raw: unknown, fallback: PictureCards): PictureCards {
  const c = o(raw);
  const cards = list(c.cards)
    .map(pic)
    .filter((p): p is Pic => p !== null)
    .slice(0, 12);
  return cards.length >= 4 ? { title: s(c.title, 120) || fallback.title, cards } : fallback;
}

function normalizeParent(raw: unknown, fallback: KitParentNote): KitParentNote {
  const p = o(raw);
  const paragraphs = list(p.paragraphs)
    .map((x) => s(x, 900))
    .filter(Boolean)
    .slice(0, 3);
  if (!paragraphs.length) return fallback;
  const homeIdea = s(p.homeIdea, 500);
  return { title: s(p.title, 120) || fallback.title, paragraphs, ...(homeIdea ? { homeIdea } : {}) };
}

function normalizeSupplies(raw: unknown, fallback: string[]): string[] {
  const items = list(raw)
    .map((x) => s(x, 160))
    .filter(Boolean)
    .slice(0, 8);
  return items.length ? items : fallback;
}

/** Слива отговора на модела с вградения комплект — невалидната част се взима от `fallback`. */
export function normalizeKitResponse(raw: unknown, req: KitRequest, fallback: GameKit): GameKit {
  const r = o(raw);
  const kit: GameKit = {};
  if (fallback.worksheet) kit.worksheet = normalizeWorksheet(r.worksheet, req, fallback.worksheet);
  if (fallback.cards) kit.cards = normalizeCards(r.cards, fallback.cards);
  if (fallback.poster) kit.poster = true;
  if (fallback.parentNote) kit.parentNote = normalizeParent(r.parentNote, fallback.parentNote);
  if (fallback.supplies) kit.supplies = normalizeSupplies(r.supplies, fallback.supplies);
  return kit;
}

/** Картинка от записан лист: емоджи, число или цифра (без HTML), с дума за учителя. */
function savedPic(v: unknown): Pic | null {
  const p = o(v);
  const e = s(p.e, 48);
  const w = s(p.w, 40);
  return e && !/[<>]/.test(e) ? { e, w: w || e } : null;
}
const pics = (v: unknown, max: number) =>
  list(v)
    .map(savedPic)
    .filter((p): p is Pic => p !== null)
    .slice(0, max);

/** Задача от записан работен лист — само формата, без разбъркване (отговорите остават същите). */
function savedTask(raw: unknown, age: AgeGroup): WorksheetTask | null {
  const t = o(raw);
  const prompt = s(t.prompt, 200);
  if (!prompt) return null;
  switch (t.kind) {
    case 'count': {
      const max = COUNT_MAX[age];
      const groups = list(t.groups)
        .map((g) => ({ pic: savedPic(o(g).pic), count: Math.round(Number(o(g).count)) }))
        .filter((g): g is { pic: Pic; count: number } => !!g.pic && g.count >= 1 && g.count <= max)
        .slice(0, 4);
      return groups.length ? { kind: 'count', prompt, groups, max } : null;
    }
    case 'match': {
      const pairs = list(t.pairs)
        .map((p) => ({ left: savedPic(o(p).left), right: savedPic(o(p).right) }))
        .filter((p): p is { left: Pic; right: Pic } => !!p.left && !!p.right)
        .slice(0, 5);
      return pairs.length >= 2 ? { kind: 'match', prompt, pairs } : null;
    }
    case 'odd': {
      const rows = list(t.rows)
        .map((r) => {
          const items = pics(o(r).items, 5);
          const odd = Math.round(Number(o(r).odd));
          return items.length >= 3 && odd >= 0 && odd < items.length ? { items, odd } : null;
        })
        .filter((r): r is { items: Pic[]; odd: number } => r !== null)
        .slice(0, 3);
      return rows.length ? { kind: 'odd', prompt, rows } : null;
    }
    case 'sequence': {
      const pattern = pics(t.pattern, 3);
      return pattern.length >= 2 ? { kind: 'sequence', prompt, pattern, repeat: 2 } : null;
    }
    case 'trace': {
      const shapes = ['line', 'arches', 'wave', 'zigzag', 'loops'] as const;
      const shape = shapes.find((x) => x === t.shape) ?? 'wave';
      const start = savedPic(t.start);
      const end = savedPic(t.end);
      return start && end ? { kind: 'trace', prompt, shape, start, end } : null;
    }
    case 'sound': {
      const sound = s(t.sound, 2).toUpperCase();
      const list8 = pics(t.pics, 8);
      return sound && list8.length >= 2 ? { kind: 'sound', prompt, sound, pics: list8 } : null;
    }
    case 'draw':
      return { kind: 'draw', prompt };
    default:
      return null;
  }
}

/** Комплект от записана игра (библиотеката) — само формата; съдържанието е вече проверено при създаването. */
export function sanitizeKit(raw: unknown, ageGroup: AgeGroup = '4'): GameKit | undefined {
  const r = o(raw);
  const kit: GameKit = {};
  const w = o(r.worksheet);
  if (w.type === 'worksheet') {
    const age = (['1', '2', '3', '4'] as const).find((a) => a === w.ageGroup) ?? ageGroup;
    const tasks = list(w.tasks)
      .map((t) => savedTask(t, age))
      .filter((t): t is WorksheetTask => t !== null)
      .slice(0, 4);
    if (tasks.length) {
      kit.worksheet = {
        type: 'worksheet',
        title: s(w.title, 120) || 'Работен лист',
        ageGroup: age,
        direction: DIRECTIONS.find((d) => d === w.direction) ?? 'world',
        topic: s(w.topic, 120),
        tasks,
        teacherNote: s(w.teacherNote, 800),
      };
    }
  }
  const cards = pics(o(r.cards).cards, 12);
  if (cards.length) kit.cards = { title: s(o(r.cards).title, 120) || 'Карти за играта', cards };
  if (r.poster === true) kit.poster = true;
  const parent = o(r.parentNote);
  const paragraphs = list(parent.paragraphs)
    .map((x) => s(x, 900))
    .filter(Boolean)
    .slice(0, 3);
  if (paragraphs.length) {
    const homeIdea = s(parent.homeIdea, 500);
    kit.parentNote = { title: s(parent.title, 120) || 'Бележка до родителите', paragraphs, ...(homeIdea ? { homeIdea } : {}) };
  }
  const supplies = list(r.supplies)
    .map((x) => s(x, 160))
    .filter(Boolean)
    .slice(0, 8);
  if (supplies.length) kit.supplies = supplies;
  return Object.keys(kit).length ? kit : undefined;
}
