import { AgeGroup, EducationalDirection, LessonDirection, GameFilterState, GeneratedGame, GeneratedLessonPlan, GroupMood, PlayDuration, PlayLocation, PlayResources, SituationType } from '../types';
import { buildDemoGames, DemoContext } from './demoGames';
import { bdpGameFor, gameForCore } from './directionGames';
import { expectedResults } from './naredba5Results';
import { assessmentText, differentiationText, lessonTasks, MAIN_PART_LEAD, METHODS, pickResults, SITUATION_TYPES } from './lessonParts';
import {
  AGE_GROUP_STANDARDS,
  DIRECTION_ORDER,
  DIRECTION_STANDARDS,
  naredba5PromptRules,
  pickCore,
  situationRangeLabel,
  ZLATNO_KLYUCHE,
  zlatnoBookFor,
} from './naredba5';
import { BDP, BDP_NAREDBA5_RESULTS, BDP_THEMES, bdpPromptRules, findBdpTheme } from './bdp';
import { GAME_MODES, taskLine, tasksPromptBlock } from './gameTasks';

export const AGE_GROUP_LABELS: Record<AgeGroup, { short: string; full: string; ageRange: string; dosDuration: string }> = {
  '1': { short: 'I група (3–4 г.)', full: 'Първа възрастова група (3–4 години)', ageRange: '3-4 г.', dosDuration: '15 мин' },
  '2': { short: 'II група (4–5 г.)', full: 'Втора възрастова група (4–5 години)', ageRange: '4-5 г.', dosDuration: '20 мин' },
  '3': { short: 'III група (5–6 г.)', full: 'Трета подготвителна група (5–6 години)', ageRange: '5-6 г.', dosDuration: '25 мин' },
  '4': { short: 'IV група (6–7 г.)', full: 'Четвърта подготвителна група (6–7 години)', ageRange: '6-7 г.', dosDuration: '30 мин' },
};

export const MOOD_LABELS: Record<GroupMood, { label: string; emoji: string; tag: string; goalFocus: string }> = {
  noisy: { label: 'Шумни и превъзбудени', emoji: '🔊', tag: 'Успокояваща', goalFocus: 'овладяване на импулсивността и плавен преход към тиха концентрация' },
  tired: { label: 'Уморени / Тихо време', emoji: '🥱', tag: 'Тонизираща', goalFocus: 'нежно енергизиране, раздвижване чрез игрово дишане и усмивки' },
  distracted: { label: 'Разсеяни', emoji: '🦋', tag: 'Фокусираща', goalFocus: 'привличане на слуховото и зрителното внимание и бърза реакция по сигнал' },
};

export const LOCATION_LABELS: Record<PlayLocation, { label: string; emoji: string; spatialHint: string }> = {
  classroom: { label: 'Занималня', emoji: '🧸', spatialHint: 'на килима в центъра на занималнята в безопасен кръг' },
  music_hall: { label: 'Музикален салон', emoji: '🎵', spatialHint: 'в просторния музикален салон с широко движение в кръг' },
  yard: { label: 'Двор', emoji: '🌳', spatialHint: 'на открито в двора на детската градина' },
};

export const DURATION_LABELS: Record<PlayDuration, { label: string; emoji: string; pacingHint: string }> = {
  '5': { label: '5 мин', emoji: '⏱️', pacingHint: 'Експресен вариант (2–3 рунда) за бърз преход между режимните моменти' },
  '15': { label: '15 мин', emoji: '⏱️', pacingHint: 'Пълноценна игрова ситуация с 2 нива на трудност и смяна на водещите деца' },
  '30': { label: '30 мин', emoji: '⏱️', pacingHint: 'Разгърнат игрови практикум на 3 етапа с творчески финал и рефлексия' },
};

export const RESOURCE_LABELS: Record<PlayResources, { label: string; emoji: string; toolName: string }> = {
  none: { label: 'Без материали', emoji: '🙌', toolName: 'само глас, мимика, жестове и въображение' },
  balls: { label: 'С топка', emoji: '⚽', toolName: 'цветна лека топка („вълшебна топка на приятелството“)' },
  music: { label: 'С музика', emoji: '🎶', toolName: 'весела детска мелодия или детски музикални инструменти (маракаси, звънче)' },
  paper_pencils: { label: 'Хартия и моливи', emoji: '📄', toolName: 'бели листове и цветни моливи/пастели' },
  hoops_ribbons: { label: 'Обръчи и ленти', emoji: '🧣', toolName: 'цветни гимнастически обръчи и шарени ленти' },
};

