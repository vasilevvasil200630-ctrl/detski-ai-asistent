import { KG } from '../../config/kindergarten';
import { AGE_GROUP_STANDARDS, DIRECTION_STANDARDS, naredba5PromptRules } from '../naredba5';
import { BDP, bdpPromptRules } from '../bdp';
import type { AgeGroup, LessonDirection } from '../../types';
import { ANSWER_MAX, answersWithDots, buildDemoWorksheet, buildStyledWorksheet, countPrompt } from './worksheets';
import { HALF_SHAPE_IDS, solveMaze } from './drawings';
import { buildDemoVerses } from './verses';
import { buildDemoLetter, letterSignature } from './letters';
import {
  LETTER_LABELS,
  VERSES_LABELS,
  type ParentLetter,
  type Pic,
  type Printable,
  type PrintableRequest,
  type SheetKind,
  type VersesSheet,
  type DiffCell,
  type Worksheet,
  type WorksheetTask,
} from './types';

export * from './types';

/* ───────────────────────── Вграден двигател ───────────────────────── */

export function buildDemoPrintable(req: PrintableRequest): Printable {
  if (req.type === 'worksheet') {
    return req.style && req.style !== 'mixed'
      ? buildStyledWorksheet(req.ageGroup, req.direction, req.topic, req.style)
      : buildDemoWorksheet(req.ageGroup, req.direction, req.topic);
  }
  if (req.type === 'verses') return buildDemoVerses(req.ageGroup, req.kind, req.topic);
  return buildDemoLetter(req);
}

/* ───────────────────────── Промпт към модела ───────────────────────── */

export const SHEET_KIND_ORDER: SheetKind[] = ['count', 'match', 'odd', 'sequence', 'trace', 'sound', 'draw', 'maze', 'differences', 'half'];

/** Формата на всеки вид задача за модела (един ред на вид). */
export const SHEET_KIND_SPECS: Record<SheetKind, string> = {
  count: "\"count\": {\"kind\":\"count\",\"prompt\":\"…\",\"groups\":[{\"pic\":{\"e\":\"🍎\",\"w\":\"ябълка\"},\"count\":3}]} — 3–4 групи; в I–II група отговорът е карта с точки, не цифра",
  match: "\"match\": {\"kind\":\"match\",\"prompt\":\"Свържи …\",\"pairs\":[{\"left\":{\"e\":\"🐇\",\"w\":\"заек\"},\"right\":{\"e\":\"🥕\",\"w\":\"морков\"}}]} — 3–4 двойки, дясната колона ще се разбърка автоматично",
  odd: "\"odd\": {\"kind\":\"odd\",\"prompt\":\"Огради излишното.\",\"rows\":[{\"items\":[4 картинки],\"odd\":индекс на излишната 0–3}]} — 2–3 реда",
  sequence: "\"sequence\": {\"kind\":\"sequence\",\"prompt\":\"Продължи редицата.\",\"pattern\":[2–3 картинки]}",
  trace: "\"trace\": {\"kind\":\"trace\",\"prompt\":\"…\",\"shape\":\"line|arches|wave|zigzag|loops\",\"start\":{картинка},\"end\":{картинка}} — подготовка за писане",
  sound: "\"sound\": {\"kind\":\"sound\",\"prompt\":\"Огради картинките, които започват със звука „С“.\",\"sound\":\"С\",\"pics\":[6 картинки]} — само за IV група; без думи, които започват с я, ю, щ",
  draw: "\"draw\": {\"kind\":\"draw\",\"prompt\":\"Нарисувай …\"}",
  // Рисуваните задачи се правят от вградения двигател — моделът не ги получава
  maze: '',
  differences: '',
  half: '',
};


function directionText(d: LessonDirection): string {
  return d === 'bdp' ? `${BDP.label} (интегрирано в „Околен свят“)` : `${DIRECTION_STANDARDS[d].label} (ядра: ${DIRECTION_STANDARDS[d].cores.join(', ')})`;
}

