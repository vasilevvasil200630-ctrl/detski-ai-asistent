/**
 * Проверка на вграденото съдържание (игри, листове, стихчета, празници, план-конспекти):
 * структура по Наредба № 5, възрастови граници и известни фактологически грешки.
 *
 *   npm run check:content
 *
 * Пуска се след всяка промяна в src/services/. Излиза с код 1 при грешка.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import type { AgeGroup, EducationalDirection, LessonDirection } from '../src/types';
import { AGE_GROUP_STANDARDS, DIRECTION_ORDER, DIRECTION_STANDARDS } from '../src/services/naredba5';
import { expectedResults, isExpectedResult } from '../src/services/naredba5Results';
import { normalizeLessonPlan } from '../src/services/aiValidation';
import { pickCore } from '../src/services/naredba5';
import { SITUATION_TYPE_IDS, SITUATION_TYPES } from '../src/services/lessonParts';
import { buildDirectionGames, coresWithGames } from '../src/services/directionGames';
import { buildDemoLessonPlan } from '../src/services/aiEngine';
import { buildDemoWorksheet, buildWorksheetFromKinds, ANSWER_MAX } from '../src/services/printables/worksheets';
import { buildDemoVerses } from '../src/services/printables/verses';
import { THEMES } from '../src/services/printables/themes';
import { HOLIDAYS } from '../src/services/holidays';
import { holidaysByWeek, orthodoxEaster, schoolWeeks } from '../src/services/thematicPlan';
import type { DemoContext } from '../src/services/demoGames';

const AGES: AgeGroup[] = ['1', '2', '3', '4'];
const DIRS: LessonDirection[] = ['bel', 'math', 'world', 'art', 'music', 'construct', 'pe', 'bdp'];
let fails = 0;
let checks = 0;
function ok(name: string, cond: boolean, extra = '') {
  checks++;
  if (!cond) {
    fails++;
    console.log(`FAIL ${name}${extra ? ` — ${extra}` : ''}`);
  }
}

/* 1. Структура: всяко ядро на всяко направление има поне една вградена игра */
for (const d of DIRECTION_ORDER) {
  const have = coresWithGames(d);
  for (const core of DIRECTION_STANDARDS[d].cores) ok(`${d}: game for core „${core}“`, have.includes(core));
  for (const core of have) ok(`${d}: game core „${core}“ is a real core`, DIRECTION_STANDARDS[d].cores.includes(core));
}

/* 2. Седмичният минимум по направления дава общия минимум за групата (чл. 24 и приложенията) */
for (const a of AGES) {
  const sum = DIRECTION_ORDER.reduce((s, d) => s + DIRECTION_STANDARDS[d].minWeekly[a], 0);
  ok(`group ${a}: weekly minimums sum to ${AGE_GROUP_STANDARDS[a].minWeeklyTotal}`, sum === AGE_GROUP_STANDARDS[a].minWeeklyTotal, String(sum));
}

/* 3. Игрите по направление: три различни, с истинско ядро в целта */
const ctx = (ageGroup: AgeGroup, kw = 'Есен'): DemoContext =>
  ({ ageGroup, ageShort: '', ageRange: '', mood: 'noisy', moodTag: '', moodGoalFocus: '', locLabel: 'Занималня', spatialHint: '', isYard: false, durLabel: '', pacingHint: '', resources: 'none', resLabel: '', toolName: '', kw }) as DemoContext;
for (const d of DIRS) {
  for (const a of AGES) {
    const games = buildDirectionGames(ctx(a), d);
    ok(`${d}/${a}: three different games`, new Set(games.map((g) => g.title)).size === 3);
    for (const g of games) {
      const m = /ядро „([^“]+)“/.exec(g.pedagogicalGoal);
      const host: EducationalDirection = d === 'bdp' ? 'world' : d;
      ok(`${d}/${a}: „${g.title}“ names a real core`, !!m && DIRECTION_STANDARDS[host].cores.includes(m[1]!), g.pedagogicalGoal.slice(0, 80));
    }
  }
}

