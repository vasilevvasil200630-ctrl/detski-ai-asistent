import type { AgeGroup, LessonDirection } from '../../types';
import { DIRECTION_STANDARDS } from '../naredba5';
import { MATCH_PAIRS, PATTERN_PICS, THEMES, otherThemePics, themeFor, type Theme } from './themes';
import type { Pic, SheetKind, Worksheet, WorksheetStyle, WorksheetTask } from './types';
import { describeDifferences, differencesTask, halfTask, mazeTask } from './drawings';

/**
 * Вграден генератор на работни листове (без връзка към модела). Всяко извикване разбърква
 * картинките и броевете, така че листовете са различни. Сложността следва очакваните
 * резултати по групи от Наредба № 5 (числов обхват, графомоторика, звуков анализ).
 */

/** До колко броят децата по групи (приложение № 2, „Количествени отношения“) — горната граница при проверка. */
export const COUNT_MAX: Record<AgeGroup, number> = { '1': 3, '2': 5, '3': 10, '4': 10 };
/**
 * До колко е отговорът в листа: цифрите са очакван резултат едва в III група (до 5) и в IV група (до 10);
 * в I и II група децата ограждат карта със същия брой точки, не цифра.
 */
export const ANSWER_MAX: Record<AgeGroup, number> = { '1': 3, '2': 5, '3': 5, '4': 10 };
export const answersWithDots = (age: AgeGroup) => age === '1' || age === '2';
const DOTS_PROMPT = 'Преброй картинките и огради картата със същия брой точки.';
const DIGITS_PROMPT = 'Преброй картинките и огради числото.';
export const countPrompt = (age: AgeGroup) => (answersWithDots(age) ? DOTS_PROMPT : DIGITS_PROMPT);
/** Букви, които не са един звук в началото на думата (я = й+а, ю = й+у, щ = ш+т) или не започват дума. */
const NOT_ONE_SOUND = new Set(['Я', 'Ю', 'Щ', 'Ь', 'Ъ']);
const TASKS_PER_SHEET: Record<AgeGroup, number> = { '1': 3, '2': 3, '3': 4, '4': 4 };
const TRACE_BY_AGE: Record<AgeGroup, Extract<WorksheetTask, { kind: 'trace' }>['shape']> = {
  '1': 'line',
  '2': 'arches',
  '3': 'wave',
  '4': 'loops',
};

function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}
const randInt = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));

/** Картинките на темата: главният предмет винаги е сред избраните, останалите — разбъркани. */
function withFocus(pics: Pic[], n: number, focus?: Pic): Pic[] {
  if (!focus) return shuffle(pics).slice(0, n);
  return shuffle([focus, ...shuffle(pics.filter((p) => p.e !== focus.e)).slice(0, n - 1)]);
}

function countTask(pics: Pic[], age: AgeGroup, focus?: Pic): WorksheetTask {
  const max = ANSWER_MAX[age];
  const n = age === '1' || age === '2' ? 3 : 4;
  const groups = withFocus(pics, n, focus).map((pic) => ({ pic, count: randInt(1, max) }));
  return { kind: 'count', prompt: countPrompt(age), groups, max, ...(answersWithDots(age) ? { dots: true } : {}) };
}

function sequenceTask(pattern: Pic[], age: AgeGroup, focus?: Pic): WorksheetTask {
  // I–II група: две картинки (АБ АБ), III–IV: три (АБВ или ААБ)
  const base = withFocus(pattern, age === '1' || age === '2' ? 2 : 3, focus);
  // ААБ: главният предмет остава в редицата
  const ab = focus ? [focus, base.find((p) => p.e !== focus.e) ?? focus] : [base[0]!, base[1]!];
  const unit = age === '4' && base.length === 3 && Math.random() < 0.5 ? [ab[0]!, ab[0]!, ab[1]!] : base;
  return { kind: 'sequence', prompt: 'Продължи редицата — нарисувай какво следва.', pattern: unit, repeat: 2 };
}

function oddTask(pics: Pic[], themeId: string, rows: number, focus?: Pic): WorksheetTask {
  // Общият набор (тема без съвпадение) е смесен и няма „група“ — взима се истинска тема
  if (themeId === 'default') {
    const theme = shuffle(THEMES.filter((t) => t.id !== 'toys'))[0]!;
    return oddTask(theme.pics, theme.id, rows);
  }
  const others = shuffle(otherThemePics(themeId).filter((o) => !pics.some((p) => p.e === o.e)));
  return {
    kind: 'odd',
    prompt: 'Огради картинката, която не е от тази група.',
    rows: Array.from({ length: rows }, (_, i) => {
      // Главният предмет е в първия ред (той е от групата, не е излишният)
      const items = i === 0 ? withFocus(pics, 3, focus) : shuffle(pics).slice(0, 3);
      const odd = randInt(0, 3);
      items.splice(odd, 0, others[i % others.length]!);
      return { items, odd };
    }),
  };
}