/** Седемте направления по чл. 28, ал. 2 от Наредба № 5 (данните са в naredba5.ts). */
export const DIRECTION_LABELS: Record<EducationalDirection, { label: string; shortLabel: string; emoji: string; cores: string[] }> =
  Object.fromEntries(
    DIRECTION_ORDER.map((d) => {
      const { label, shortLabel, emoji, cores } = DIRECTION_STANDARDS[d];
      return [d, { label, shortLabel, emoji, cores }];
    }),
  ) as Record<EducationalDirection, { label: string; shortLabel: string; emoji: string; cores: string[] }>;


export function buildStructuredGameUserPrompt(filters: GameFilterState): string {
  const ageInfo = AGE_GROUP_LABELS[filters.ageGroup];
  const moodInfo = MOOD_LABELS[filters.mood];
  const locInfo = LOCATION_LABELS[filters.location];
  const durInfo = DURATION_LABELS[filters.duration];
  const resInfo = RESOURCE_LABELS[filters.resources];
  const kw = filters.customTheme?.trim();
  const mode = filters.mode ?? 'theme';
  const tasks = mode === 'quick' ? [] : filters.tasks ?? [];

  return [
    'Моля, създай ситуационна игра за детската градина със следните параметри:',
    `- Вид: ${GAME_MODES[mode].label}`,
    `- Възрастова група: ${ageInfo.short}`,
    `- Настроение на децата: ${moodInfo.label}`,
    `- Място: ${locInfo.label}`,
    `- Времетраене: ${durInfo.label}ути`,
    `- Налични материали: ${resInfo.label}`,
    ...(mode !== 'quick' && filters.direction && filters.direction !== 'mixed' ? [`- Образователно направление: ${directionName(filters.direction)}`] : []),
    ...(kw ? [`- Тема, която групата е взела: ${kw}`] : []),
    ...(tasks.length ? ['- Образователни задачи (очаквани резултати по Наредба № 5):', ...tasks.map((t) => `  • ${taskLine(t)}`)] : []),
    'Форматирай отговора с:',
    '1. Заглавие на играта',
    '2. Римуван стих за старт',
    '3. Точни стъпки за играта (1, 2, 3)',
    mode === 'quick' ? '4. Полза от играта' : '4. Развивани умения по Наредба № 5 (образователно направление и ядро)',
    '5. Идея за адаптация за дете със СОП',
  ].join('\n');
}

/**
 * Прикачва режима и избраните задачи към готовите игри (и от модела, и от демо двигателя).
 * В бързия режим ползата идва от настроението, не от направленията.
 */
export function finalizeGames(games: GeneratedGame[], filters: GameFilterState, fromDemo = false): GeneratedGame[] {
  const mode = filters.mode ?? 'theme';
  const tasks = mode === 'quick' ? [] : filters.tasks ?? [];
  return games.map((g) => ({
    ...g,
    // Резервна (вградена) игра без шаблон за ядрото на задачата — изрична последна стъпка към задачите
    ...(fromDemo && tasks.length && !tasks.some((t) => g.tags.includes(t.core))
      ? { steps: [...g.steps, `Накрая — към задачата: ${tasks.map((t) => t.result.charAt(0).toLowerCase() + t.result.slice(1)).join('; ')}. Добавете кратък рунд, в който децата правят точно това с материалите от играта.`] }
      : {}),
    mode,
    tasks: tasks.length ? tasks : undefined,
    // Комплектът се прави отделно, по желание на учителя (/api/ai/game-kit)
    kit: undefined,
    ...(mode === 'quick' && fromDemo ? { pedagogicalGoal: `Бърза игра за ${MOOD_LABELS[filters.mood].goalFocus}.` } : {}),
  }));
}

export function buildDemoContext(filters: GameFilterState): DemoContext {
  const ageInfo = AGE_GROUP_LABELS[filters.ageGroup];
  const moodInfo = MOOD_LABELS[filters.mood];
  const locInfo = LOCATION_LABELS[filters.location];
  const durInfo = DURATION_LABELS[filters.duration];
  const resInfo = RESOURCE_LABELS[filters.resources];
  return {
    ageGroup: filters.ageGroup,
    ageShort: ageInfo.short,
    ageRange: ageInfo.ageRange,
    mood: filters.mood,
    moodTag: moodInfo.tag,
    moodGoalFocus: moodInfo.goalFocus,
    locLabel: locInfo.label,
    spatialHint: locInfo.spatialHint,
    isYard: filters.location === 'yard',
    durLabel: durInfo.label,
    pacingHint: durInfo.pacingHint,
    resources: filters.resources,
    resLabel: resInfo.label,
    toolName: resInfo.toolName,
    kw: filters.customTheme?.trim() || undefined,
    direction:
      filters.mode === 'quick'
        ? undefined
        : filters.direction && filters.direction !== 'mixed'
          ? filters.direction
          : filters.tasks?.[0]?.direction,
    preferCores: filters.mode === 'quick' ? undefined : filters.tasks?.map((t) => t.core),
  };
}

