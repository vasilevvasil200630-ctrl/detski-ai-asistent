import type { AgeGroup } from '../../types';
import type { DiffCell, HalfShapeId, Pic, WorksheetTask } from './types';

/**
 * Задачите, които се рисуват (а не се пишат): лабиринт, „Открий разликите“ и „Дорисувай половината“.
 * Създават се само от вградения двигател — моделът не може да начертае лабиринт без грешка.
 * Сложността следва групата: по-малки лабиринти и по-малко разлики за I–II група;
 * по пунктира за I–II, по точките в квадратна мрежа за III–IV (Наредба № 5, „Пространствени отношения“).
 */

export const DRAWN_KINDS = ['maze', 'differences', 'half'] as const;
export type DrawnKind = (typeof DRAWN_KINDS)[number];
export const isDrawnKind = (k: string): k is DrawnKind => (DRAWN_KINDS as readonly string[]).includes(k);

function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/* ───────────────────────── Лабиринт ───────────────────────── */

/** Колони × редове по групи. */
export const MAZE_SIZE: Record<AgeGroup, [number, number]> = { '1': [4, 3], '2': [5, 4], '3': [7, 5], '4': [9, 6] };

/**
 * Лабиринт с един-единствен път между всеки две клетки (обхождане в дълбочина).
 * Всяка клетка е цифра 0–3: +1 стена вдясно, +2 стена отдолу. Входът е вляво на горната лява
 * клетка, изходът — вдясно на долната дясна.
 */
export function generateMaze(cols: number, rows: number): string {
  const right = new Array<boolean>(cols * rows).fill(true);
  const bottom = new Array<boolean>(cols * rows).fill(true);
  const seen = new Array<boolean>(cols * rows).fill(false);
  const stack = [0];
  seen[0] = true;
  while (stack.length) {
    const cur = stack[stack.length - 1]!;
    const x = cur % cols;
    const y = Math.floor(cur / cols);
    const next = shuffle(
      [
        [x + 1, y],
        [x - 1, y],
        [x, y + 1],
        [x, y - 1],
      ].filter(([nx, ny]) => nx! >= 0 && ny! >= 0 && nx! < cols && ny! < rows && !seen[ny! * cols + nx!]),
    )[0];
    if (!next) {
      stack.pop();
      continue;
    }
    const [nx, ny] = next as [number, number];
    const n = ny * cols + nx;
    if (nx > x) right[cur] = false;
    if (nx < x) right[n] = false;
    if (ny > y) bottom[cur] = false;
    if (ny < y) bottom[n] = false;
    seen[n] = true;
    stack.push(n);
  }
  return right.map((r, i) => String((r ? 1 : 0) + (bottom[i] ? 2 : 0))).join('');
}

/** Пътят от входа до изхода (индекси на клетките) — за проверка и за учителя; null, ако няма път. */
export function solveMaze(cols: number, rows: number, walls: string): number[] | null {
  const n = cols * rows;
  if (walls.length !== n) return null;
  const w = (i: number) => Number(walls[i]);
  const prev = new Array<number>(n).fill(-2);
  prev[0] = -1;
  const queue = [0];
  while (queue.length) {
    const cur = queue.shift()!;
    if (cur === n - 1) break;
    const x = cur % cols;
    const moves: number[] = [];
    if (x < cols - 1 && !(w(cur) & 1)) moves.push(cur + 1);
    if (x > 0 && !(w(cur - 1) & 1)) moves.push(cur - 1);
    if (cur + cols < n && !(w(cur) & 2)) moves.push(cur + cols);
    if (cur - cols >= 0 && !(w(cur - cols) & 2)) moves.push(cur - cols);
    for (const m of moves) {
      if (prev[m] !== -2) continue;
      prev[m] = cur;
      queue.push(m);
    }
  }
  if (prev[n - 1] === -2) return null;
  const path: number[] = [];
  for (let c = n - 1; c !== -1; c = prev[c]!) path.unshift(c);
  return path;
}

export function mazeTask(pics: Pic[], age: AgeGroup, focus?: Pic): WorksheetTask {
  const [cols, rows] = MAZE_SIZE[age];
  // Главният предмет на темата е началото на пътя („от ябълката до …“)
  const rest = shuffle(focus ? pics.filter((p) => p.e !== focus.e) : pics);
  const [start, end] = focus ? [focus, rest[0] ?? focus] : rest;
  return {
    kind: 'maze',
    prompt: `Начертай пътя през лабиринта — от ${start!.w} до ${end!.w}, без да минаваш през стена.`,
    cols,
    rows,
    walls: generateMaze(cols, rows),
    start: start!,
    end: end!,
  };
}

/* ───────────────────────── Открий разликите ───────────────────────── */

/** Колони × редове и брой разлики по групи. */
export const DIFF_SIZE: Record<AgeGroup, { cols: number; rows: number; count: number }> = {
  '1': { cols: 3, rows: 2, count: 2 },
  '2': { cols: 3, rows: 3, count: 3 },
  '3': { cols: 4, rows: 3, count: 4 },
  '4': { cols: 4, rows: 4, count: 5 },
};