function matchTask(pairs: readonly (readonly [Pic, Pic])[], prompt: string, n: number): WorksheetTask {
  const chosen = shuffle(pairs).slice(0, n);
  const rights = shuffle(chosen.map(([, r]) => r));
  return { kind: 'match', prompt, pairs: chosen.map(([l], i) => ({ left: l, right: rights[i]! })) };
}

/** Съвпадението се пази по реда на картинките вляво; дясната колона е разбъркана (виж teacherNote). */
function countMatchTask(pics: Pic[], age: AgeGroup): WorksheetTask {
  const max = ANSWER_MAX[age];
  const dots = answersWithDots(age);
  const nums = shuffle(Array.from({ length: max }, (_, i) => i + 1)).slice(0, Math.min(4, max));
  const pairs = nums.map((n, i) => ({ left: { e: pics[i % pics.length]!.e.repeat(n), w: `${n}` }, right: { e: dots ? '●'.repeat(n) : String(n), w: `${n}` } }));
  const rights = shuffle(pairs.map((p) => p.right));
  return {
    kind: 'match',
    prompt: dots ? 'Свържи всяка група с картата със същия брой точки.' : 'Свържи всяка група с нейното число.',
    pairs: pairs.map((p, i) => ({ left: p.left, right: rights[i]! })),
  };
}

function traceTask(pics: Pic[], age: AgeGroup, prompt = 'Следвай пунктира с молив, без да вдигаш ръка.', focus?: Pic): WorksheetTask {
  const rest = shuffle(focus ? pics.filter((p) => p.e !== focus.e) : pics);
  const [start, end] = focus ? [focus, rest[0] ?? focus] : rest;
  return { kind: 'trace', prompt, shape: TRACE_BY_AGE[age], start: start!, end: end! };
}

/** Звук, с който започват поне 2 от картинките, плюс 2–3 картинки с друг звук. */
function soundTask(pics: Pic[]): WorksheetTask | null {
  const byLetter = new Map<string, Pic[]>();
  for (const p of pics) {
    const letter = p.w.charAt(0).toUpperCase();
    if (NOT_ONE_SOUND.has(letter)) continue;
    byLetter.set(letter, [...(byLetter.get(letter) ?? []), p]);
  }
  const all = [...pics, ...otherThemePics('')];
  for (const [letter, group] of shuffle([...byLetter.entries()])) {
    const sameAnywhere = all.filter((p) => p.w.charAt(0).toUpperCase() === letter);
    if (sameAnywhere.length < 2) continue;
    const yes = shuffle(sameAnywhere).slice(0, 3);
    const no = shuffle(all.filter((p) => p.w.charAt(0).toUpperCase() !== letter)).slice(0, 3);
    void group;
    return { kind: 'sound', prompt: `Огради картинките, чиито имена започват със звука „${letter}“.`, sound: letter, pics: shuffle([...yes, ...no]) };
  }
  return null;
}

const draw = (prompt: string): WorksheetTask => ({ kind: 'draw', prompt });

/**
 * „Свържи“ по темата: двойките на направлението, които са свързани с темата (напр. заек — морков
 * при „Зеленчуци“). Ако са малко, „свържи групата с броя“ с картинките на темата.
 */
function topicMatch(theme: Theme, pairs: readonly (readonly [Pic, Pic])[], prompt: string, n: number, age: AgeGroup): WorksheetTask {
  if (theme.id === 'default') return matchTask(pairs, prompt, n);
  const inTheme = new Set(theme.pics.map((p) => p.e));
  const relevant = pairs.filter(([l, r]) => inTheme.has(l.e) || inTheme.has(r.e));
  return relevant.length >= n ? matchTask(relevant, prompt, n) : countMatchTask(withFocus(theme.pics, theme.pics.length, theme.focus), age);
}

/** Шарката за „продължи редицата“: при тема с главен предмет — картинките на темата. */
const patternFor = (theme: Theme, own: readonly Pic[]) => (theme.focus ? theme.pics : [...own]);

const coin = () => Math.random() < 0.5;

