import { AgeGroup, AISettings, EducationalDirection, GameFilterState, GeneratedGame, GeneratedLessonPlan, GroupMood, PlayDuration, PlayLocation, PlayResources } from '../types';

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

let gameVar = 0;

async function callLLM(prompt: string, settings: AISettings): Promise<string> {
  if (settings.provider === 'gemini') {
    const model = settings.model || 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(settings.apiKey.trim())}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.7 } }),
    });
    if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } else {
    const model = settings.model || 'gpt-4o-mini';
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${settings.apiKey.trim()}` },
      body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], temperature: 0.7 }),
    });
    if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}`);
    const data = await res.json();
    return data?.choices?.[0]?.message?.content || '';
  }
}

export async function generateKindergartenGames(filters: GameFilterState, settings: AISettings): Promise<GeneratedGame[]> {
  const ageInfo = AGE_GROUP_LABELS[filters.ageGroup];
  const moodInfo = MOOD_LABELS[filters.mood];
  const locInfo = LOCATION_LABELS[filters.location];
  const durInfo = DURATION_LABELS[filters.duration];
  const resInfo = RESOURCE_LABELS[filters.resources];
  const kw = filters.customTheme?.trim();

  if (settings.mode === 'api' && settings.apiKey.trim().length > 10) {
    try {
      const prompt = `Ти си експертен български педагог в детска градина. Генерирай 3 игри на БЪЛГАРСКИ ЕЗИК за:
Група: ${ageInfo.full}, Настроение: ${moodInfo.label}, Място: ${locInfo.label}, Време: ${durInfo.label}, Ресурси: ${resInfo.label}${kw ? `, Тема: ${kw}` : ''}.
Върни САМО валиден JSON масив от 3 обекта със следната структура:
[{"id":"g1","title":"Име","subtitle":"Подзаглавие","tags":["Таг1","Таг2"],"badgeColor":"mint","rhymeTitle":"📜 Римуван стих за старт:","rhymeLines":["Стих 1","Стих 2","Стих 3","Стих 4"],"steps":["Стъпка 1","Стъпка 2","Стъпка 3"],"pedagogicalGoal":"Развивани умения","teacherTip":"Съвет към учителя"}]`;
      const raw = await callLLM(prompt, settings);
      const match = raw.match(/\[[\s\S]*\]/);
      if (match) {
        const parsed = JSON.parse(match[0]) as GeneratedGame[];
        const colors: GeneratedGame['badgeColor'][] = ['mint', 'lavender', 'coral'];
        return parsed.slice(0, 3).map((g, i) => ({ ...g, id: `ai-g-${Date.now()}-${i}`, badgeColor: colors[i % 3] }));
      }
    } catch (e) {
      console.warn('Fallback to Smart Demo Engine:', e);
    }
  }

  await new Promise((r) => setTimeout(r, 1700));
  const v = gameVar++;

  const g1Rhyme = filters.mood === 'noisy'
    ? ['Вятърко лудуваше, скачаше без спир,', 'ала чу вълшебен звън и настъпи мир!', 'Свий крилца, замръзни тук като малък гном,', 'тишината нежна влиза в нашия уютен дом!']
    : filters.mood === 'tired'
    ? ['Прозява се мечето в горския креват,', 'протяга си лапичките към целия свят!', 'Докосни небето синьо, плесни два пъти с ръце,', 'усмивка подари ми от своето сърце!']
    : ['Ушичките наострям като горски зайо бял,', 'очите ми внимават – всеки знак съм разпознал!', 'Когато чуя тайната парола на деня,', 'превръщам се във фокус-шампион на мига!'];

  const resGame3Map: Record<PlayResources, { title: string; rhyme: string[]; steps: string[] }> = {
    none: {
      title: kw ? `Огледални приятели: „${kw}“` : 'Вълшебните огледала на приятелството',
      rhyme: ['Огледалце светло, чудно, виж ме колко съм послушен!', 'Щом ти махна със ръчичка – ставаш весела звездичка,', 'щом приклекна на килима – тишина вълшебна има,', 'две дечица в синхрон строен пазят мира наш спокоен!'],
      steps: [
        `Децата застават по двойки едно срещу друго ${locInfo.spatialHint} („Магьосник“ и „Огледало“).`,
        `„Магьосникът“ показва плавно движение${kw ? ` по темата „${kw}“` : ''}, а „Огледалото“ го повтаря в пълна тишина.`,
        `При сигнал „Смяна на огледалата!“ децата разменят ролите си с усмивка (${durInfo.pacingHint}).`,
      ],
    },
    balls: {
      title: kw ? `Пътуващата топка: „${kw}“` : 'Тайната на шепнещата топка',
      rhyme: ['Топчицата шарена се търкаля тихо тук,', 'от ръчичка на ръчичка – без да чуеш нито звук!', 'Който топката прегърне, с топла дума ще отвърне,', 'слушай внимателно сега – ред е на твоята мечта!'],
      steps: [
        `Децата сядат в кръг ${locInfo.spatialHint}. Учителят пуска цветната топка плавно по пода към избрано дете.`,
        `Детето, което улови топката, казва с нежен глас дума или асоциация${kw ? ` по темата „${kw}“` : ' за добро дело или любимо животно'}.`,
        `След това търкаля топката към следващо дете, което седи спокойно и внимава (${durInfo.pacingHint}).`,
      ],
    },
    music: {
      title: kw ? `Музикални статуи: „${kw}“` : 'Танцуващи ноти и замръзнали звездички',
      rhyme: ['Музиката зазвучава – всеки нежно се люлее,', 'щом мелодията спре – никой вече не шава и не пее!', 'Покажи ми чудна поза като приказен герой,', 'най-внимателният тук печели похвала в нашия строй!'],
      steps: [
        `Учителят пуска мелодия или задава ритъм със звънче ${locInfo.spatialHint}.`,
        `Децата се движат пластично в ритъма на музиката${kw ? `, пресъздавайки образи от „${kw}“` : ''}.`,
        `Когато музиката спре, всички замръзват в красива поза до следващия музикален сигнал (${durInfo.pacingHint}).`,
      ],
    },
    paper_pencils: {
      title: kw ? `Рисувана загадка: „${kw}“` : 'Магическият лист и танцуващият молив',
      rhyme: ['Моливчето шарено по листа леко стъпва,', 'точица след точица картинката покълва!', 'Слушай моя тих сигнал – спри, недей да бързаш ти,', 'с приятеля до теб с усмивка чудото довърши!'],
      steps: [
        `Всяко дете получава лист и цветен молив ${locInfo.spatialHint}.`,
        `По гласова инструкция на учителя децата рисуват със затворени очи кръгче, а после го превръщат в ${kw ? `образ от „${kw}“` : 'усмихнато слънчице'}.`,
        `Накрая подреждат рисунките в обща „Пътека на приятелството“ (${durInfo.pacingHint}).`,
      ],
    },
    hoops_ribbons: {
      title: kw ? `Цветни острови: „${kw}“` : 'Вълшебните островчета и шарените дъги',
      rhyme: ['Лентички и обръчи шарени блестят,', 'като цветни острови в нашия чуден свят!', 'Слушай кой цвят викам аз с усмивка и любов,', 'в обръча застани с приятел верен и готов!'],
      steps: [
        `Учителят разполага цветни обръчи и ленти ${locInfo.spatialHint}.`,
        `Децата се движат плавно около обръчите${kw ? ` като откриватели на „${kw}“` : ''}, развявайки лентичките.`,
        `При назоваване на цвят от учителя децата се подреждат около съответния обръч и си подават ръце (${durInfo.pacingHint}).`,
      ],
    },
  };

  const r3 = resGame3Map[filters.resources];

  return [
    {
      id: `g1-${Date.now()}-${v}`,
      title: kw ? `Вълшебният сигнал: „${kw}“` : filters.mood === 'noisy' ? 'Кралят на тишината и перцето на съня' : filters.mood === 'tired' ? 'Събуди мечока с усмивка и лъч' : 'Чуй вълшебния код на капитана',
      subtitle: `Бърза регулираща игра за ${ageInfo.short} (${moodInfo.tag})`,
      tags: ['Подвижно-регулираща', moodInfo.tag, ageInfo.ageRange, locInfo.label],
      badgeColor: 'mint',
      rhymeTitle: '📜 Римуван стих / закачка за старт:',
      rhymeLines: g1Rhyme,
      steps: [
        `Децата се събират ${locInfo.spatialHint}, а учителят прочита четиристишието с артистичен глас.`,
        `Децата изпълняват плавни движения с ${resInfo.toolName}${kw ? ` като герои от „${kw}“` : ''}.`,
        `При тайния сигнал на учителя всички замръзват в усмихната поза и правят 3 спокойни вдишвания (${durInfo.pacingHint}).`,
      ],
      pedagogicalGoal: `Развива самоконтрола, емоционалната саморегулация и ${moodInfo.goalFocus}.`,
      teacherTip: 'Намалете постепенно силата на гласа си на последния стих – децата инстинктивно притихват и се фокусират.',
    },
    {
      id: `g2-${Date.now()}-${v}`,
      title: kw ? `Мисия „${kw}“: Загадките на мъдрата сова` : 'Чудната торбичка на горските приятели',
      subtitle: `Дидактична и словесна игра в ${locInfo.label.toLowerCase()}`,
      tags: ['Дидактична игра', 'Реч и мислене', durInfo.label, resInfo.label],
      badgeColor: 'lavender',
      rhymeTitle: '📜 Гатанка за привличане на вниманието:',
      rhymeLines: [
        'Чук-чук-чук, кой ли се крие в кутията тук?',
        'Дали е мече пухкаво, или пък зайче с мек кожух?',
        'Ослушай се добре, отгатвай смело с мен,',
        'че чака ни вълшебен и усмихнат детски ден!',
      ],
      steps: [
        `Децата сядат в полукръг ${locInfo.spatialHint}. Учителят влиза в ролята на „Пазител на загадките“.`,
        `Учителят описва с 3 жокера предмет или герой${kw ? ` от темата „${kw}“` : ''}, а децата отгатват първо с жест, после с дума.`,
        `Всяко дете, което отгатне, избира следващия участник чрез ${resInfo.toolName} (${durInfo.pacingHint}).`,
      ],
      pedagogicalGoal: 'Обогатяване на активния речник, асоциативното мислене, въображението и умението за изслушване докрай.',
      teacherTip: 'Подайте първия лесен жокер на по-срамежливите деца, за да повишите тяхната увереност.',
    },
    {
      id: `g3-${Date.now()}-${v}`,
      title: r3.title,
      subtitle: `Екипна игра за синхрон и добро настроение (${resInfo.label})`,
      tags: ['Екипност и емпатия', resInfo.label, locInfo.label, ageInfo.ageRange],
      badgeColor: 'coral',
      rhymeTitle: '📜 Римуван сигнал за начало на играта:',
      rhymeLines: r3.rhyme,
      steps: r3.steps,
      pedagogicalGoal: `Развитие на моториката, емпатията, работата по двойки и позитивния микроклимат в групата чрез ${resInfo.toolName}.`,
      teacherTip: 'Приключете с общ тих поздрав с длани, за да запазите спокойния тон за следващия режимен момент.',
    },
  ];
}

