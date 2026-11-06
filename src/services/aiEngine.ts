import { AgeGroup, AISettings, EducationalDirection, GameFilterState, GeneratedGame, GeneratedLessonPlan, GroupMood, PlayDuration, PlayLocation, PlayResources } from '../types';
import { buildDemoGames, DemoContext } from './demoGames';
import { extractJson, normalizeGames, normalizeLessonPlan } from './aiValidation';

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

export const DIRECTION_LABELS: Record<EducationalDirection, { label: string; shortLabel: string; emoji: string; coresByAge: Record<AgeGroup, string> }> = {
  bel: { label: 'Български език и литература', shortLabel: 'БЕЛ', emoji: '📖', coresByAge: { '1': 'Възприемане на литературно произведение • Речник', '2': 'Свързана реч • Възприемане на литературно произведение', '3': 'Свързана реч • Преразказ и словесно творчество', '4': 'Подготовка за ограмотяване • Свързана реч и литературно възприемане' } },
  world: { label: 'Околен свят', shortLabel: 'Околен свят', emoji: '🌍', coresByAge: { '1': 'Самоутвърждаване и общуване • Светът на природата', '2': 'Социална и здравословна среда • Светът на природата', '3': 'Светът на природата и неговото опазване • Социална среда', '4': 'Светът на природата и екологична култура • Социална среда' } },
  math: { label: 'Математика', shortLabel: 'Математика', emoji: '🔢', coresByAge: { '1': 'Количествени отношения (едно и много) • Пространствени направления', '2': 'Количествени отношения (броене до 5) • Геометрични фигури', '3': 'Количествени отношения (броене до 10) • Равнинни фигури', '4': 'Количествени отношения до 10 • Измерване и логически задачи' } },
  art: { label: 'Изобразително изкуство', shortLabel: 'Изобразително изкуство', emoji: '🎨', coresByAge: { '1': 'Художествено възприемане • Изобразителни материали', '2': 'Изобразително творчество • Форма и цвят', '3': 'Художествено пресъздаване и композиция • Декоративно творчество', '4': 'Сюжетно рисуване и композиция • Комбинирани техники' } },
  music: { label: 'Музика', shortLabel: 'Музика', emoji: '🎵', coresByAge: { '1': 'Възприемане на музика • Пеене и ритмични движения', '2': 'Възпроизвеждане на музика • Музика и игра', '3': 'Музикална изразност • Детски музикални инструменти', '4': 'Музикално-изпълнителско творчество • Метроритъм' } },
  construct: { label: 'Конструиране и технологии', shortLabel: 'Конструиране и технологии', emoji: '🧱', coresByAge: { '1': 'Конструиране и моделиране с модулни елементи', '2': 'Конструиране и моделиране • Обработване на материали', '3': 'Конструиране по условие и собствен замисъл • Работа с хартия и природни материали', '4': 'Проектиране и пространствено конструиране • Свързване на елементи' } },
};


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
    '4. Развивани умения по Наредба № 5',
    '5. Идея за адаптация за дете със СОП',
  ].join('\n');
}

/** Максимално време за чакане на реалния AI, преди да минем на демо режим (важно при жива демонстрация). */
const AI_TIMEOUT_MS = 25000;

async function callLLM(prompt: string, settings: AISettings): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
  try {
    if (settings.provider === 'gemini') {
      const model = settings.model || 'gemini-2.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': settings.apiKey.trim() },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.8, responseMimeType: 'application/json' },
        }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
      const data = await res.json();
      return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } else {
      const model = settings.model || 'gpt-4o-mini';
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${settings.apiKey.trim()}` },
        body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], temperature: 0.8 }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}`);
      const data = await res.json();
      return data?.choices?.[0]?.message?.content || '';
    }
  } finally {
    clearTimeout(timer);
  }
}

function isApiMode(settings: AISettings): boolean {
  return settings.mode === 'api' && settings.apiKey.trim().length > 10;
}