function tasksFor(direction: LessonDirection, age: AgeGroup, topic: string): WorksheetTask[] {
  const theme = themeFor(topic);
  const pics = theme.pics;
  // Главният предмет на темата („ябълка“) — във всяка задача, която има картинки
  const f = theme.focus;
  const t = topic.trim() || 'темата';
  const older = age === '3' || age === '4';
  switch (direction) {
    case 'math':
      // III–IV група: лабиринтът е очакван резултат („ориентира се … в квадратна мрежа, лабиринт“)
      return [countTask(pics, age, f), countMatchTask(withFocus(pics, pics.length, f), age), sequenceTask(pics, age, f), older && coin() ? mazeTask(pics, age, f) : oddTask(pics, theme.id, older ? 3 : 2, f)];
    case 'bel': {
      // „Определя звука в началото и в края на думата“ — очакван резултат за IV група
      const sound = age === '4' ? soundTask(pics) : null;
      return [
        ...(sound ? [sound] : [oddTask(pics, theme.id, 2, f)]),
        traceTask(pics, age, undefined, f),
        draw(`Нарисувай героя от приказката, която слушахме за „${t}“.`),
        ...(older ? [oddTask(pics, theme.id, 2, f)] : []),
      ];
    }
    case 'world':
      return [oddTask(pics, theme.id, older ? 3 : 2, f), topicMatch(theme, MATCH_PAIRS.world, 'Свържи животното с това, което яде.', older ? 4 : 3, age), coin() ? differencesTask(pics, otherThemePics(theme.id), age, f) : countTask(pics, age, f), draw(`Нарисувай какво научи за „${t}“.`)];
    case 'art':
      return [sequenceTask(patternFor(theme, PATTERN_PICS.art), age, f), halfTask(theme.id, age, undefined, f), traceTask(pics, age, 'Довърши шарката по пунктира и я оцвети.', f), draw(`Нарисувай и оцвети „${t}“ с любимите си цветове.`)];
    case 'music':
      return [countTask([...PATTERN_PICS.music.slice(0, 2), ...pics.slice(0, 2)], age, f), sequenceTask([...PATTERN_PICS.music], age), matchTask(MATCH_PAIRS.music, 'Свържи еднаквите инструменти.', older ? 4 : 3), draw('Нарисувай инструмента, на който искаш да свириш.')];
    case 'construct':
      return [topicMatch(theme, MATCH_PAIRS.construct, 'Свържи човека с инструмента, с който работи.', older ? 4 : 3, age), sequenceTask(patternFor(theme, PATTERN_PICS.construct), age, f), countTask(f ? pics : [...PATTERN_PICS.construct], age, f), draw(`Нарисувай какво би построил/а за „${t}“.`)];
    case 'pe':
      return [older && coin() ? mazeTask(pics, age, f) : traceTask(pics, age, 'Помогни да стигне до другата картинка — следвай пътечката.', f), sequenceTask(patternFor(theme, PATTERN_PICS.pe), age, f), countTask(pics, age, f), draw('Нарисувай любимата си игра навън.')];
    case 'bdp':
      return [sequenceTask([...PATTERN_PICS.bdp], age), matchTask(MATCH_PAIRS.bdp, 'Свържи всеки с мястото, където се движи.', older ? 4 : 3), oddTask(themeFor('транспорт').pics, 'transport', 2), draw('Нарисувай светофар и оцвети светлините му в правилния ред.')];
  }
}

function answersNote(tasks: WorksheetTask[]): string[] {
  const out: string[] = [];
  tasks.forEach((task, i) => {
    const n = i + 1;
    if (task.kind === 'count') out.push(`${n}. ${task.groups.map((g) => `${g.pic.w} — ${g.count}`).join(', ')}.`);
    if (task.kind === 'odd') out.push(`${n}. ${task.rows.map((r) => r.items[r.odd]!.w).join(', ')}.`);
    if (task.kind === 'sound') out.push(`${n}. ${task.pics.filter((p) => p.w.charAt(0).toUpperCase() === task.sound).map((p) => p.w).join(', ')}.`);
    if (task.kind === 'match' && (task.prompt.includes('число') || task.prompt.includes('точки'))) out.push(`${n}. Всяка група се свързва с картата със същия брой.`);
    if (task.kind === 'differences') out.push(`${n}. ${describeDifferences(task).join('; ')}.`);
  });
  return out;
}

export function buildDemoWorksheet(age: AgeGroup, direction: LessonDirection, topic: string): Worksheet {
  return finishWorksheet(age, direction, topic, tasksFor(direction, age, topic).slice(0, TASKS_PER_SHEET[age]));
}