export async function generateLessonPreparation(params: { ageGroup: AgeGroup; direction: EducationalDirection; topic: string }, settings: AISettings): Promise<GeneratedLessonPlan> {
  const topic = params.topic.trim() || 'Есен в гората';
  const ageInfo = AGE_GROUP_LABELS[params.ageGroup];
  const dirInfo = DIRECTION_LABELS[params.direction];
  const core = dirInfo.coresByAge[params.ageGroup];

  if (settings.mode === 'api' && settings.apiKey.trim().length > 10) {
    try {
      const prompt = `Ти си методист по предучилищно образование в България (Наредба № 5 - ДОС). Създай разработка на БЪЛГАРСКИ за ${ageInfo.full}, направление ${dirInfo.label}, тема "${topic}". Върни САМО валиден JSON с ключове: topic, ageGroupLabel, directionLabel, educationalCore, totalDuration, goals (3), expectedResults (knowledge, skills, attitudes), materials (3), stages (3 с phase, duration, teacherAction, childrenActivity), story (title, hero, paragraphs (4), moral, discussionQuestions (3)), parentNote (viberHeader, summaryMessage, highlights (3), homeGameTitle, homeGameDescription, closingWarmth).`;
      const raw = await callLLM(prompt, settings);
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]) as GeneratedLessonPlan;
    } catch (e) {
      console.warn('Fallback to Smart Demo Engine:', e);
    }
  }

  await new Promise((r) => setTimeout(r, 1800));
  const t = topic.toLowerCase();

  const hero = t.includes('есен') || t.includes('гора')
    ? 'таралежчето Бодливко и златното листо Листчо'
    : t.includes('космос') || t.includes('планет')
    ? 'малкият астронавт Звезделин и комета Светулка'
    : t.includes('професи')
    ? 'любопитното момченце Марти и вълшебната шапка на майсторите'
    : t.includes('здрав') || t.includes('хран')
    ? 'капитан Морковчо и дружината на Витамините'
    : `любознателното катериче Руменчо – откривателят на „${topic}“`;

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