/** Пълният промпт за 3 игри — вика се от сървъра (/api/ai/games). */
export function buildGamesAiPrompt(filters: GameFilterState): string {
  const mode = filters.mode ?? 'theme';
  const tasks = mode === 'quick' ? [] : filters.tasks ?? [];
  const goalRule =
    mode === 'quick' || tasks.length > 0
      ? ''
      : 'Полето "pedagogicalGoal" ЗАПОЧВА с направлението и ядрото с точните им имена, напр. „Физическа култура (ядро „Игрова двигателна дейност“); Околен свят (ядро „Самоутвърждаване и общуване с околните“): …“, а след двоеточието — конкретните умения.\n';
  return `Ти си експертен български педагог в детска градина, работиш по Наредба № 5 за предучилищното образование и по програмната система „Златно ключе“ на „Бит и техника“.
${naredba5PromptRules(filters.ageGroup)}

${buildStructuredGameUserPrompt(filters)}

${tasksPromptBlock(mode, tasks)}

${gamesTaskLine(filters)}
Римуваният стих да е 4 реда, наистина римуван и подходящ за възрастта. Стъпките да са 3–4, конкретни и изпълними на посоченото място.
${goalRule}Върни САМО валиден JSON масив от 3 обекта (без markdown, без номерация в стойностите) със следната структура:
[{"title":"Заглавие на играта","subtitle":"Кратко подзаглавие","tags":["Таг1","Таг2"],"rhymeTitle":"📜 Римуван стих за старт:","rhymeLines":["Ред 1","Ред 2","Ред 3","Ред 4"],"steps":["Стъпка 1","Стъпка 2","Стъпка 3"],"pedagogicalGoal":"${mode === 'quick' ? 'Полза от играта' : 'Развивани умения по Наредба № 5'}","sopAdaptation":"Идея за адаптация за дете със СОП","teacherTip":"Практичен съвет към учителя"}]`;
}

function directionName(d: LessonDirection): string {
  return d === 'bdp' ? `${BDP.label} (интегрирано в „Околен свят“, ядро „Социална и здравословна среда“)` : DIRECTION_STANDARDS[d].label;
}

/** Каква тройка игри да създаде моделът: по направление или смесени (според настроението). */
function gamesTaskLine(filters: GameFilterState): string {
  const kw = filters.customTheme?.trim();
  const topicRule = kw ? ` Всички игри затвърждават темата „${kw}“, която групата е взела.` : '';
  if (filters.mode === 'quick') {
    return `Генерирай 3 РАЗЛИЧНИ бързи игри на БЪЛГАРСКИ ЕЗИК: 1) подвижна според настроението, 2) словесна или с гатанка, 3) игра в кръг или по двойки.${topicRule}`;
  }
  const tasks = filters.tasks ?? [];
  if (tasks.length > 0) {
    const bdp = tasks.some((t) => t.direction === 'bdp') ? `${bdpPromptRules(filters.ageGroup)}\n` : '';
    return `${bdp}Генерирай 3 РАЗЛИЧНИ по вид игри на БЪЛГАРСКИ ЕЗИК (дидактична, подвижна, творческа или ролева), които водят към избраните задачи.${topicRule}`;
  }
  if (!filters.direction || filters.direction === 'mixed') {
    return `Генерирай 3 РАЗЛИЧНИ игри на БЪЛГАРСКИ ЕЗИК: 1) подвижно-регулираща според настроението (Физическа култура), 2) дидактична/словесна с гатанка (БЕЛ, Математика или Околен свят), 3) екипна игра с наличните материали.${topicRule}`;
  }
  if (filters.direction === 'bdp') {
    return `${bdpPromptRules(filters.ageGroup)}
Генерирай 3 РАЗЛИЧНИ игри на БЪЛГАРСКИ ЕЗИК по безопасност на движението по пътищата за тази група (светофар, пешеходна пътека, пешеходци и шофьори, опасни места) — дидактична, ролева и подвижна.${topicRule}`;
  }
  const dir = DIRECTION_STANDARDS[filters.direction];
  return `Генерирай 3 РАЗЛИЧНИ игри на БЪЛГАРСКИ ЕЗИК в направление „${dir.label}“ (приложение № ${dir.appendix} към чл. 28) — всяка по различно ядро от: ${dir.cores.map((c) => `„${c}“`).join(', ')}. Игрите водят към очакваните резултати по това приложение за тази група и са различни по вид (дидактична, подвижна, творческа).${topicRule}`;
}

