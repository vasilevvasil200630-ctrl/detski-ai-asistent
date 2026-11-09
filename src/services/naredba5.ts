import type { AgeGroup, EducationalDirection } from '../types';

/**
 * Държавният образователен стандарт за предучилищното образование в един файл.
 *
 * Източник: Наредба № 5 от 3 юни 2016 г. за предучилищното образование, последно изм. и доп.
 * ДВ бр. 46 от 31 май 2024 г. — чл. 21–25, чл. 28, чл. 32 и приложения № 1–7.
 *
 * Учебни материали: програмната система „Златно ключе“ на издателство „Бит и техника“
 * (предучилищната ѝ линия за I–IV група, не училищната). Тук са само имената на книжките
 * и общата им структура, за да може AI и демо двигателят да се позовават на тях.
 */

export const NAREDBA5 = {
  title: 'Наредба № 5 от 3 юни 2016 г. за предучилищното образование',
  short: 'Наредба № 5 (ДОС за предучилищното образование)',
  lastAmended: 'посл. изм. ДВ бр. 46 от 31.05.2024 г.',
} as const;

export type AgeGroupStandard = {
  /** Наименование по наредбата. */
  name: string;
  ageRange: string;
  /** Чл. 25 — продължителност на една педагогическа ситуация. */
  situationMinutes: { min: number; max: number };
  /** Чл. 24, ал. 1 — минимален общ седмичен брой педагогически ситуации. */
  minWeeklyTotal: number;
};

export const AGE_GROUP_STANDARDS: Record<AgeGroup, AgeGroupStandard> = {
  '1': { name: 'първа възрастова група', ageRange: '3–4 г.', situationMinutes: { min: 15, max: 20 }, minWeeklyTotal: 11 },
  '2': { name: 'втора възрастова група', ageRange: '4–5 г.', situationMinutes: { min: 15, max: 20 }, minWeeklyTotal: 13 },
  '3': { name: 'трета възрастова група (подготвителна)', ageRange: '5–6 г.', situationMinutes: { min: 20, max: 30 }, minWeeklyTotal: 15 },
  '4': { name: 'четвърта възрастова група (подготвителна)', ageRange: '6–7 г.', situationMinutes: { min: 20, max: 30 }, minWeeklyTotal: 17 },
};

/** Чл. 24, ал. 2 — с колко ситуации максимумът може да надвишава минимума. */
export const WEEKLY_MAX_OVER_MIN = { fullDay: 5, halfDay: 2, innovativeExtra: 2 } as const;

export type DirectionStandard = {
  label: string;
  shortLabel: string;
  emoji: string;
  /** Приложение към чл. 28, ал. 2. */
  appendix: number;
  /** Образователните ядра точно както са назовани в приложението. */
  cores: string[];
  /** Ядро по подразбиране (демо двигател, когато учителят не е избрал). */
  defaultCore: string;
  /** Минимален брой педагогически ситуации седмично по групи (от приложението). */
  minWeekly: Record<AgeGroup, number>;
  /** Познавателната книжка от „Златно ключе“ за това направление (null — няма отделна книжка). */
  zlatnoBook: string | null;
};