export function buildPrintablePrompt(req: PrintableRequest): string {
  const group = AGE_GROUP_STANDARDS[req.ageGroup];
  const head = `Ти си опитен учител в българска детска градина (${KG.fullName}, ${KG.village}). Пишеш на БЪЛГАРСКИ, топло и ясно, за деца на ${group.ageRange} (${group.name}).
${naredba5PromptRules(req.ageGroup)}`;

  if (req.type === 'worksheet') {
    return `${head}
${req.direction === 'bdp' ? bdpPromptRules(req.ageGroup) : ''}
Създай РАБОТЕН ЛИСТ ЗА ПЕЧАТ в направление ${directionText(req.direction)} по темата „${req.topic || 'по избор, подходяща за сезона'}“.
Децата не четат — условията са кратки, за да ги прочете учителят. Картинките са ЕДНО емоджи всяка (без текст), с дума за учителя.
Числата в задачите за броене са от 1 до ${ANSWER_MAX[req.ageGroup]}${answersWithDots(req.ageGroup) ? ' (децата още не познават цифрите — отговорът е брой точки)' : ''}. Брой задачи: ${req.ageGroup === '1' || req.ageGroup === '2' ? 3 : 4}, различни по вид.
Видове задачи (поле "kind"):
${SHEET_KIND_ORDER.map((k) => `- ${SHEET_KIND_SPECS[k]}`).join('\n')}
Върни САМО валиден JSON (без markdown): {"title":"…","tasks":[…],"teacherNote":"цел по Наредба № 5 и отговорите"}`;
  }

  if (req.type === 'verses') {
    const what: Record<typeof req.kind, string> = {
      poem: '2 АВТОРСКИ стихчета (по 4–8 реда), наистина римувани, лесни за заучаване',
      riddles: `${req.ageGroup === '1' || req.ageGroup === '2' ? 3 : 5} гатанки (по 2–4 реда, римувани) с отговорите — отговорът да е предмет или животно, познати на детето`,
      counting: '3 броилки за избиране на водещ в игра (по 4 реда, ритмични, римувани)',
      tongue: '5 скоропоговорки (по един ред) за ясна реч — с повтарящи се звуци',
    };
    return `${head}
Напиши ${what[req.kind]} по темата „${req.topic || 'детската градина'}“. Всичко да е оригинално, весело и подходящо за възрастта.
Върни САМО валиден JSON (без markdown): {"title":"…","pieces":[{"title":"…","lines":["ред 1","ред 2"]}],"riddles":[{"lines":["ред 1","ред 2"],"answer":"отговор"}],"note":"кратък съвет към учителя"}.
${req.kind === 'riddles' ? 'Попълни "riddles", а "pieces" остави празен.' : 'Попълни "pieces", а "riddles" остави празен.'}`;
  }

  return `${head}
Напиши ${LETTER_LABELS[req.kind].toLowerCase()} до родителите от учителите на ${req.groupName || group.name} в ${KG.name}, ${KG.village}.
Повод/тема: „${req.topic || 'живота в групата'}“.${req.date ? ` Дата: ${req.date}.` : ''}${req.time ? ` Час: ${req.time}.` : ''}${req.place ? ` Място: ${req.place}.` : ''}${req.extra ? ` Допълнително: ${req.extra}` : ''}
Писмото е кратко (2–3 абзаца), учтиво, топло, без излишни обещания и без лични данни на деца. Не измисляй дати, часове или суми, които не са дадени.
Върни САМО валиден JSON (без markdown): {"title":"…","greeting":"Уважаеми родители,","paragraphs":["…","…"],"closing":"С уважение,"}`;
}

/* ───────────────────────── Проверка на отговора ───────────────────────── */

const EMOJI = /\p{Extended_Pictographic}|\p{Regional_Indicator}|[🔴🟡🟢🔵🟥🔺🔶]/u;

function str(v: unknown, max = 400): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : typeof v === 'number' ? String(v) : '';
}
function obj(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}
function arr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}
export function pic(v: unknown): Pic | null {
  const o = obj(v);
  const e = str(o.e ?? o.emoji, 24);
  const w = str(o.w ?? o.word, 40);
  return e && EMOJI.test(e) && e.length <= 24 ? { e, w: w || e } : null;
}
const shuffle = <T,>(a: T[]): T[] => {
  const c = [...a];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j]!, c[i]!];
  }
  return c;
};