/** core — официалното образователно ядро; без него AI избира най-подходящото за темата. */
export type LessonParams = { ageGroup: AgeGroup; direction: LessonDirection; topic: string; core?: string; situationType?: SituationType };

/** Пълният промпт за ДОС разработка — вика се от сървъра (/api/ai/lesson). */
export function buildLessonAiPrompt(params: LessonParams, demoPlan: GeneratedLessonPlan): string {
  if (params.direction === 'bdp') return buildBdpAiPrompt(params, demoPlan);
  const ageInfo = AGE_GROUP_LABELS[params.ageGroup];
  const dir = DIRECTION_STANDARDS[params.direction];
  const coreLine = params.core
    ? `образователно ядро „${params.core}“`
    : `образователно ядро — избери най-подходящото за темата от: ${dir.cores.map((c) => `„${c}“`).join(', ')}`;
  const book = zlatnoBookFor(params.direction, params.ageGroup);
  const type = SITUATION_TYPES[params.situationType ?? 'new'];
  // Официалните очаквани резултати за групата — моделът ги копира дословно, не ги измисля
  const cores = params.core ? [params.core] : dir.cores;
  const resultsList = cores
    .map((c) => `Ядро „${c}“:\n${expectedResults(params.direction as EducationalDirection, c, params.ageGroup).map((r) => `  - ${r}`).join('\n')}`)
    .join('\n');
  return `Ти си методист по предучилищно образование в България.
${naredba5PromptRules(params.ageGroup)}

Създай план-конспект на педагогическа ситуация на БЪЛГАРСКИ за ${ageInfo.full}, направление „${dir.label}“ (приложение № ${dir.appendix} към чл. 28), ${coreLine}, тема "${demoPlan.topic}", продължителност ${demoPlan.totalDuration} (в рамките на ${situationRangeLabel(params.ageGroup)} по чл. 25).
Вид на ситуацията: ${type.label}. Ситуацията протича предимно като игра.
Очакваните резултати за ${AGE_GROUP_STANDARDS[params.ageGroup].name} по приложение № ${dir.appendix} (само тези са верни):
${resultsList}
Етапите са точно три, както в книгата за учителя на „Златно ключе“: „${ZLATNO_KLYUCHE.situationParts.join('“, „')}“ — с минути, които дават сбор ${demoPlan.totalDuration}.
Всеки етап е конкретен: какво точно казва и показва учителят (с 2–3 въпроса към децата в кавички), каква игра или задача изпълняват децата и с какви материали. Основната част води към избраните очаквани резултати. Заключителната част проверява дали са постигнати.
${book ? `Сред материалите включи ${book}, без номера на страници.` : 'За Физическа култура няма познавателна книжка — материалите са уреди и пособия.'}
Може да включиш куклата-водач ${ZLATNO_KLYUCHE.guide} от „Златно ключе“ като герой в мотивацията. Приказката да е оригинална, кратка, с един конкретен герой и сюжет, свързан с темата. Играта за вкъщи е само по желание на семейството (чл. 32 забранява домашна работа).
Върни САМО валиден JSON (без markdown) с ключове:
- topic, ageGroupLabel, directionLabel, educationalCore (точното име на ядрото), totalDuration;
- aim — целта, едно изречение;
- goals — точно 3 задачи, започват с „Образователна: “, „Развиваща: “ и „Възпитателна: “;
- naredbaResults — 2–3 очаквани резултата, копирани ДОСЛОВНО от списъка по-горе, от избраното ядро;
- methods — 4–6 методи и похвати (кратко);
- materials (3–4), organizationForm (фронтална, групова или индивидуална — може комбинация), integrativeLinks (2 връзки с други направления, всяка започва с името на направлението);
- stages (3 с phase, duration, teacherAction, childrenActivity);
- assessment — как учителят разбира дали всяко дете е постигнало резултатите (наблюдение, конкретна задача);
- differentiation — подход към дете със СОП и към децата, които се справят бързо;
- story (title, hero, paragraphs (4), moral, discussionQuestions (3));
- parentNote (viberHeader, summaryMessage, highlights (3), homeGameTitle, homeGameDescription, closingWarmth).`;
}