/** Задача от избран вид — с картинките на темата и двойките/шарките на направлението. */
export function kindTask(kind: SheetKind, age: AgeGroup, direction: LessonDirection, topic: string): WorksheetTask | null {
  const theme = themeFor(topic);
  const pics = theme.pics;
  const f = theme.focus;
  const older = age === '3' || age === '4';
  const t = topic.trim() || 'темата';
  switch (kind) {
    case 'count':
      return countTask(pics, age, f);
    case 'match': {
      const pairs = direction in MATCH_PAIRS ? MATCH_PAIRS[direction as keyof typeof MATCH_PAIRS] : null;
      return pairs ? topicMatch(theme, pairs, 'Свържи с линия двете картинки, които си подхождат.', older ? 4 : 3, age) : countMatchTask(withFocus(pics, pics.length, f), age);
    }
    case 'odd':
      return oddTask(pics, theme.id, older ? 3 : 2, f);
    case 'sequence': {
      const own = direction in PATTERN_PICS && !f ? [...PATTERN_PICS[direction as keyof typeof PATTERN_PICS]] : pics;
      return sequenceTask(own, age, f);
    }
    case 'trace':
      return traceTask(pics, age, undefined, f);
    case 'sound':
      return age === '4' ? soundTask(pics) : null;
    case 'draw':
      return draw(`Нарисувай и оцвети любимия си момент от „${t}“.`);
    case 'maze':
      return mazeTask(pics, age, f);
    case 'differences':
      return differencesTask(pics, otherThemePics(theme.id), age, f);
    case 'half':
      return halfTask(theme.id, age, undefined, f);
  }
}

/** Защо са тези задачи — за бележката на учителя (Наредба № 5). */
export const DRAWN_GOALS: Partial<Record<WorksheetTask['kind'], string>> = {
  maze: 'Лабиринтът упражнява ориентирането в двумерното пространство („Математика“ — „Пространствени отношения“) и движението на ръката с молив.',
  differences: '„Открий разликите“ развива зрителното внимание и сравняването на обекти по признаци.',
  half: 'Дорисуването на половината упражнява симетрията, ориентирането в квадратна мрежа и графомоториката — подготовка за писане.',
};

/** Цял лист от една рисувана задача (два лабиринта, две двойки картинки, две рисунки) — само вграденият двигател. */
export function buildStyledWorksheet(age: AgeGroup, direction: LessonDirection, topic: string, style: Exclude<WorksheetStyle, 'mixed'>): Worksheet {
  const theme = themeFor(topic);
  const pics = theme.pics;
  let tasks: WorksheetTask[];
  const f = theme.focus;
  if (style === 'maze') {
    // И двата лабиринта тръгват от главния предмет на темата (към различни картинки)
    const other = shuffle(f ? pics.filter((p) => p.e !== f.e) : pics);
    const half = Math.ceil(other.length / 2);
    tasks = f
      ? [mazeTask([f, ...other.slice(0, half)], age, f), mazeTask([f, ...other.slice(half)], age, f)]
      : [mazeTask(other.slice(0, 4), age), mazeTask(other.slice(4).length >= 2 ? other.slice(4) : other, age)];
  } else if (style === 'differences') {
    tasks = [differencesTask(pics, otherThemePics(theme.id), age, f), differencesTask(shuffle(pics), otherThemePics(theme.id), age, f)];
  } else {
    // Първата рисунка е главният предмет, ако има такава (ябълка, гъба, лале …)
    const first = halfTask(theme.id, age, undefined, f);
    tasks = [first, halfTask(theme.id, age, first.kind === 'half' ? first.shape : undefined)];
  }
  const t = topic.trim();
  const label = { maze: 'Лабиринти', differences: 'Открий разликите', half: 'Дорисувай половината' }[style];
  const ws = finishWorksheet(age, direction, topic, tasks);
  return { ...ws, title: t ? `${label}: ${t}` : label };
}

/** Работен лист от видовете задачи, които учителят е избрал (в същия ред). */
export function buildWorksheetFromKinds(age: AgeGroup, direction: LessonDirection, topic: string, kinds: SheetKind[]): Worksheet {
  const tasks = kinds.map((k) => kindTask(k, age, direction, topic)).filter((x): x is WorksheetTask => x !== null);
  return tasks.length ? finishWorksheet(age, direction, topic, tasks.slice(0, 4)) : buildDemoWorksheet(age, direction, topic);
}

function finishWorksheet(age: AgeGroup, direction: LessonDirection, topic: string, tasks: WorksheetTask[]): Worksheet {
  const dirLabel = direction === 'bdp' ? 'Безопасност на движението по пътищата' : DIRECTION_STANDARDS[direction].label;
  const answers = answersNote(tasks);
  const goals = [...new Set(tasks.map((x) => DRAWN_GOALS[x.kind]).filter(Boolean))];
  return {
    type: 'worksheet',
    title: topic.trim() ? `Работен лист: ${topic.trim()}` : `Работен лист по ${dirLabel}`,
    ageGroup: age,
    direction,
    topic: topic.trim(),
    tasks,
    teacherNote: [
      `Направление: ${dirLabel}. Задачите следват очакваните резултати за групата по Наредба № 5; учителят прочита условието на глас.`,
      ...goals,
      ...(answers.length ? ['Отговори: ' + answers.join(' ')] : []),
    ].join(' '),
  };
}
