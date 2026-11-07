import { AgeGroup, EducationalDirection, GameFilterState, GeneratedGame, GeneratedLessonPlan, GroupMood, PlayDuration, PlayLocation, PlayResources } from '../types';
import { buildDemoGames, DemoContext } from './demoGames';
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

export const AGE_GROUP_LABELS: Record<AgeGroup, { short: string; full: string; ageRange: string; dosDuration: string }> = {
  '1': { short: '1-ва група (3-4 г.)', full: 'Първа възрастова група (3–4 години)', ageRange: '3-4 г.', dosDuration: '15 мин' },
  '2': { short: '2-ра група (4-5 г.)', full: 'Втора възрастова група (4–5 години)', ageRange: '4-5 г.', dosDuration: '20 мин' },
  '3': { short: '3-та група (5-6 г.)', full: 'Трета подготвителна група (5–6 години)', ageRange: '5-6 г.', dosDuration: '25 мин' },
  '4': { short: '4-та група (6-7 г.)', full: 'Четвърта подготвителна група (6–7 години)', ageRange: '6-7 г.', dosDuration: '30 мин' },
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

  return [
    'Моля, създай ситуационна игра за детската градина със следните параметри:',
    `- Възрастова група: ${ageInfo.short}`,
    `- Настроение на децата: ${moodInfo.label}`,
    `- Място: ${locInfo.label}`,
    `- Времетраене: ${durInfo.label}ути`,
    `- Налични материали: ${resInfo.label}`,
    ...(kw ? [`- Допълнителна тема: ${kw}`] : []),
    'Форматирай отговора с:',
    '1. Заглавие на играта',
    '2. Римуван стих за старт',
    '3. Точни стъпки за играта (1, 2, 3)',
    '4. Развивани умения по Наредба № 5 (образователно направление и ядро)',
    '5. Идея за адаптация за дете със СОП',
  ].join('\n');
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
  };
}

/** Пълният промпт за 3 игри — вика се от сървъра (/api/ai/games). */
export function buildGamesAiPrompt(filters: GameFilterState): string {
  return `Ти си експертен български педагог в детска градина, работиш по Наредба № 5 за предучилищното образование и по програмната система „Златно ключе“ на „Бит и техника“.
${naredba5PromptRules(filters.ageGroup)}

${buildStructuredGameUserPrompt(filters)}

Генерирай 3 РАЗЛИЧНИ игри на БЪЛГАРСКИ ЕЗИК: 1) подвижно-регулираща според настроението (Физическа култура), 2) дидактична/словесна с гатанка (БЕЛ, Математика или Околен свят), 3) екипна игра с наличните материали.
Римуваният стих да е 4 реда, наистина римуван и подходящ за възрастта. Стъпките да са 3–4, конкретни и изпълними на посоченото място.
Полето "pedagogicalGoal" ЗАПОЧВА с направлението и ядрото с точните им имена, напр. „Физическа култура (ядро „Игрова двигателна дейност“); Околен свят (ядро „Самоутвърждаване и общуване с околните“): …“, а след двоеточието — конкретните умения.
Върни САМО валиден JSON масив от 3 обекта (без markdown, без номерация в стойностите) със следната структура:
[{"title":"Заглавие на играта","subtitle":"Кратко подзаглавие","tags":["Таг1","Таг2"],"rhymeTitle":"📜 Римуван стих за старт:","rhymeLines":["Ред 1","Ред 2","Ред 3","Ред 4"],"steps":["Стъпка 1","Стъпка 2","Стъпка 3"],"pedagogicalGoal":"Развивани умения по Наредба № 5","sopAdaptation":"Идея за адаптация за дете със СОП","teacherTip":"Практичен съвет към учителя"}]`;
}

/** core — официалното образователно ядро; без него AI избира най-подходящото за темата. */
export type LessonParams = { ageGroup: AgeGroup; direction: EducationalDirection; topic: string; core?: string };