/** Темата по БДП: избраната от учителя, позната по текста на темата или първата за групата. */
function resolveBdpTheme(params: LessonParams) {
  return (
    findBdpTheme(params.ageGroup, params.core) ??
    findBdpTheme(params.ageGroup, params.topic) ??
    BDP_THEMES[params.ageGroup][0]!
  );
}

/** Промпт за ситуация по БДП — интегрирана по Наредба № 5, с тема от програмите на МОН. */
function buildBdpAiPrompt(params: LessonParams, demoPlan: GeneratedLessonPlan): string {
  const ageInfo = AGE_GROUP_LABELS[params.ageGroup];
  const theme = resolveBdpTheme(params);
  return `Ти си методист по предучилищно образование в България.
${naredba5PromptRules(params.ageGroup)}
${bdpPromptRules(params.ageGroup)}

Създай план-конспект на педагогическа ситуация по безопасност на движението по пътищата на БЪЛГАРСКИ за ${ageInfo.full}.
Тема от програмата на МОН: „${theme.theme}“ (област „${theme.area}“). Очаквани резултати по програмата: ${theme.expected} Нови понятия: ${theme.concepts}.
Темата, зададена от учителя: "${demoPlan.topic}". Вид на ситуацията: ${SITUATION_TYPES[params.situationType ?? 'new'].label}. Продължителност ${demoPlan.totalDuration} (в рамките на ${situationRangeLabel(params.ageGroup)} по чл. 25). Ситуацията протича предимно като игра (ролеви игри „пешеходци и шофьори“, макет на улица, светофар).
Етапите са точно три: „${ZLATNO_KLYUCHE.situationParts.join('“, „')}“ — с минути, които дават сбор ${demoPlan.totalDuration}. Всеки етап е конкретен: какво казва и показва учителят (с 2–3 въпроса към децата в кавички) и какво правят децата.
Не посочвай познавателна книжка от „Златно ключе“ — за БДП такава не е посочена. Може да включиш куклата ${ZLATNO_KLYUCHE.guide} като малък пешеходец в мотивацията. Приказката да е оригинална и да показва безопасно поведение на пътя. Играта за вкъщи е само по желание (чл. 32) и се играе с възрастен.
Върни САМО валиден JSON (без markdown) с ключове: topic, ageGroupLabel, directionLabel, educationalCore, totalDuration, aim (целта, едно изречение), goals (точно 3 задачи, започват с „Образователна: “, „Развиваща: “ и „Възпитателна: “), methods (4–6 методи и похвати), materials (3–4), organizationForm, integrativeLinks (2 връзки с направления по Наредба № 5, всяка започва с името на направлението), stages (3 с phase, duration, teacherAction, childrenActivity), assessment (как учителят разбира дали всяко дете е постигнало резултатите), differentiation (подход към дете със СОП и към децата, които се справят бързо), story (title, hero, paragraphs (4), moral, discussionQuestions (3)), parentNote (viberHeader, summaryMessage, highlights (3), homeGameTitle, homeGameDescription, closingWarmth).`;
}

/** Откъде е дошъл резултатът — показва се в интерфейса. */
export type AiSource = 'ai' | 'demo';

/** Минимално време на анимацията „AI мисли“, за да не премигва при бърз демо отговор. */
const MIN_ANIMATION_MS = 1200;
/** Таван за чакане от браузъра; сървърът има собствен краен срок (gemini-retry). */
const CLIENT_TIMEOUT_MS = 40000;

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

async function withMinDuration<T>(work: Promise<T>): Promise<T> {
  const [result] = await Promise.all([work, new Promise((r) => setTimeout(r, MIN_ANIMATION_MS))]);
  return result;
}

/**
 * Генерира 3 игри през сървъра (Gemini с ключ на сървъра, както в МатураПлюс).
 * Без връзка или при грешка — вграденият демо двигател в браузъра.
 */
export async function generateKindergartenGames(filters: GameFilterState): Promise<{ games: GeneratedGame[]; source: AiSource }> {
  return withMinDuration(
    postJson<{ games: GeneratedGame[]; source: AiSource }>('/api/ai/games', filters)
      .then((data) => (Array.isArray(data.games) && data.games.length ? data : Promise.reject(new Error('empty'))))
      .catch((e) => {
        console.warn('Fallback to Smart Demo Engine (client):', e);
        return { games: finalizeGames(buildDemoGames(buildDemoContext(filters)), filters, true), source: 'demo' as const };
      }),
  );
}