export function normalizeTask(raw: unknown, age: AgeGroup): WorksheetTask | null {
  const t = obj(raw);
  const prompt = str(t.prompt, 200);
  if (!prompt) return null;
  const max = ANSWER_MAX[age];
  switch (t.kind) {
    case 'count': {
      const groups = arr(t.groups)
        .map((g) => ({ pic: pic(obj(g).pic), count: Math.round(Number(obj(g).count)) }))
        .filter((g): g is { pic: Pic; count: number } => !!g.pic && g.count >= 1 && g.count <= max)
        .slice(0, 4);
      // Условието е наше: точки за I–II група, число за III–IV група
      return groups.length >= 2 ? { kind: 'count', prompt: countPrompt(age), groups, max, ...(answersWithDots(age) ? { dots: true } : {}) } : null;
    }
    case 'match': {
      const pairs = arr(t.pairs)
        .map((p) => ({ left: pic(obj(p).left), right: pic(obj(p).right) }))
        .filter((p): p is { left: Pic; right: Pic } => !!p.left && !!p.right)
        .slice(0, 4);
      if (pairs.length < 2) return null;
      const rights = shuffle(pairs.map((p) => p.right));
      return { kind: 'match', prompt, pairs: pairs.map((p, i) => ({ left: p.left, right: rights[i]! })) };
    }
    case 'odd': {
      const rows = arr(t.rows)
        .map((r) => {
          const items = arr(obj(r).items).map(pic).filter((p): p is Pic => !!p).slice(0, 5);
          const odd = Math.round(Number(obj(r).odd));
          return items.length >= 3 && odd >= 0 && odd < items.length ? { items, odd } : null;
        })
        .filter((r): r is { items: Pic[]; odd: number } => !!r)
        .slice(0, 3);
      return rows.length ? { kind: 'odd', prompt, rows } : null;
    }
    case 'sequence': {
      const pattern = arr(t.pattern).map(pic).filter((p): p is Pic => !!p).slice(0, 3);
      return pattern.length >= 2 ? { kind: 'sequence', prompt, pattern, repeat: 2 } : null;
    }
    case 'trace': {
      const shapes = ['line', 'arches', 'wave', 'zigzag', 'loops'] as const;
      const shape = shapes.find((s) => s === t.shape) ?? 'wave';
      const start = pic(t.start);
      const end = pic(t.end);
      return start && end ? { kind: 'trace', prompt, shape, start, end } : null;
    }
    case 'sound': {
      if (age !== '4') return null;
      const sound = str(t.sound, 2).toUpperCase();
      const pics = arr(t.pics).map(pic).filter((p): p is Pic => !!p).slice(0, 8);
      return sound && pics.length >= 4 ? { kind: 'sound', prompt, sound, pics } : null;
    }
    case 'draw':
      return { kind: 'draw', prompt };
    default:
      return null;
  }
}

/* Рисуваните задачи от записан лист: само формата (без разбъркване), с граници за размерите. */

function savedCell(v: unknown): DiffCell {
  const c = pic(v);
  return c ? { ...c, ...(obj(v).big === true ? { big: true } : {}) } : null;
}

/** Лабиринт, „Открий разликите“ и „Дорисувай половината“ от записан лист (библиотеката, комплекта). */
export function savedDrawnTask(raw: unknown): WorksheetTask | null {
  const t = obj(raw);
  const prompt = str(t.prompt, 200);
  if (!prompt) return null;
  const size = (v: unknown, max: number) => {
    const n = Math.round(Number(v));
    return n >= 2 && n <= max ? n : 0;
  };
  if (t.kind === 'maze') {
    const cols = size(t.cols, 12);
    const rows = size(t.rows, 10);
    const walls = str(t.walls, 200);
    const start = pic(t.start);
    const end = pic(t.end);
    if (!cols || !rows || !start || !end || !/^[0-3]+$/.test(walls) || !solveMaze(cols, rows, walls)) return null;
    return { kind: 'maze', prompt, cols, rows, walls, start, end };
  }
  if (t.kind === 'differences') {
    const cols = size(t.cols, 6);
    const rows = size(t.rows, 6);
    const left = arr(t.left).map(savedCell);
    const right = arr(t.right).map(savedCell);
    const count = size(t.count, 10) || 1;
    if (!cols || !rows || left.length !== cols * rows || right.length !== cols * rows) return null;
    return { kind: 'differences', prompt, cols, rows, left, right, count };
  }
  if (t.kind === 'half') {
    const shape = HALF_SHAPE_IDS.find((s) => s === t.shape);
    return shape ? { kind: 'half', prompt, shape, mode: t.mode === 'trace' ? 'trace' : 'grid' } : null;
  }
  return null;
}