/**
 * Две „сцени“ от картинките на темата; в дясната има `count` разлики: друга картинка,
 * липсваща, добавена или по-голяма. Разположението е едно и също, за да се сравнява лесно.
 */
export function differencesTask(pics: Pic[], extra: Pic[], age: AgeGroup, focus?: Pic): WorksheetTask {
  const { cols, rows, count } = DIFF_SIZE[age];
  const total = cols * rows;
  const pool = shuffle(pics);
  const empty = new Set(shuffle(Array.from({ length: total }, (_, i) => i)).slice(0, Math.floor(total / 4)));
  const left: DiffCell[] = Array.from({ length: total }, (_, i) => (empty.has(i) ? null : { ...pool[i % pool.length]! }));
  // Главният предмет на темата е в картинката поне два пъти
  if (focus) {
    const filled = shuffle(left.map((c, i) => (c ? i : -1)).filter((i) => i >= 0)).slice(0, 2);
    for (const i of filled) left[i] = { ...focus };
  }
  const right: DiffCell[] = left.map((c) => (c ? { ...c } : null));
  // Заместващите картинки — все различни, за да не се повтаря една и съща разлика
  const swaps = shuffle([...extra, ...pics]);
  let next = 0;
  const swapFor = (avoid: string | undefined) => {
    for (let k = 0; k < swaps.length; k++) {
      const p = swaps[(next + k) % swaps.length]!;
      if (p.e !== avoid) {
        next = (next + k + 1) % swaps.length;
        return { ...p };
      }
    }
    return { ...swaps[0]! };
  };
  for (const i of shuffle(Array.from({ length: total }, (_, k) => k)).slice(0, count)) {
    const cell = left[i];
    if (!cell) {
      right[i] = swapFor(left[i - 1]?.e); // добавена картинка
      continue;
    }
    const kinds = shuffle(['swap', 'missing', 'big'] as const);
    const how = age === '1' && kinds[0] === 'big' ? kinds[1]! : kinds[0]!; // най-малките — по-явни разлики
    if (how === 'missing') right[i] = null;
    else if (how === 'big') right[i] = { ...cell, big: true };
    else right[i] = swapFor(cell.e);
  }
  return {
    kind: 'differences',
    prompt: `Открий ${count} разлики между двете картинки и ги огради в дясната.`,
    cols,
    rows,
    left,
    right,
    count,
  };
}

/** Описание на разликите за учителя: „ред 1: ябълка → круша; ред 2: липсва котка …“ */
export function describeDifferences(t: Extract<WorksheetTask, { kind: 'differences' }>): string[] {
  const out: string[] = [];
  t.left.forEach((l, i) => {
    const r = t.right[i] ?? null;
    const where = `ред ${Math.floor(i / t.cols) + 1}`;
    if (l && !r) out.push(`${where}: липсва ${l.w}`);
    else if (!l && r) out.push(`${where}: добавен(а) ${r.w}`);
    else if (l && r && l.e !== r.e) out.push(`${where}: ${l.w} → ${r.w}`);
    else if (l && r && Boolean(l.big) !== Boolean(r.big)) out.push(`${where}: по-голям(а) ${r.w}`);
  });
  return out;
}

/* ───────────────────────── Дорисувай половината ───────────────────────── */

type Pt = [number, number];

/**
 * Симетрични рисунки върху квадратна мрежа. `outline` е лявата половина на контура — от точка
 * на оста горе до точка на оста долу; `lines` са подробности от лявата страна (огледалото се дорисува).
 */