function buildDemoContext(filters: GameFilterState): DemoContext {
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

export async function generateKindergartenGames(filters: GameFilterState, settings: AISettings): Promise<GeneratedGame[]> {
  const demoGames = buildDemoGames(buildDemoContext(filters));

  if (isApiMode(settings)) {
    try {
      const userPrompt = buildStructuredGameUserPrompt(filters);
      const prompt = `Ти си експертен български педагог в детска градина (Наредба № 5).
${userPrompt}

Генерирай 3 РАЗЛИЧНИ игри на БЪЛГАРСКИ ЕЗИК: 1) подвижно-регулираща според настроението, 2) дидактична/словесна с гатанка, 3) екипна игра с наличните материали.
Римуваният стих да е 4 реда, наистина римуван и подходящ за възрастта. Стъпките да са 3–4, конкретни и изпълними на посоченото място.
Върни САМО валиден JSON масив от 3 обекта (без markdown, без номерация в стойностите) със следната структура:
[{"title":"Заглавие на играта","subtitle":"Кратко подзаглавие","tags":["Таг1","Таг2"],"rhymeTitle":"📜 Римуван стих за старт:","rhymeLines":["Ред 1","Ред 2","Ред 3","Ред 4"],"steps":["Стъпка 1","Стъпка 2","Стъпка 3"],"pedagogicalGoal":"Развивани умения по Наредба № 5","sopAdaptation":"Идея за адаптация за дете със СОП","teacherTip":"Практичен съвет към учителя"}]`;
      const raw = await callLLM(prompt, settings);
      return normalizeGames(extractJson(raw), demoGames);
    } catch (e) {
      console.warn('Fallback to Smart Demo Engine:', e);
      return demoGames;
    }
  }

  await new Promise((r) => setTimeout(r, 1700));
  return demoGames;
}

type LessonParams = { ageGroup: AgeGroup; direction: EducationalDirection; topic: string };

export async function generateLessonPreparation(params: LessonParams, settings: AISettings): Promise<GeneratedLessonPlan> {
  const demoPlan = buildDemoLessonPlan(params);

  if (isApiMode(settings)) {
    try {
      const ageInfo = AGE_GROUP_LABELS[params.ageGroup];
      const dirInfo = DIRECTION_LABELS[params.direction];
      const prompt = `Ти си методист по предучилищно образование в България (Наредба № 5 - ДОС). Създай разработка на БЪЛГАРСКИ за ${ageInfo.full}, направление ${dirInfo.label}, образователно ядро „${demoPlan.educationalCore}“, тема "${demoPlan.topic}", продължителност ${ageInfo.dosDuration}. Приказката да е оригинална, с конкретен герой и сюжет, свързан с темата. Върни САМО валиден JSON (без markdown) с ключове: topic, ageGroupLabel, directionLabel, educationalCore, totalDuration, goals (3), expectedResults (knowledge, skills, attitudes), materials (3), stages (3 с phase, duration, teacherAction, childrenActivity), story (title, hero, paragraphs (4), moral, discussionQuestions (3)), parentNote (viberHeader, summaryMessage, highlights (3), homeGameTitle, homeGameDescription, closingWarmth).`;
      const raw = await callLLM(prompt, settings);
      return normalizeLessonPlan(extractJson(raw), demoPlan);
    } catch (e) {
      console.warn('Fallback to Smart Demo Engine:', e);
      return demoPlan;
    }
  }

  await new Promise((r) => setTimeout(r, 1800));
  return demoPlan;
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

function buildDemoLessonPlan(params: LessonParams): GeneratedLessonPlan {
  const topic = params.topic.trim() || 'Есен в гората';
  const ageInfo = AGE_GROUP_LABELS[params.ageGroup];
  const dirInfo = DIRECTION_LABELS[params.direction];
  const core = dirInfo.coresByAge[params.ageGroup];
  const t = topic.toLowerCase();

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
      knowledge: `Разпознава и назовава основните обекти, признаци и закономерности, свързани с темата „${topic}“ според ДОС.`,
      skills: `Участва активно в диалог, групира елементи, прилага практически умения и решава игрови задачи по темата „${topic}“.`,
      attitudes: `Проявява емоционална отзивчивост, изследователски интерес и готовност за взаимопомощ в групата.`,
    },
    materials: [
      `Нагледни илюстративни табла и сюжетни карти по темата „${topic}“`,
      `Магическа кутия със загадки и кукла-маркер (${hero})`,
      `Индивидуални материали за практическа и дидактична работа според направлението (${dirInfo.shortLabel})`,
    ],
    stages: [
      {
        phase: '1. Емоционално въведение и мотивация',
        duration: t1,
        teacherAction: `Посреща децата на килима с „Магическата кутия“ и чрез кратка загадка представя гостуващия герой (${hero}), който ги кани на пътешествие в света на „${topic}“.`,
        childrenActivity: `Събират се с интерес в кръг, отгатват уводната загадка, поздравяват героя и споделят какво вече знаят за „${topic}“.`,
      },
      {
        phase: '2. Основна част (познавателна, дидактична и практическа дейност)',
        duration: t2,
        teacherAction: `Представя интерактивно основните акценти по темата „${topic}“, провежда дидактичната игра „Откриватели на ${topic}“ и насочва децата в практическата мисия по ${dirInfo.label}.`,
        childrenActivity: `Наблюдават, сравняват и групират обектите от „${topic}“, отговарят на въпроси и изпълняват с ентусиазъм творческата/познавателната задача.`,
      },
      {
        phase: '3. Заключителна част с рефлексия',
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
      homeGameTitle: `🎲 5-минутна игра за вкъщи: „Малкият експерт по ${topic}“`,
      homeGameDescription: `Тази вечер разменете ролите за 5 минути – нека детето бъде „Учителят-експерт по ${topic}“, а вие неговият любопитен ученик! Попитайте го: „Кои са 3-те най-интересни неща за ${topic}, които научихте днес?“ и го оставете то да ви зададе гатанка!`,
      closingWarmth: `Благодарим ви за партньорството! Пожелаваме ви топла и усмихната семейна вечер! 💛`,
    },
  };
}