/* 4. План-конспект без модела: пълна структура, очакваните резултати дословно от наредбата, игра по ядрото */
for (const d of DIRECTION_ORDER) {
  for (const a of AGES) {
    for (const core of DIRECTION_STANDARDS[d].cores) {
      const type = SITUATION_TYPE_IDS[(a.charCodeAt(0) + core.length) % SITUATION_TYPE_IDS.length]!;
      const plan = buildDemoLessonPlan({ ageGroup: a, direction: d, topic: 'Есен в гората', core, situationType: type });
      const name = `${d}/${a}/${core}`;
      if (expectedResults(d, core, a).length) ok(`${name}: has 1–3 expected results`, !!plan.naredbaResults && plan.naredbaResults.length >= 1 && plan.naredbaResults.length <= 3);
      for (const r of plan.naredbaResults ?? []) ok(`${name}: result is verbatim from the Naredba`, isExpectedResult(d, core, a, r), r);
      ok(`${name}: aim, three tasks, methods, assessment`, !!plan.aim && plan.goals.length === 3 && (plan.methods?.length ?? 0) >= 4 && !!plan.assessment && !!plan.differentiation);
      ok(`${name}: tasks are educational, developing, upbringing`, /^Образователна: /.test(plan.goals[0]!) && /^Развиваща: /.test(plan.goals[1]!) && /^Възпитателна: /.test(plan.goals[2]!));
      ok(`${name}: situation type`, plan.situationType === SITUATION_TYPES[type].label);
      ok(`${name}: main part is a concrete game`, /Играта „/.test(plan.stages[1]!.teacherAction));
      // Нищо от другите групи в плана за тази група
      const text = JSON.stringify(plan.stages);
      ok(`${name}: no text meant for other groups`, !/(I|II|III|IV) гр./.test(text), text.match(/.{30}(I|II|III|IV) гр..{10}/)?.[0]);
    }
  }
}
for (const a of AGES) {
  const bdpPlan = buildDemoLessonPlan({ ageGroup: a, direction: 'bdp', topic: '' });
  ok(`bdp/${a}: main part is a road-safety game`, /пешеход|светофар|улица/i.test(bdpPlan.stages[1]!.teacherAction));
  ok(`bdp/${a}: results from the MON programme and the Naredba`, (bdpPlan.naredbaResults?.length ?? 0) === 2);
}
/* 4б. Ядрото по темата: познатите приказки са литературни произведения */
for (const t of ['Житената питка', 'Дядовата ръкавичка', 'Червената шапчица', 'Приказка за ряпата'])
  ok(`bel: „${t}“ is a literary work`, pickCore('bel', t) === 'Възприемане на литературно произведение', pickCore('bel', t));
ok('bel: drama goes to „Пресъздаване“', pickCore('bel', 'Куклен театър „Трите прасенца“') === 'Пресъздаване на литературно произведение');
/* 4в. Отговорът на модела: резултатите се приемат само ако са официалните (запетаите не пречат) */
{
  const fb = buildDemoLessonPlan({ ageGroup: '3', direction: 'math', topic: 'Есен', core: 'Количествени отношения' });
  const raw = { naredbaResults: ['Брои до десет в прав ред.', 'Брои до сто и умножава', 'определя реда на обект в редица от пет предмета'], aim: 'Цел.', goals: ['а', 'б', 'в'] };
  const p = normalizeLessonPlan(raw, fb, { direction: 'math', coreChosen: true, ageGroup: '3' });
  ok('model: invented result dropped, official text kept', JSON.stringify(p.naredbaResults) === JSON.stringify(['Брои до десет в прав ред', 'Определя реда на обект в редица от пет предмета']), JSON.stringify(p.naredbaResults));
  const none = normalizeLessonPlan({ naredbaResults: ['Нещо измислено'] }, fb, { direction: 'math', coreChosen: true, ageGroup: '3' });
  ok('model: no valid result → built-in selection', JSON.stringify(none.naredbaResults) === JSON.stringify(fb.naredbaResults));
  const other = normalizeLessonPlan({ educationalCore: 'Измерване', naredbaResults: [] }, fb, { direction: 'math', coreChosen: false, ageGroup: '3' });
  ok('model: other core → results of that core', other.educationalCore === 'Измерване' && (other.naredbaResults ?? []).every((r) => isExpectedResult('math', 'Измерване', '3', r)) && (other.naredbaResults?.length ?? 0) > 0);
}

/* 5. Работни листове: числата и звуковете по групи */
for (const a of AGES) {
  for (let k = 0; k < 60; k++) {
    const d = DIRS[k % DIRS.length]!;
    const ws = k % 2 ? buildDemoWorksheet(a, d, k % 3 ? 'Есен' : 'Зима') : buildWorksheetFromKinds(a, d, 'Пролет', ['count', 'match', 'sound', 'sequence']);
    for (const t of ws.tasks) {
      if (t.kind === 'count') {
        ok(`${a}: count up to ${ANSWER_MAX[a]}`, t.max === ANSWER_MAX[a] && t.groups.every((g) => g.count >= 1 && g.count <= ANSWER_MAX[a]));
        ok(`${a}: count answers with ${a === '1' || a === '2' ? 'dots' : 'digits'}`, Boolean(t.dots) === (a === '1' || a === '2'));
      }
      if (t.kind === 'match') {
        const digits = t.pairs.filter((p) => /^\d+$/.test(p.right.e));
        ok(`${a}: no digits before III group`, !(a === '1' || a === '2') || digits.length === 0);
        ok(`${a}: digits within ${ANSWER_MAX[a]}`, digits.every((p) => Number(p.right.e) <= ANSWER_MAX[a]));
      }
      if (t.kind === 'sound') {
        ok(`${a}: first-sound task only in IV group`, a === '4');
        ok(`${a}: sound is one sound`, !['Я', 'Ю', 'Щ', 'Ь', 'Ъ'].includes(t.sound), t.sound);
        ok(`${a}: sound pics really start with the sound (≥2)`, t.pics.filter((p) => p.w.charAt(0).toUpperCase() === t.sound).length >= 2);
      }
      if (t.kind === 'sequence') ok('no rhombus (not in the standard)', t.pattern.every((p) => p.w !== 'ромб'));
    }
  }
}

