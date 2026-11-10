import { AgeGroup, EducationalDirection, GameMode, GameTask, GeneratedGame, GeneratedLessonPlan, LessonDirection, LessonStage } from '../types';
import { DIRECTION_STANDARDS, matchCore } from './naredba5';
import { expectedResults } from './naredba5Results';
import { sanitizeKit } from './printables/kit';

/**
 * Защитни функции за отговорите от реалния AI (Gemini / OpenAI).
 * Моделът понякога връща markdown ограждения, обект вместо масив или пропуска полета.
 * Тук всичко се нормализира, така че UI-ят никога да не получи невалидни данни.
 */

const BADGE_COLORS: GeneratedGame['badgeColor'][] = ['mint', 'lavender', 'coral'];

function str(v: unknown): string {
  if (typeof v === 'string') return v.trim();
  if (typeof v === 'number') return String(v);
  return '';
}

function strList(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(str).filter(Boolean);
  if (typeof v === 'string') return v.split('\n').map((s) => s.trim()).filter(Boolean);
  return [];
}

function obj(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

/** Изважда JSON от суров текст на модела (със или без ```json ограждения). */
export function extractJson(raw: string): unknown {
  const cleaned = raw.replace(/```(?:json)?/gi, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // продължаваме с търсене на първия JSON фрагмент
  }
  const arr = cleaned.match(/\[[\s\S]*\]/);
  const ob = cleaned.match(/\{[\s\S]*\}/);
  // предпочитаме по-ранния фрагмент (масив или обект)
  const candidates = [arr, ob].filter(Boolean) as RegExpMatchArray[];
  candidates.sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  for (const c of candidates) {
    try {
      return JSON.parse(c[0]);
    } catch {
      // опитай следващия
    }
  }
  return null;
}

const GAME_MODES_SET: GameMode[] = ['quick', 'theme', 'dos'];
const TASK_DIRECTIONS: LessonDirection[] = ['bel', 'world', 'math', 'art', 'music', 'construct', 'pe', 'bdp'];

/** Задачите към записана игра — само формата (дословната проверка по наредбата е при генерирането). */
function normalizeTasks(v: unknown): GameTask[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const tasks = v
    .map((raw) => {
      const t = obj(raw);
      const direction = TASK_DIRECTIONS.find((d) => d === t.direction);
      const core = str(t.core).slice(0, 120);
      const result = str(t.result).slice(0, 400);
      return direction && core && result ? { direction, core, result } : null;
    })
    .filter((t): t is GameTask => t !== null)
    .slice(0, 3);
  return tasks.length ? tasks : undefined;
}

/** Премахва номерацията „1. “, „2) “ и т.н., която моделът понякога добавя към полетата. */
function stripLeadingNumber(s: string): string {
  return s.replace(/^\s*\d+[.)]\s*/, '');
}

function normalizeGame(raw: unknown, index: number): GeneratedGame | null {
  const g = obj(raw);
  const title = stripLeadingNumber(str(g.title));
  const steps = strList(g.steps).map(stripLeadingNumber);
  if (!title || steps.length === 0) return null;

  const rhymeLines = strList(g.rhymeLines ?? g.rhyme);
  const tags = strList(g.tags).slice(0, 5);

  return {
    id: `ai-g-${Date.now()}-${index}`,
    title,
    subtitle: str(g.subtitle),
    tags: tags.length ? tags : ['Игра'],
    badgeColor: BADGE_COLORS[index % BADGE_COLORS.length],
    rhymeTitle: str(g.rhymeTitle) || '📜 Римуван стих за старт:',
    rhymeLines: rhymeLines.length ? rhymeLines : ['Едно, две, три – играта започни!'],
    steps,
    ...(GAME_MODES_SET.includes(g.mode as GameMode) ? { mode: g.mode as GameMode } : {}),
    ...(normalizeTasks(g.tasks) ? { tasks: normalizeTasks(g.tasks) } : {}),
    ...(sanitizeKit(g.kit) ? { kit: sanitizeKit(g.kit) } : {}),
    pedagogicalGoal: stripLeadingNumber(str(g.pedagogicalGoal)) || 'Околен свят (ядро „Самоутвърждаване и общуване с околните“); Физическа култура (ядро „Игрова двигателна дейност“): социални умения, внимание и двигателна активност.',
    sopAdaptation: stripLeadingNumber(str(g.sopAdaptation)) || undefined,
    teacherTip: str(g.teacherTip) || 'Покажете правилата първо със собствен пример.',
  };
}

/**
 * Връща до 3 валидни игри от отговора на модела.
 * Ако моделът е върнал по-малко валидни игри, липсващите се допълват от `fallback`.
 */
export function normalizeGames(parsed: unknown, fallback: GeneratedGame[]): GeneratedGame[] {
  let list: unknown[] = [];
  if (Array.isArray(parsed)) list = parsed;
  else {
    const o = obj(parsed);
    const firstArray = Object.values(o).find(Array.isArray);
    if (firstArray) list = firstArray as unknown[];
  }
  const valid = list.map(normalizeGame).filter((g): g is GeneratedGame => g !== null).slice(0, 3);
  if (valid.length === 0) throw new Error('AI отговорът не съдържа валидни игри');
  return [...valid, ...fallback.slice(valid.length, 3)];
}

function normalizeStage(raw: unknown): LessonStage | null {
  const s = obj(raw);
  const phase = str(s.phase);
  const teacherAction = str(s.teacherAction);
  const childrenActivity = str(s.childrenActivity);
  if (!phase || (!teacherAction && !childrenActivity)) return null;
  // Моделът понякога връща само число — допълваме мерната единица
  const durationRaw = str(s.duration);
  const duration = /^\d+([–-]\d+)?$/.test(durationRaw) ? `${durationRaw} мин.` : durationRaw;
  return { phase, duration, teacherAction, childrenActivity };
}

/**
 * Слива отговора на модела с демо разработката поле по поле – липсващото се взима от `fallback`.
 * Направлението, продължителността и ядрото остават официалните по Наредба № 5: ядрото от AI
 * се приема само ако е едно от изброените в приложението (или учителят го е избрал сам).
 */
export function normalizeLessonPlan(
  parsed: unknown,
  fallback: GeneratedLessonPlan,
  opts: { direction?: EducationalDirection; coreChosen?: boolean; ageGroup?: AgeGroup } = {},
): GeneratedLessonPlan {
  const p = obj(parsed);
  if (Object.keys(p).length === 0) throw new Error('AI отговорът не е валиден JSON обект');

  const pick = (v: unknown, fb: string) => str(v) || fb;
  const pickList = (v: unknown, fb: string[]) => {
    const l = strList(v);
    return l.length ? l : fb;
  };

  const er = obj(p.expectedResults);
  const story = obj(p.story);
  const note = obj(p.parentNote);
  const stages = Array.isArray(p.stages)
    ? p.stages.map(normalizeStage).filter((s): s is LessonStage => s !== null)
    : [];
  const core =
    opts.coreChosen || !opts.direction
      ? fallback.educationalCore
      : (matchCore(opts.direction, str(p.educationalCore)) ?? fallback.educationalCore);
  const results = lessonResults(p.naredbaResults, core, fallback, opts);

  return {
    topic: pick(p.topic, fallback.topic),
    ageGroupLabel: pick(p.ageGroupLabel, fallback.ageGroupLabel),
    directionLabel: fallback.directionLabel,
    educationalCore: core,
    totalDuration: fallback.totalDuration,
    ...(fallback.situationType ? { situationType: fallback.situationType } : {}),
    aim: pick(p.aim, fallback.aim ?? ''),
    goals: pickList(p.goals, fallback.goals).slice(0, 5),
    naredbaResults: results.list,
    resultsSource: results.source,
    methods: pickList(p.methods, fallback.methods ?? []).slice(0, 8),
    assessment: pick(p.assessment, fallback.assessment ?? ''),
    differentiation: pick(p.differentiation, fallback.differentiation ?? ''),
    expectedResults: {
      knowledge: results.list[0] ?? pick(er.knowledge, fallback.expectedResults.knowledge),
      skills: results.list[1] ?? pick(er.skills, fallback.expectedResults.skills),
      attitudes: pick(er.attitudes, fallback.expectedResults.attitudes),
    },
    materials: withProgramMaterial(pickList(p.materials, fallback.materials), fallback.programMaterial),
    organizationForm: pick(p.organizationForm, fallback.organizationForm ?? ''),
    integrativeLinks: pickList(p.integrativeLinks, fallback.integrativeLinks ?? []),
    ...(fallback.programMaterial ? { programMaterial: fallback.programMaterial } : {}),
    stages: stages.length ? stages : fallback.stages,
    story: {
      title: pick(story.title, fallback.story.title),
      hero: pick(story.hero, fallback.story.hero),
      paragraphs: pickList(story.paragraphs, fallback.story.paragraphs),
      moral: pick(story.moral, fallback.story.moral),
      discussionQuestions: pickList(story.discussionQuestions, fallback.story.discussionQuestions),
    },
    parentNote: {
      viberHeader: pick(note.viberHeader, fallback.parentNote.viberHeader),
      summaryMessage: pick(note.summaryMessage, fallback.parentNote.summaryMessage),
      highlights: pickList(note.highlights, fallback.parentNote.highlights),
      homeGameTitle: pick(note.homeGameTitle, fallback.parentNote.homeGameTitle),
      homeGameDescription: pick(note.homeGameDescription, fallback.parentNote.homeGameDescription),
      closingWarmth: pick(note.closingWarmth, fallback.parentNote.closingWarmth),
    },
  };
}

const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');

/**
 * Очакваните резултати в плана: само официалните от Наредбата за ядрото и групата. Текст от модела се
 * приема, ако съвпада с официален (без значение за препинателните знаци) — и тогава се пише официалният.
 * Иначе — подборът от вградения план или първите резултати на ядрото, което е избрал моделът.
 */
function lessonResults(
  raw: unknown,
  core: string,
  fallback: GeneratedLessonPlan,
  opts: { direction?: EducationalDirection; ageGroup?: AgeGroup },
): { list: string[]; source: string | undefined } {
  const fb = { list: fallback.naredbaResults ?? [], source: fallback.resultsSource };
  if (!opts.direction || !opts.ageGroup) return fb;
  const official = expectedResults(opts.direction, core, opts.ageGroup);
  if (!official.length) return fb;
  const source = `Наредба № 5, приложение № ${DIRECTION_STANDARDS[opts.direction].appendix}, ядро „${core}“`;
  const byNorm = new Map(official.map((r) => [norm(r), r]));
  const fromModel = [...new Set(strList(raw).map((r) => byNorm.get(norm(r))).filter((r): r is string => !!r))].slice(0, 3);
  if (fromModel.length) return { list: fromModel, source };
  if (core === fallback.educationalCore && fb.list.length) return fb;
  return { list: official.slice(0, 3), source };
}

/** Книжката от „Златно ключе“ винаги е сред материалите, ако направлението има такава. */
function withProgramMaterial(materials: string[], book: string | undefined): string[] {
  if (!book || materials.some((m) => m.includes('Златно ключе'))) return materials;
  return [book[0]!.toUpperCase() + book.slice(1), ...materials];
}