export async function generateLessonPreparation(params: LessonParams): Promise<{ plan: GeneratedLessonPlan; source: AiSource }> {
  return withMinDuration(
    postJson<{ plan: GeneratedLessonPlan; source: AiSource }>('/api/ai/lesson', params)
      .then((data) => (data.plan?.stages ? data : Promise.reject(new Error('empty'))))
      .catch((e) => {
        console.warn('Fallback to Smart Demo Engine (client):', e);
        return { plan: buildDemoLessonPlan(params), source: 'demo' as const };
      }),
  );
}

/** Герой на приказката според ключови думи в темата (демо режим) — един герой, за да е ясна граматиката. */
const STORY_HEROES: { keys: string[]; hero: string }[] = [
  { keys: ['есен', 'гора', 'листа'], hero: 'таралежчето Бодливко' },
  { keys: ['зим', 'сняг', 'снеж'], hero: 'снежко Бялчо' },
  { keys: ['пролет', 'цвет', 'мартени'], hero: 'кокичето Белчо' },
  { keys: ['лят', 'море', 'слънц'], hero: 'слънчевото лъчице Златко' },
  { keys: ['коледа', 'нова година', 'дядо мраз'], hero: 'джуджето Звънчо от работилницата на Дядо Коледа' },
  { keys: ['великден', 'яйц'], hero: 'зайчето Скокльо' },
  { keys: ['космос', 'планет', 'звезд'], hero: 'малкият космонавт Звезделин' },
  { keys: ['професи', 'занаят'], hero: 'любопитното мече Марти' },
  { keys: ['здрав', 'хран', 'плод', 'зеленчу', 'витамин'], hero: 'капитан Морковчо' },
  { keys: ['живот', 'зоопарк', 'ферм'], hero: 'мъдрата сова Совка' },
  { keys: ['семейств', 'дом', 'мама', 'баба'], hero: 'мечето Мецко' },
  { keys: ['транспорт', 'превоз', 'пътя', 'светофар', 'улиц', 'пешеход'], hero: 'автобусчето Бибиш' },
  { keys: ['вода', 'дъжд', 'река'], hero: 'капчицата Капчо' },
  { keys: ['българ', 'родин', 'трибагрени'], hero: 'щъркелът Бенко' },
];

export function buildDemoLessonPlan(params: LessonParams): GeneratedLessonPlan {
  if (params.direction === 'bdp') return buildDemoBdpPlan(params);
  return buildDemoDirectionPlan({ ...params, direction: params.direction });
}

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const trimEnd = (s: string) => lowerFirst(s.replace(/[.;]$/, ''));
const childrenDo = (gameTitle: string, results: string[]) =>
  results.length
    ? `Участват в играта „${gameTitle}“. Всяко дете ${results.map(trimEnd).join('; ')}.`
    : `Участват в играта „${gameTitle}“ и изпълняват задачите ѝ.`;

/** Демо ситуация по БДП: интегрирана в „Околен свят“ (ядро „Социална и здравословна среда“). */
function buildDemoBdpPlan(params: LessonParams): GeneratedLessonPlan {
  const theme = resolveBdpTheme(params);
  const topic = params.topic.trim() || theme.theme;
  const type = params.situationType ?? 'new';
  const base = buildDemoDirectionPlan({ ageGroup: params.ageGroup, direction: 'world', topic, core: BDP.host.core, situationType: type });
  const r = BDP_NAREDBA5_RESULTS[params.ageGroup];
  // Без познавателна книжка: за БДП „Златно ключе“ не посочва отделна
  const { programMaterial: _omit, ...rest } = base;
  void _omit;
  // Основната част — играта по БДП, която подхожда на темата
  const game = bdpGameFor(`${theme.theme} ${theme.concepts} ${theme.expected}`, topic, params.ageGroup);
  const stages = rest.stages.map((st, i) =>
    i === 1
      ? {
          ...st,
          teacherAction: `${MAIN_PART_LEAD[type]} Нови понятия: ${theme.concepts}. Играта „${game.title}“: ${game.steps.join(' ')}`,
          childrenActivity: childrenDo(game.title, [r.world]),
        }
      : st,
  );
  return {
    ...rest,
    stages,
    directionLabel: `${BDP.label} (интегрирано в „${BDP.host.direction}“)`,
    educationalCore: `${BDP.host.core} (${BDP.host.direction}) • тема по БДП „${theme.theme}“`,
    aim: `${SITUATION_TYPES[type].aim} по безопасност на движението по темата „${theme.theme}“ чрез играта „${game.title}“.`,
    goals: lessonTasks('bdp', [r.world]),
    // Резултатите: по програмата на МОН за темата и по Наредба № 5 (приложение № 3)
    naredbaResults: [theme.expected, r.world],
    resultsSource: `програмата на МОН по БДП (тема „${theme.theme}“) и Наредба № 5, приложение № ${BDP.host.appendix}`,
    methods: METHODS.bdp,
    assessment: assessmentText(type, [r.world]),
    differentiation: differentiationText('bdp', game.sop),
    expectedResults: {
      knowledge: theme.expected,
      skills: `${r.world} (Наредба № 5, приложение № ${BDP.host.appendix})`,
      attitudes: 'Проявява внимание и отговорност към собствената безопасност и тази на другите на пътя.',
    },
    materials: [
      `Макет на улица с пешеходна пътека и светофар (понятия: ${theme.concepts})`,
      'Пътни знаци за игра и светлоотразителни жилетки',
      `Куклата ${ZLATNO_KLYUCHE.guide} като малък пешеходец`,
      'Волани или детски превозни средства за ролевата игра',
    ],
    organizationForm: 'Фронтална, групова и индивидуална',
    integrativeLinks: [
      `Конструиране и технологии (ядро „Техника“) — ${r.technika}`,
      'Физическа култура (ядро „Игрова двигателна дейност“) — ролева игра „Пешеходци и шофьори“ на площадката',
    ],
  };
}