/** Пълният промпт за ДОС разработка — вика се от сървъра (/api/ai/lesson). */
export function buildLessonAiPrompt(params: LessonParams, demoPlan: GeneratedLessonPlan): string {
  const ageInfo = AGE_GROUP_LABELS[params.ageGroup];
  const dir = DIRECTION_STANDARDS[params.direction];
  const coreLine = params.core
    ? `образователно ядро „${params.core}“`
    : `образователно ядро — избери най-подходящото за темата от: ${dir.cores.map((c) => `„${c}“`).join(', ')}`;
  const book = zlatnoBookFor(params.direction, params.ageGroup);
  return `Ти си методист по предучилищно образование в България.
${naredba5PromptRules(params.ageGroup)}

Създай план-конспект на педагогическа ситуация на БЪЛГАРСКИ за ${ageInfo.full}, направление „${dir.label}“ (приложение № ${dir.appendix} към чл. 28), ${coreLine}, тема "${demoPlan.topic}", продължителност ${demoPlan.totalDuration} (в рамките на ${situationRangeLabel(params.ageGroup)} по чл. 25).
Очакваните резултати да са по приложение № ${dir.appendix} за ${AGE_GROUP_STANDARDS[params.ageGroup].name}. Ситуацията протича предимно като игра.
Етапите са точно три, както в книгата за учителя на „Златно ключе“: „${ZLATNO_KLYUCHE.situationParts.join('“, „')}“ — с минути, които дават сбор ${demoPlan.totalDuration}.
${book ? `Сред материалите включи ${book}, без номера на страници.` : 'За физическа култура няма познавателна книжка — материалите са уреди и пособия.'}
Може да включиш куклата-водач ${ZLATNO_KLYUCHE.guide} от „Златно ключе“ като герой в мотивацията. Приказката да е оригинална, с конкретен герой и сюжет, свързан с темата. Играта за вкъщи е само по желание на семейството (чл. 32 забранява домашна работа).
Върни САМО валиден JSON (без markdown) с ключове: topic, ageGroupLabel, directionLabel, educationalCore (точното име на ядрото), totalDuration, goals (3), expectedResults (knowledge, skills, attitudes), materials (3–4), organizationForm (фронтална, групова или индивидуална — може комбинация), integrativeLinks (2 връзки с други направления, всяка започва с името на направлението), stages (3 с phase, duration, teacherAction, childrenActivity), story (title, hero, paragraphs (4), moral, discussionQuestions (3)), parentNote (viberHeader, summaryMessage, highlights (3), homeGameTitle, homeGameDescription, closingWarmth).`;
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
        return { games: buildDemoGames(buildDemoContext(filters)), source: 'demo' as const };
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

/** Герой на приказката според ключови думи в темата (демо режим). */
const STORY_HEROES: { keys: string[]; hero: string }[] = [
  { keys: ['есен', 'гора', 'листа'], hero: 'таралежчето Бодливко и златното листо Листчо' },
  { keys: ['зим', 'сняг', 'снеж'], hero: 'снежко Бялчо и снежинката Искрица' },
  { keys: ['пролет', 'цвет', 'мартени'], hero: 'кокичето Белчо и пчеличката Жужа' },
  { keys: ['лят', 'море', 'слънц'], hero: 'слънчевото лъчице Златко и рибката Вълничка' },
  { keys: ['коледа', 'нова година', 'дядо мраз'], hero: 'малкото джудже Звънчо от работилницата на Дядо Коледа' },
  { keys: ['великден', 'яйц'], hero: 'шареното яйце Писанка и зайчето Скокльо' },
  { keys: ['космос', 'планет', 'звезд'], hero: 'малкият астронавт Звезделин и комета Светулка' },
  { keys: ['професи', 'занаят'], hero: 'любопитното момченце Марти и вълшебната шапка на майсторите' },
  { keys: ['здрав', 'хран', 'плод', 'зеленчу', 'витамин'], hero: 'капитан Морковчо и дружината на Витамините' },
  { keys: ['живот', 'зоопарк', 'ферм'], hero: 'мъдрата сова Совка и малкото лисиче Хитрушко' },
  { keys: ['семейств', 'дом', 'мама', 'баба'], hero: 'мечето Бъди и неговото голямо мечешко семейство' },
  { keys: ['транспорт', 'превоз', 'пътя', 'светофар'], hero: 'автобусчето Бибиш и светофарчо Мигачко' },
  { keys: ['вода', 'дъжд', 'река'], hero: 'капчицата Капчо и облачето Пухчо' },
  { keys: ['българ', 'родин', 'трибагрени'], hero: 'щъркелът Бенко, който обиколи цяла България' },
];

export function buildDemoLessonPlan(params: LessonParams): GeneratedLessonPlan {
  const topic = params.topic.trim() || 'Есен в гората';
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

  const hero = STORY_HEROES.find((h) => h.keys.some((k) => t.includes(k)))?.hero
    ?? `любознателното катериче Руменчо – откривателят на „${topic}“`;

  const timings: Record<AgeGroup, [string, string, string]> = {
    '1': ['3 мин.', '9 мин.', '3 мин.'],
    '2': ['4 мин.', '12 мин.', '4 мин.'],
    '3': ['4 мин.', '16 мин.', '5 мин.'],
    '4': ['5 мин.', '19 мин.', '6 мин.'],
  };
  const [t1, t2, t3] = timings[params.ageGroup];

  return {
    topic,
    ageGroupLabel: ageInfo.full,
    directionLabel: dirInfo.label,
    educationalCore: core,
    totalDuration: ageInfo.dosDuration,
    goals: [
      `Обогатяване и систематизиране на представите на децата по темата „${topic}“ в направление „${dirInfo.label}“.`,
      `Развиване на познавателните, речевите и практическите умения чрез дидактични и ролеви игри по „${topic}“.`,
      `Възпитаване на любознателност, екипност и позитивно отношение към света чрез примери от „${topic}“.`,
    ],
    expectedResults: {
      knowledge: `Разпознава и назовава основните обекти, признаци и закономерности, свързани с темата „${topic}“ (ядро „${core}“, приложение № ${DIRECTION_STANDARDS[params.direction].appendix} към Наредба № 5).`,
      skills: `Участва активно в диалог, групира елементи, прилага практически умения и решава игрови задачи по темата „${topic}“.`,
      attitudes: `Проявява емоционална отзивчивост, изследователски интерес и готовност за взаимопомощ в групата.`,
    },
    materials: [
      ...(book ? [book[0]!.toUpperCase() + book.slice(1)] : []),
      `Нагледни илюстративни табла и сюжетни карти по темата „${topic}“`,
      `Магическа кутия със загадки и куклата ${ZLATNO_KLYUCHE.guide} като водач`,
      params.direction === 'pe'
        ? 'Уреди и пособия за двигателна дейност (обръчи, топки, ленти, гимнастически пейки)'
        : `Индивидуални материали за практическа и дидактична работа (${dirInfo.shortLabel})`,
    ],
    organizationForm: params.direction === 'pe' ? 'Фронтална и групова' : 'Фронтална, групова и индивидуална',
    integrativeLinks: LINKS[params.direction],
    ...(book ? { programMaterial: book } : {}),
    stages: [
      {
        phase: '1. Уводна част (мотивация)',
        duration: t1,
        teacherAction: `Посреща децата на килима с „Магическата кутия“ и чрез кратка загадка представя гостуващия герой (${hero}), който ги кани на пътешествие в света на „${topic}“.`,
        childrenActivity: `Събират се с интерес в кръг, отгатват уводната загадка, поздравяват героя и споделят какво вече знаят за „${topic}“.`,
      },
      {
        phase: '2. Основна част (игрова, познавателна и практическа дейност)',
        duration: t2,
        teacherAction: `Представя интерактивно основните акценти по темата „${topic}“, провежда дидактичната игра „Откриватели на ${topic}“ и насочва децата в практическата мисия по ${dirInfo.label}.`,
        childrenActivity: `Наблюдават, сравняват и групират обектите от „${topic}“, отговарят на въпроси и изпълняват с ентусиазъм творческата/познавателната задача.`,
      },
      {
        phase: '3. Заключителна част (обобщение и рефлексия)',
        duration: t3,
        teacherAction: `Обобщава наученото чрез рефлексивната игра „Вълшебният микрофон“: „Кое беше най-интересното ни откритие за ${topic} днес?“ и поощрява всяко дете.`,
        childrenActivity: `Споделят своите впечатления и любими моменти, подреждат материалите и изпращат героя с усмивка.`,
      },
    ],
    story: {
      title: `Приказка за „${topic}“ и чудното откритие`,
      hero,
      paragraphs: [
        `Една слънчева сутрин на Вълшебната поляна на откритията оживяха всички чудеса, свързани с „${topic}“. Там нашият главен герой – ${hero} – се събуди с широка усмивка и си каза: „Днес ще открия най-голямата тайна на ${topic}!“`,
        `По пътеката пред него се появи златна загадка. За да я отключи, героят трябваше да събере три вълшебни ключета: наблюдателни очи, умни въпроси и добри приятели, които си помагат в труден момент.`,
        `Скоро той срещна малките горски приятели, които се чудеха как да се справят със задачата за „${topic}“. Заедно те обединиха сили – всеки подаде ръка, сподели знание и с дружна усмивка подредиха пъзела на „${topic}“!`,
        `Тогава поляната засия в топла светлина, а героят възкликна щастливо: „Истинското вълшебство на ${topic} се крие в това да учим, да творим и да откриваме света заедно!“`,
      ],
      moral: `Поука: Всяко знание за „${topic}“ става по-лесно и вълнуващо, когато го споделяме с добри приятели!`,
      discussionQuestions: [
        `Кой беше главният герой в нашата приказка за „${topic}“ и каква тайна искаше да открие той?`,
        `Как приятелите успяха да се справят със загадката – сами или с общи усилия?`,
        `Какво ново и интересно за „${topic}“ бихте разказали вие на нашия приказен герой?`,
      ],
    },
    parentNote: {
      viberHeader: `🌟 Днес в групата (${ageInfo.short}): Вълнуващо пътешествие по тема „${topic}“!`,
      summaryMessage: `Скъпи родители, днес в направление „${dirInfo.label}“ нашите малки откриватели се потопиха в темата „${topic}“ с много игри, приказни герои и практически предизвикателства!`,
      highlights: [
        `Обогатихме представите и речника си с нови понятия по темата „${topic}“.`,
        `Слушахме авторската приказка с героя ${hero} и беседвахме за приятелството и взаимопомощта.`,
        `Децата работиха в екип и се справиха отлично с практическата мисия по ${dirInfo.shortLabel}!`,
      ],
      homeGameTitle: `🎲 5-минутна семейна игра (по желание): „Малкият експерт по ${topic}“`,
      homeGameDescription: `Тази вечер разменете ролите за 5 минути – нека детето бъде „Учителят-експерт по ${topic}“, а вие неговият любопитен ученик! Попитайте го: „Кои са 3-те най-интересни неща за ${topic}, които научихте днес?“ и го оставете то да ви зададе гатанка!`,
      closingWarmth: `Благодарим ви за партньорството! Пожелаваме ви топла и усмихната семейна вечер! 💛`,
    },
  };
}