export const HALF_SHAPES: Record<HalfShapeId, { name: string; the: string; w: number; h: number; outline: Pt[]; lines: Pt[][]; simple?: boolean }> = {
  house: { name: 'къща', the: 'къщата', w: 8, h: 10, outline: [[4, 0], [0, 4], [1, 4], [1, 10], [4, 10]], lines: [[[3, 10], [3, 7], [4, 7]], [[2, 5], [3, 5], [3, 6], [2, 6], [2, 5]]] },
  tree: { name: 'елха', the: 'елхата', w: 8, h: 11, outline: [[4, 0], [2, 3], [3, 3], [1, 6], [2, 6], [0, 9], [3, 9], [3, 11], [4, 11]], lines: [], simple: true },
  heart: { name: 'сърце', the: 'сърцето', w: 8, h: 8, outline: [[4, 2], [3, 1], [1, 1], [0, 2], [0, 4], [4, 8]], lines: [], simple: true },
  butterfly: { name: 'пеперуда', the: 'пеперудата', w: 8, h: 9, outline: [[4, 3], [2, 0], [0, 0], [0, 4], [2, 5], [0, 7], [1, 9], [4, 6]], lines: [[[4, 2], [4, 8]], [[1, 2], [2, 2], [2, 3], [1, 3], [1, 2]]] },
  apple: { name: 'ябълка', the: 'ябълката', w: 8, h: 10, outline: [[4, 2], [2, 1], [1, 2], [0, 4], [0, 7], [1, 9], [3, 10], [4, 9]], lines: [[[4, 2], [4, 0]]], simple: true },
  mushroom: { name: 'гъба', the: 'гъбата', w: 8, h: 8, outline: [[4, 0], [2, 1], [0, 3], [0, 4], [3, 4], [3, 8], [4, 8]], lines: [[[2, 2], [2, 3]]] },
  tulip: { name: 'лале', the: 'лалето', w: 8, h: 11, outline: [[4, 2], [3, 0], [1, 1], [1, 4], [2, 5], [4, 5]], lines: [[[4, 5], [4, 11]], [[4, 10], [2, 7], [4, 9]]] },
  rocket: { name: 'ракета', the: 'ракетата', w: 8, h: 11, outline: [[4, 0], [3, 2], [3, 7], [1, 9], [1, 10], [3, 9], [3, 10], [4, 10]], lines: [[[4, 3], [3, 4], [4, 5]]] },
  car: { name: 'кола', the: 'колата', w: 10, h: 7, outline: [[5, 0], [3, 0], [2, 2], [0, 2], [0, 5], [5, 5]], lines: [[[1, 5], [1, 6], [2, 7], [3, 6], [3, 5]], [[3, 0], [3, 2]]] },
  owl: { name: 'бухал', the: 'бухала', w: 8, h: 9, outline: [[4, 1], [3, 1], [1, 0], [1, 2], [0, 4], [0, 7], [2, 9], [4, 9]], lines: [[[2, 3], [3, 3], [3, 4], [2, 4], [2, 3]], [[4, 5], [3.5, 6], [4, 6]]] },
};

/** Коя рисунка подхожда на темата (по идентификатора от themes.ts). */
const SHAPES_BY_THEME: Record<string, HalfShapeId[]> = {
  autumn: ['apple', 'mushroom', 'owl'],
  winter: ['tree', 'house', 'heart'],
  spring: ['tulip', 'butterfly', 'heart'],
  summer: ['butterfly', 'apple', 'tulip'],
  wild: ['owl', 'butterfly', 'tree'],
  farm: ['house', 'apple', 'owl'],
  food: ['apple', 'mushroom', 'heart'],
  transport: ['car', 'rocket', 'house'],
  space: ['rocket', 'house', 'heart'],
  water: ['tulip', 'butterfly', 'mushroom'],
  jobs: ['house', 'car', 'rocket'],
  home: ['house', 'heart', 'tree'],
  music: ['heart', 'butterfly', 'house'],
  toys: ['rocket', 'car', 'heart'],
};

/** Рисунката за главния предмет на темата („Ябълка“ → ябълка, „Сова“ → бухал). */
const SHAPE_FOR_WORD: Record<string, HalfShapeId> = {
  ябълка: 'apple',
  гъба: 'mushroom',
  лале: 'tulip',
  цвете: 'tulip',
  маргаритка: 'tulip',
  пеперуда: 'butterfly',
  елха: 'tree',
  дърво: 'tree',
  къща: 'house',
  сърце: 'heart',
  ракета: 'rocket',
  кола: 'car',
  сова: 'owl',
};

export function halfTask(themeId: string, age: AgeGroup, avoid?: HalfShapeId, focus?: Pic): WorksheetTask {
  const own = focus ? SHAPE_FOR_WORD[focus.w.toLowerCase()] : undefined;
  const ids = (SHAPES_BY_THEME[themeId] ?? (Object.keys(HALF_SHAPES) as HalfShapeId[])).filter((id) => id !== avoid);
  const fit = age === '1' ? ids.filter((id) => HALF_SHAPES[id].simple) : ids;
  const ownFits = own && own !== avoid && (age !== '1' || HALF_SHAPES[own].simple);
  const shape = ownFits ? own : shuffle(fit.length ? fit : (['heart', 'tree', 'apple'] as HalfShapeId[]).filter((id) => id !== avoid))[0]!;
  const mode = age === '1' || age === '2' ? 'trace' : 'grid';
  const s = HALF_SHAPES[shape];
  return {
    kind: 'half',
    prompt:
      mode === 'trace'
        ? `Дорисувай другата половина на ${s.the} по пунктира. После я оцвети.`
        : `Дорисувай другата половина на ${s.the} по точките — като в огледало. После я оцвети.`,
    shape,
    mode,
  };
}

/** Целият контур и подробностите (с огледалната половина) — за рисуването. */
export function halfShapePaths(id: HalfShapeId): { w: number; h: number; left: Pt[][]; right: Pt[][] } {
  const s = HALF_SHAPES[id];
  const mirror = (pts: Pt[]): Pt[] => pts.map(([x, y]) => [s.w - x, y]);
  const left = [s.outline, ...s.lines];
  return { w: s.w, h: s.h, left, right: left.map(mirror) };
}

export const HALF_SHAPE_IDS = Object.keys(HALF_SHAPES) as HalfShapeId[];
