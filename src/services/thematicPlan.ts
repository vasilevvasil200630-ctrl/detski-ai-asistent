import type { AgeGroup, EducationalDirection } from '../types';
import { DIRECTION_ORDER, DIRECTION_STANDARDS } from './naredba5';
import { isExpectedResult } from './naredba5Results';
import { HOLIDAYS, type Holiday } from './holidays';

/**
 * Тематично разпределение по Наредба № 5:
 *  - учебното време е от 15 септември до 31 май, в учебни седмици от пет дни (чл. 11–12);
 *  - седмичният брой ситуации по направления е минимумът от приложенията (чл. 24, чл. 28);
 *  - разпределението включва темите и очакваните резултати (чл. 30).
 */

export interface PlanSituation {
  direction: EducationalDirection;
  core: string;
  /** Темата на педагогическата ситуация */
  topic: string;
  /** Очакваните резултати по наредбата за групата (дословно) */
  results: string[];
}

export interface PlanWeekView {
  week: number;
  /** „ГГГГ-ММ-ДД“ */
  startDate: string;
  endDate: string;
  theme: string;
  notes: string;
  situations: PlanSituation[];
  /** Празниците през седмицата (изчислени) */
  holidays: { id: string; name: string; emoji: string }[];
}

export interface PlanView {
  id: string;
  ageGroup: AgeGroup;
  groupName: string;
  schoolYear: number;
  shared: boolean;
  mine: boolean;
  authorName: string;
  approvedAt: string | null;
  approvedByName: string | null;
  weeks: PlanWeekView[];
}

export interface PlanSummary {
  id: string;
  ageGroup: AgeGroup;
  groupName: string;
  schoolYear: number;
  shared: boolean;
  mine: boolean;
  authorName: string;
  approvedAt: string | null;
  weeksWithTheme: number;
  weeksTotal: number;
}

const ymd = (d: Date) => d.toISOString().slice(0, 10);
const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d));
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);

/** Първият учебен ден: 15 септември или първият следващ работен ден (чл. 11, ал. 2). */
export function firstSchoolDay(year: number): Date {
  let d = utc(year, 9, 15);
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6) d = addDays(d, 1);
  return d;
}

/** Учебните седмици от първия учебен ден до 31 май (понеделник–петък). */
export function schoolWeeks(year: number): { week: number; startDate: string; endDate: string }[] {
  const last = utc(year + 1, 5, 31);
  const out: { week: number; startDate: string; endDate: string }[] = [];
  let start = firstSchoolDay(year);
  while (start <= last) {
    const friday = addDays(start, 5 - start.getUTCDay());
    const end = friday > last ? last : friday;
    out.push({ week: out.length + 1, startDate: ymd(start), endDate: ymd(end) });
    start = addDays(friday, 3);
  }
  return out;
}

/** Великден по православния календар (Юлианският алгоритъм на Мийс + 13 дни). */
export function orthodoxEaster(year: number): Date {
  const a = year % 4;
  const b = year % 7;
  const c = year % 19;
  const d = (19 * c + 15) % 30;
  const e = (2 * a + 4 * b - d + 34) % 7;
  const month = Math.floor((d + e + 114) / 31);
  const day = ((d + e + 114) % 31) + 1;
  return addDays(utc(year, month, day), 13);
}

/** Датата на празника в учебната година (подвижните — изчислени). */
function holidayDate(h: Holiday, schoolYear: number): Date | null {
  const y = h.month >= 9 ? schoolYear : schoolYear + 1;
  const fixed: Record<string, [number, number]> = {
    'first-day': [9, 15],
    buditeli: [11, 1],
    semeystvo: [11, 21],
    koleda: [12, 22],
    'nova-godina': [1, 2],
    babinden: [1, 21],
    'baba-marta': [3, 1],
    'treti-mart': [3, 3],
    mama: [3, 8],
    'parva-prolet': [3, 22],
    'den-na-zemyata': [4, 22],
    gergyovden: [5, 6],
    '24-mai': [5, 24],
  };
  // Лазаровден, Цветница и Великден — седмицата преди Великден
  if (h.id === 'velikden') return addDays(orthodoxEaster(y), -3);
  const f = fixed[h.id];
  return f ? utc(y, f[0], f[1]) : null;
}