/* 5б. Имената на направленията — с главна буква */
for (const d of DIRECTION_ORDER) {
  const ws = buildDemoWorksheet('2', d, '');
  ok(`${d}: worksheet title keeps the capital letter`, ws.title.includes(DIRECTION_STANDARDS[d].label), ws.title);
}

/* 6. Стихчета и гатанки: гатанките имат отговор, броят е по групата */
for (const a of AGES) {
  for (const kind of ['poem', 'riddles', 'counting', 'tongue'] as const) {
    const v = buildDemoVerses(a, kind, 'Есен');
    ok(`${a}/${kind}: has content`, v.pieces.length > 0 || v.riddles.length > 0);
    if (kind === 'riddles') ok(`${a}: riddles have answers`, v.riddles.every((r) => r.answer.trim().length > 1));
  }
}

/* 6б. „Огради излишното“: трите картинки са от една тема, излишната — не (и при тема без съвпадение) */
for (const topic of ['Моето тяло', 'Есен', 'Плодове', 'Вода', 'Лято', 'Играчки', 'Музика', 'Космос']) {
  for (let i = 0; i < 25; i++) {
    const task = buildWorksheetFromKinds('3', 'world', topic, ['odd']).tasks[0];
    if (task?.kind !== 'odd') {
      ok(`odd/${topic}: task built`, false);
      continue;
    }
    for (const row of task.rows) {
      const rest = row.items.filter((_, k) => k !== row.odd).map((p) => p.e);
      const odd = row.items[row.odd]!;
      const group = THEMES.find((t) => rest.every((e) => t.pics.some((p) => p.e === e)));
      ok(`odd/${topic}: the three pictures share a theme`, !!group, rest.join(' '));
      if (group) ok(`odd/${topic}: „${odd.w}“ is not from „${group.id}“`, !group.pics.some((p) => p.e === odd.e));
    }
  }
}

/* 7. Празници и календар */
const easter = (y: number) => orthodoxEaster(y).toISOString().slice(0, 10);
ok('Orthodox Easter 2025', easter(2025) === '2025-04-20', easter(2025));
ok('Orthodox Easter 2026', easter(2026) === '2026-04-12', easter(2026));
ok('Orthodox Easter 2027', easter(2027) === '2027-05-02', easter(2027));
ok('Orthodox Easter 2028', easter(2028) === '2028-04-16', easter(2028));
for (const year of [2025, 2026, 2027]) {
  const weeks = schoolWeeks(year);
  ok(`${year}: school weeks start on/after 15 September`, weeks[0]!.startDate >= `${year}-09-15`);
  ok(`${year}: school weeks end by 31 May`, weeks[weeks.length - 1]!.endDate <= `${year + 1}-05-31`);
  const placed = new Set([...holidaysByWeek(year).values()].flat().map((h) => h.id));
  // 1 и 2 юни са след учебното време (31 май) — отбелязват се, но не са в учебна седмица
  for (const h of HOLIDAYS) if (h.id !== '1-yuni' && h.id !== 'botev') ok(`${year}: holiday „${h.name}“ is in a school week`, placed.has(h.id));
}
for (const id of ['treti-mart', '24-mai', 'levski', 'botev', 'nezavisimost', 'buditeli']) ok(`holiday ${id} exists`, HOLIDAYS.some((h) => h.id === id));

/* 8. Известни грешки не бива да се връщат; без латински букви в думи на кирилица */
const files: string[] = [];
const walk = (dir: string) => {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.ts$/.test(f)) files.push(p);
  }
};
walk(join(__dirname, '../src/services'));
const BANNED: [RegExp, string][] = [
  [/ябълк[аи][^'\n]{0,30}(на гърба|носи)/i, 'таралежът не носи ябълки на бодлите си'],
  [/пресичай бавно/i, 'на жълто не се пресича'],
  [/жълто\s*[—–-]\s*готови/i, 'пешеходците тръгват само на зелено'],
  [/три,? и пет/i, 'броилките не прескачат числа'],
  [/(?<!тика)[\s—–-]так[!.,]/,'руската дума „так“ (на български: „така“)'],
  [/мляко обича/i, 'котките не бива да пият мляко'],
  [/'ромб'/, 'ромбът не е в очакваните резултати за предучилищна възраст'],
];
for (const f of files) {
  const s = readFileSync(f, 'utf8').replace(/\\[nrt]/g, ' ');
  for (const [re, why] of BANNED) ok(`${f.split(/[\\/]/).pop()}: ${why}`, !re.test(s));
  const mixed = s.match(/[А-Яа-я]+[A-Za-z]+[А-Яа-я]*|[A-Za-z]+[А-Яа-я]+/g)?.filter((w) => !/^[A-Za-z]+$/.test(w)) ?? [];
  ok(`${f.split(/[\\/]/).pop()}: no mixed Latin/Cyrillic words`, mixed.length === 0, mixed.slice(0, 5).join(', '));
}

console.log(`${checks} checks, ${fails === 0 ? 'ALL PASSED' : `${fails} FAILED`}`);
process.exit(fails ? 1 : 0);