export const DIRECTION_STANDARDS: Record<EducationalDirection, DirectionStandard> = {
  bel: {
    label: 'Български език и литература',
    shortLabel: 'БЕЛ',
    emoji: '📖',
    appendix: 1,
    cores: [
      'Свързана реч',
      'Речник',
      'Граматически правилна реч',
      'Звукова култура',
      'Възприемане на литературно произведение',
      'Пресъздаване на литературно произведение',
    ],
    defaultCore: 'Свързана реч',
    minWeekly: { '1': 1, '2': 2, '3': 2, '4': 3 },
    zlatnoBook: '„Играя, за да зная“',
  },
  math: {
    label: 'Математика',
    shortLabel: 'Математика',
    emoji: '🔢',
    appendix: 2,
    cores: ['Количествени отношения', 'Измерване', 'Пространствени отношения', 'Времеви отношения', 'Геометрични фигури и форми'],
    defaultCore: 'Количествени отношения',
    minWeekly: { '1': 1, '2': 1, '3': 2, '4': 3 },
    zlatnoBook: '„Математиката е лесна, даже интересна“',
  },
  world: {
    label: 'Околен свят',
    shortLabel: 'Околен свят',
    emoji: '🌍',
    appendix: 3,
    cores: [
      'Самоутвърждаване и общуване с околните',
      'Социална и здравословна среда',
      'Светът на природата и неговото опазване',
      'Културни и национални ценности',
    ],
    defaultCore: 'Светът на природата и неговото опазване',
    minWeekly: { '1': 1, '2': 2, '3': 2, '4': 2 },
    zlatnoBook: '„Откриватели“',
  },
  art: {
    label: 'Изобразително изкуство',
    shortLabel: 'Изобразително изкуство',
    emoji: '🎨',
    appendix: 4,
    cores: ['Художествено възприемане', 'Изобразителни материали и техники', 'Изобразително творчество'],
    defaultCore: 'Изобразително творчество',
    minWeekly: { '1': 2, '2': 2, '3': 2, '4': 2 },
    zlatnoBook: '„Малко криво, но красиво“',
  },
  music: {
    label: 'Музика',
    shortLabel: 'Музика',
    emoji: '🎵',
    appendix: 5,
    cores: ['Възприемане', 'Възпроизвеждане', 'Музика и игра', 'Елементи на музикалната изразност'],
    defaultCore: 'Музика и игра',
    minWeekly: { '1': 2, '2': 2, '3': 2, '4': 2 },
    zlatnoBook: '„Пея, танцувам и играя“',
  },
  construct: {
    label: 'Конструиране и технологии',
    shortLabel: 'Конструиране и технологии',
    emoji: '🧱',
    appendix: 6,
    cores: ['Конструиране и моделиране', 'Обработване на материали, съединяване и свързване', 'Грижи и инициативност', 'Техника'],
    defaultCore: 'Конструиране и моделиране',
    minWeekly: { '1': 1, '2': 1, '3': 2, '4': 2 },
    zlatnoBook: '„Малчугани Майсторани“',
  },
  pe: {
    label: 'Физическа култура',
    shortLabel: 'Физическа култура',
    emoji: '🤸',
    appendix: 7,
    cores: [
      'Естествено-приложна двигателна дейност',
      'Спортно-подготвителна двигателна дейност',
      'Физическа дееспособност',
      'Игрова двигателна дейност',
    ],
    defaultCore: 'Естествено-приложна двигателна дейност',
    minWeekly: { '1': 3, '2': 3, '3': 3, '4': 3 },
    zlatnoBook: null,
  },
};

export const DIRECTION_ORDER: EducationalDirection[] = ['bel', 'math', 'world', 'art', 'music', 'construct', 'pe'];

/** Връща официалното ядро, ако подаденият текст го съдържа (AI понякога добавя пояснения). */
export function matchCore(direction: EducationalDirection, text: string | undefined): string | undefined {
  if (!text) return undefined;
  const t = text.toLowerCase();
  return DIRECTION_STANDARDS[direction].cores.find((c) => t.includes(c.toLowerCase()));
}

/** Ядро за демо режима: избраното, иначе по ключови думи в темата, иначе по подразбиране. */
export function pickCore(direction: EducationalDirection, topic: string, chosen?: string): string {
  const exact = chosen && DIRECTION_STANDARDS[direction].cores.find((c) => c === chosen);
  if (exact) return exact;
  const t = topic.toLowerCase();
  const byKeyword: Partial<Record<EducationalDirection, [RegExp, string][]>> = {
    world: [
      [/традици|празни|българ|родин|баба марта|мартени|коледа|великден|обича/, 'Културни и национални ценности'],
      [/здрав|хран|витамин|безопас|улиц|светофар|пътя|професи|транспорт/, 'Социална и здравословна среда'],
      [/семейств|приятел|аз съм|емоци|чувств|детската градина/, 'Самоутвърждаване и общуване с околните'],
    ],
    bel: [
      [/приказк|стихотвор|разказ/, 'Възприемане на литературно произведение'],
      [/звук|буква|срич|дума/, 'Звукова култура'],
    ],
    math: [
      [/форм|фигур|кръг|квадрат|триъгълни/, 'Геометрични фигури и форми'],
      [/ден|седмиц|сезон|месец|сутрин|вечер|час/, 'Времеви отношения'],
      [/дълж|висок|тежк|измер/, 'Измерване'],
    ],
    pe: [[/топк|спорт|футбол|баскет/, 'Спортно-подготвителна двигателна дейност']],
  };
  for (const [re, core] of byKeyword[direction] ?? []) if (re.test(t)) return core;
  return DIRECTION_STANDARDS[direction].defaultCore;
}