/** Празниците през учебните седмици: празник в събота или неделя отива в седмицата преди него. */
export function holidaysByWeek(schoolYear: number): Map<number, { id: string; name: string; emoji: string }[]> {
  const weeks = schoolWeeks(schoolYear);
  const map = new Map<number, { id: string; name: string; emoji: string }[]>();
  for (const h of HOLIDAYS) {
    const date = holidayDate(h, schoolYear);
    if (!date) continue;
    const key = ymd(date);
    let target = weeks.find((w) => w.startDate <= key && key <= w.endDate);
    if (!target) target = [...weeks].reverse().find((w) => w.endDate < key && ymd(addDays(new Date(`${w.endDate}T00:00:00Z`), 3)) >= key);
    if (!target) continue;
    map.set(target.week, [...(map.get(target.week) ?? []), { id: h.id, name: h.name, emoji: h.emoji }]);
  }
  return map;
}

/** Колко ситуации седмично по всяко направление за групата (минимумът от приложенията). */
export function weeklySlots(ageGroup: AgeGroup): { direction: EducationalDirection; count: number }[] {
  return DIRECTION_ORDER.map((d) => ({ direction: d, count: DIRECTION_STANDARDS[d].minWeekly[ageGroup] }));
}

export const MAX_SITUATIONS = 40;

/** Почиства ситуациите: само истински направления и ядра и само очаквани резултати от наредбата. */
export function cleanSituations(ageGroup: AgeGroup, raw: unknown): PlanSituation[] {
  if (!Array.isArray(raw)) return [];
  const out: PlanSituation[] = [];
  for (const item of raw.slice(0, MAX_SITUATIONS)) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const direction = DIRECTION_ORDER.find((d) => d === o.direction);
    if (!direction) continue;
    const core = DIRECTION_STANDARDS[direction].cores.find((c) => c === o.core) ?? '';
    const topic = typeof o.topic === 'string' ? o.topic.trim().slice(0, 160) : '';
    const results = Array.isArray(o.results)
      ? [...new Set(o.results.filter((r): r is string => typeof r === 'string'))].filter((r) => core && isExpectedResult(direction, core, ageGroup, r)).slice(0, 4)
      : [];
    if (!core && !topic) continue;
    out.push({ direction, core, topic, results });
  }
  return out;
}

/** Теми по месеци за вградения двигател (без връзка към модела) — по сезоните в учебната година. */
const MONTH_THEMES: Record<number, string[]> = {
  9: ['Здравей, детска градина!', 'Аз и моята група', 'Моето семейство'],
  10: ['Есен в гората', 'Плодове и зеленчуци', 'Есенни листа и цветове', 'Домашни животни', 'Хляб и хлебарство'],
  11: ['Будителите и книгите', 'Диви животни през есента', 'Моето тяло и здраве', 'Професиите около мен'],
  12: ['Зимата идва', 'Коледни обичаи', 'Подаръци и доброта'],
  1: ['Сурвакане и Нова година', 'Зимни игри и спортове', 'Бабинден — баба и дядо', 'Птиците през зимата'],
  2: ['Зимни животни', 'Транспорт и пътя', 'Безопасно на улицата', 'Предмети около нас'],
  3: ['Баба Марта и мартеници', 'Моята родина България', 'Мама и пролетта', 'Първа пролет'],
  4: ['Пролетни цветя', 'Великденски обичаи', 'Земята — нашият дом', 'Насекоми и пеперуди'],
  5: ['Гергьовден и пролетни обичаи', 'Космосът и звездите', 'Буквите и книгите', 'Довиждане, учебна година!'],
};

const EXTRA_THEMES = ['Светът около нас', 'Приказки и герои', 'Игри и приятелство', 'Цветове и форми', 'Водата и въздухът', 'Моят град, моето село'];

/**
 * Тема за седмицата без модела: празникът, ако има, иначе следващата неизползвана тема от месеца
 * (после от общите). `used` пази вече дадените теми, за да не се повтарят.
 */
export function demoTheme(week: { week: number; startDate: string }, holidays: { name: string }[], used: Set<string> = new Set()): string {
  const pick = (t: string) => (used.add(t), t);
  if (holidays.length) return pick(holidays[0]!.name);
  const month = Number(week.startDate.slice(5, 7));
  const free = [...(MONTH_THEMES[month] ?? []), ...EXTRA_THEMES].find((t) => !used.has(t));
  return pick(free ?? `Седмица ${week.week}: светът около нас`);
}

export const schoolYearLabel = (y: number) => `${y}/${y + 1}`;