/** Слива отговора на модела с вградения резултат: невалидното се взима от `fallback`. */
export function normalizePrintable(raw: unknown, req: PrintableRequest, fallback: Printable): Printable {
  const o = obj(raw);
  if (req.type === 'worksheet' && fallback.type === 'worksheet') {
    const tasks = arr(o.tasks).map((t) => normalizeTask(t, req.ageGroup)).filter((t): t is WorksheetTask => !!t).slice(0, 4);
    if (tasks.length < 2) throw new Error('Работният лист няма достатъчно валидни задачи');
    const ws: Worksheet = { ...fallback, title: str(o.title, 120) || fallback.title, tasks, teacherNote: str(o.teacherNote, 800) || fallback.teacherNote };
    return ws;
  }
  if (req.type === 'verses' && fallback.type === 'verses') {
    const pieces = arr(o.pieces)
      .map((p) => ({ title: str(obj(p).title, 80), lines: arr(obj(p).lines).map((l) => str(l, 160)).filter(Boolean).slice(0, 12) }))
      .filter((p) => p.lines.length > 0)
      .slice(0, 6);
    const riddles = arr(o.riddles)
      .map((r) => ({ lines: arr(obj(r).lines).map((l) => str(l, 160)).filter(Boolean).slice(0, 6), answer: str(obj(r).answer, 60) }))
      .filter((r) => r.lines.length > 0 && r.answer)
      .slice(0, 8);
    const ok = req.kind === 'riddles' ? riddles.length >= 2 : pieces.length >= 1;
    if (!ok) throw new Error('Няма валидни стихчета/гатанки');
    const vs: VersesSheet = { ...fallback, title: str(o.title, 120) || fallback.title, pieces: req.kind === 'riddles' ? [] : pieces, riddles: req.kind === 'riddles' ? riddles : [], note: str(o.note, 300) || fallback.note };
    return vs;
  }
  if (req.type === 'letter' && fallback.type === 'letter') {
    const paragraphs = arr(o.paragraphs).map((p) => str(p, 900)).filter(Boolean).slice(0, 5);
    if (!paragraphs.length) throw new Error('Писмото няма текст');
    const letter: ParentLetter = {
      ...fallback,
      title: str(o.title, 120) || fallback.title,
      greeting: str(o.greeting, 80) || fallback.greeting,
      paragraphs,
      closing: str(o.closing, 80) || fallback.closing,
      signature: letterSignature(req.ageGroup, req.groupName),
    };
    return letter;
  }
  return fallback;
}

/* ───────────────────────── Текст (за библиотеката и копиране) ───────────────────────── */

export function printableToText(p: Printable): string {
  if (p.type === 'worksheet') {
    return [
      p.title,
      '',
      ...p.tasks.map((t, i) => {
        const pics = (list: Pic[]) => list.map((x) => x.e).join(' ');
        let body = '';
        if (t.kind === 'count') body = t.groups.map((g) => g.pic.e.repeat(g.count)).join('   ');
        if (t.kind === 'match') body = t.pairs.map((pr) => `${pr.left.e} — ${pr.right.e}`).join('   ');
        if (t.kind === 'odd') body = t.rows.map((r) => pics(r.items)).join(' | ');
        if (t.kind === 'sequence') body = `${pics(t.pattern)} ${pics(t.pattern)} …`;
        if (t.kind === 'trace') body = `${t.start.e} ┈┈┈┈ ${t.end.e}`;
        if (t.kind === 'sound') body = pics(t.pics);
        if (t.kind === 'maze') body = `${t.start.e} → лабиринт ${t.cols}×${t.rows} → ${t.end.e}`;
        if (t.kind === 'differences') {
          const row = (cells: DiffCell[]) => cells.map((c) => c?.e ?? '·').join(' ');
          body = `${row(t.left)}   |   ${row(t.right)}`;
        }
        if (t.kind === 'half') body = '(рисунката е в листа за печат)';
        return `${i + 1}. ${t.prompt}${body ? `\n   ${body}` : ''}`;
      }),
      '',
      `За учителя: ${p.teacherNote}`,
    ].join('\n');
  }
  if (p.type === 'verses') {
    const pieces = p.pieces.map((x) => [x.title, ...x.lines].filter(Boolean).join('\n'));
    const riddles = p.riddles.map((r, i) => `${i + 1}. ${r.lines.join('\n   ')}\n   (Отговор: ${r.answer})`);
    return [p.title, '', ...pieces.flatMap((x) => [x, '']), ...riddles, ...(p.note ? ['', p.note] : [])].join('\n').trim();
  }
  return [
    p.title,
    '',
    p.greeting,
    '',
    ...p.paragraphs.flatMap((x) => [x, '']),
    ...p.details.map((d) => `${d.label}: ${d.value}`),
    ...(p.details.length ? [''] : []),
    p.closing,
    p.signature,
  ].join('\n');
}

export function isPrintable(v: unknown): v is Printable {
  const t = obj(v).type;
  return t === 'worksheet' || t === 'verses' || t === 'letter';
}

export { VERSES_LABELS, LETTER_LABELS };