/** Продължителност като текст, напр. „20–30 мин (чл. 25)“. */
export function situationRangeLabel(ageGroup: AgeGroup): string {
  const { min, max } = AGE_GROUP_STANDARDS[ageGroup].situationMinutes;
  return `${min}–${max} мин`;
}

/**
 * Програмната система „Златно ключе“ на „Бит и техника“ — предучилищната линия.
 * Само факти от каталога на издателството; съдържанието на книжките не е копирано.
 */
export const ZLATNO_KLYUCHE = {
  system: 'Програмна система „Златно ключе“',
  publisher: 'Издателство „Бит и техника“',
  /** Кукла-водач в книжките. */
  guide: 'Щурчо',
  weeks: 36,
  /** Структурата на педагогическата ситуация в книгата за учителя. */
  situationParts: ['Уводна част', 'Основна част', 'Заключителна част'] as const,
  organizationForms: ['фронтална', 'групова', 'индивидуална'] as const,
  /** Допълнителни помагала по групи (по каталога на издателството). */
  extrasByGroup: {
    '1': ['„Загадките на Щурчо“', '„Послушното моливче“', 'Портфолио на детето'],
    '2': ['„Загадките на Щурчо“', '„Послушното моливче“', 'Портфолио на детето'],
    '3': ['„Загадките на Щурчо“', '„Послушното моливче“', '„Буквичките аз познавам, с думички се забавлявам“', 'Христоматия', 'Портфолио на детето'],
    '4': ['„Загадките на Щурчо“', '„Послушното моливче“', '„Буквичките подреди, думички прочети“', 'Христоматия', 'Портфолио на детето'],
  } as Record<AgeGroup, string[]>,
  url: 'https://bititechnika.com/pages/preduchilishtno-obrazovanie.html',
} as const;

/** Името на книжката за групата, напр. „Откриватели“ за 3. група. */
export function zlatnoBookFor(direction: EducationalDirection, ageGroup: AgeGroup): string | null {
  const book = DIRECTION_STANDARDS[direction].zlatnoBook;
  return book ? `познавателна книжка ${book} за ${ageGroup}. група („Златно ключе“)` : null;
}

/** Кратък текст за промптовете: правилата от наредбата, които AI трябва да спазва. */
export function naredba5PromptRules(ageGroup: AgeGroup): string {
  const g = AGE_GROUP_STANDARDS[ageGroup];
  return [
    `Нормативна рамка: ${NAREDBA5.title} (${NAREDBA5.lastAmended}).`,
    `Група: ${g.name} (${g.ageRange}); една педагогическа ситуация трае ${situationRangeLabel(ageGroup)} (чл. 25).`,
    'Педагогическата ситуация е основната форма и протича предимно като игра (чл. 23); игрите извън нея са допълнителни форми (чл. 26).',
    'Без домашна работа и без работа с познавателните книжки вкъщи (чл. 32) — игрите за вкъщи са само по желание на семейството.',
    'Седемте образователни направления и техните ядра (използвай ТОЧНО тези имена):',
    ...DIRECTION_ORDER.map((d) => `- ${DIRECTION_STANDARDS[d].label}: ${DIRECTION_STANDARDS[d].cores.join('; ')}`),
    `Учебна система: ${ZLATNO_KLYUCHE.system} на ${ZLATNO_KLYUCHE.publisher} (предучилищната линия). Познавателни книжки: ${DIRECTION_ORDER.filter((d) => DIRECTION_STANDARDS[d].zlatnoBook).map((d) => `${DIRECTION_STANDARDS[d].shortLabel} — ${DIRECTION_STANDARDS[d].zlatnoBook}`).join('; ')}; „Физическа култура“ е в книгата за учителя. Кукла-водач: ${ZLATNO_KLYUCHE.guide}.`,
    'Не измисляй номера на страници или конкретни задачи от книжките — само се позовавай на съответната книжка.',
    'Имената на образователните направления пиши винаги с главна буква, и в изречение: „по Математика“, „в Околен свят“, „по Изобразително изкуство“, „по Физическа култура“. Съкращенията БЕЛ и БДП — само с главни букви.',
    'Безопасност на движението по пътищата (БДП) е задължителна във всички групи, но НЕ е отделно направление: интегрира се в „Околен свят“ (ядро „Социална и здравословна среда“) и „Конструиране и технологии“ (ядро „Техника“) или в допълнителни форми, по програмите на МОН за БДП (2018).',
  ].join('\n');
}