function buildDemoDirectionPlan(params: LessonParams & { direction: EducationalDirection }): GeneratedLessonPlan {
  const topic = params.topic.trim() || 'Есен в гората';
  const type = params.situationType ?? 'new';
  const ageInfo = AGE_GROUP_LABELS[params.ageGroup];
  const dirInfo = DIRECTION_LABELS[params.direction];
  const core = pickCore(params.direction, topic, params.core);
  const book = zlatnoBookFor(params.direction, params.ageGroup);
  const t = topic.toLowerCase();
  // Интегриран подход: две естествени връзки с други направления
  const LINKS: Record<EducationalDirection, [string, string]> = {
    bel: ['Околен свят — представи по темата чрез беседа и наблюдение', 'Изобразително изкуство — илюстриране на любим момент от приказката'],
    math: ['Околен свят — броене и сравняване на обекти от темата', 'Физическа култура — подвижна игра с групиране по брой'],
    world: ['Български език и литература — беседа и обогатяване на речника', 'Изобразително изкуство — рисуване на наблюдаваното'],
    art: ['Околен свят — наблюдение на обектите, които пресъздаваме', 'Български език и литература — описание на собствената творба'],
    music: ['Физическа култура — музикално-ритмични движения', 'Български език и литература — текстът на песента и неговият смисъл'],
    construct: ['Математика — форми, брой и размер на елементите', 'Околен свят — къде се използва изработеното в живота'],
    pe: ['Математика — брой повторения и посоки в пространството', 'Околен свят — здравословен начин на живот'],
  };

  const hero = STORY_HEROES.find((h) => h.keys.some((k) => t.includes(k)))?.hero ?? 'любознателното катериче Руменчо';

  const timings: Record<AgeGroup, [string, string, string]> = {
    '1': ['3 мин.', '9 мин.', '3 мин.'],
    '2': ['4 мин.', '12 мин.', '4 мин.'],
    '3': ['4 мин.', '16 мин.', '5 мин.'],
    '4': ['5 мин.', '19 мин.', '6 мин.'],
  };
  const [t1, t2, t3] = timings[params.ageGroup];

  // Играта за ядрото и очакваните резултати, които тя упражнява — дословно от наредбата
  const appendix = DIRECTION_STANDARDS[params.direction].appendix;
  const game = gameForCore(params.direction, core, topic, params.ageGroup);
  const results = game
    ? pickResults(params.direction, core, params.ageGroup, `${game.steps.join(' ')} ${game.skills} ${topic}`)
    : expectedResults(params.direction, core, params.ageGroup).slice(0, 3);
  const gameTitle = game?.title ?? `Игра по темата „${topic}“`;

  return {
    topic,
    ageGroupLabel: ageInfo.full,
    directionLabel: dirInfo.label,
    educationalCore: core,
    totalDuration: ageInfo.dosDuration,
    situationType: SITUATION_TYPES[type].label,
    aim: `${SITUATION_TYPES[type].aim} по ядро „${core}“ чрез играта „${gameTitle}“ (тема „${topic}“).`,
    goals: lessonTasks(params.direction, results),
    naredbaResults: results,
    resultsSource: `Наредба № 5, приложение № ${appendix}, ядро „${core}“`,
    methods: METHODS[params.direction],
    assessment: assessmentText(type, results),
    differentiation: differentiationText(params.direction, game?.sop),
    expectedResults: {
      knowledge: results[0] ?? `Разпознава и назовава основните обекти и признаци по темата „${topic}“.`,
      skills: results[1] ?? (game ? `Упражнява: ${game.skills}.` : `Участва в игрите по темата „${topic}“.`),
      attitudes: 'Проявява емоционална отзивчивост, интерес и готовност за взаимопомощ в групата.',
    },
    materials: [
      ...(book ? [book[0]!.toUpperCase() + book.slice(1)] : []),
      `Картинки и предмети по темата „${topic}“ за играта`,
      `Куклата ${ZLATNO_KLYUCHE.guide} в ролята на госта от мотивацията`,
      params.direction === 'pe'
        ? 'Уреди и пособия за двигателна дейност (обръчи, топки, ленти, гимнастически пейки)'
        : `Индивидуални материали за всяко дете (${dirInfo.shortLabel})`,
    ],
    organizationForm: params.direction === 'pe' ? 'Фронтална и групова' : 'Фронтална, групова и индивидуална',
    integrativeLinks: LINKS[params.direction],
    ...(book ? { programMaterial: book } : {}),
    stages: [
      {
        phase: '1. Уводна част (мотивация)',
        duration: t1,
        teacherAction: `Посреща децата в кръг. ${ZLATNO_KLYUCHE.guide} идва на гости с кутия с изненади по темата „${topic}“ и моли децата за помощ. Учителят пита: „Какво знаете по тази тема? Как можем да помогнем?“`,
        childrenActivity: 'Поздравяват госта, разглеждат какво има в кутията и казват какво знаят по темата.',
      },
      {
        phase: '2. Основна част (игрова, познавателна и практическа дейност)',
        duration: t2,
        teacherAction: game
          ? `${MAIN_PART_LEAD[type]} Играта „${game.title}“: ${game.steps.join(' ')}`
          : `${MAIN_PART_LEAD[type]} Провежда дидактична игра по ядро „${core}“ с картинки и предмети по темата.`,
        childrenActivity: childrenDo(gameTitle, results),
      },
      {
        phase: '3. Заключителна част (обобщение и оценка)',
        duration: t3,
        teacherAction: `Пита: „Какво правихме днес? Кое беше лесно и кое — трудно?“ Казва на всяко дете конкретно какво е направило добре и изпраща госта.`,
        childrenActivity: 'Казват какво са правили, показват с палец как са се справили и подреждат материалите.',
      },
    ],
    story: {
      title: `${hero.charAt(0).toUpperCase() + hero.slice(1)} и „${topic}“`,
      hero,
      paragraphs: [
        `Една сутрин ${hero} се събуди с въпрос: какво ли още не знае за „${topic}“? И реши да потърси отговора.`,
        'По пътя срещна приятели. Всеки знаеше по нещо малко, но никой не знаеше всичко. „Хайде да търсим заедно!“ — предложи героят.',
        'Те гледаха внимателно, питаха и опитваха. Когато някой се затрудняваше, другите му помагаха.',
        'Накрая събраха всичко, което бяха научили, и отговорът беше намерен. „Заедно е по-лесно и по-весело!“ — казаха приятелите.',
      ],
      moral: 'Поука: когато питаме, опитваме и си помагаме, научаваме повече.',
      discussionQuestions: [`Какъв въпрос имаше героят за „${topic}“?`, 'Кой му помогна и как?', 'Кога ти си помогнал или помогнала на приятел?'],
    },
    parentNote: {
      viberHeader: `Днес в групата (${ageInfo.short}): „${topic}“`,
      summaryMessage: `Мили родители, днес по ${dirInfo.label} работихме по темата „${topic}“ с играта „${gameTitle}“.`,
      highlights: results.length ? results.map((r) => `Упражнявахме: ${trimEnd(r)}.`) : [`Говорихме и играхме по темата „${topic}“.`],
      homeGameTitle: 'Игра вкъщи по желание: „Научи ме и мен“',
      homeGameDescription: `Ако желаете, помолете детето да ви покаже как се играе „${gameTitle}“ и я изиграйте заедно за 5 минути. Това не е домашна работа — само по желание.`,
      closingWarmth: 'Благодарим ви за подкрепата!',
    },
  };
}
