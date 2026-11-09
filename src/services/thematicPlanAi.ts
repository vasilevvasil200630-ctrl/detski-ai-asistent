import type { AgeGroup } from '../types';
import { AGE_GROUP_STANDARDS, DIRECTION_STANDARDS, naredba5PromptRules } from './naredba5';
import { resultsForGroup } from './naredba5Results';
import { cleanSituations, demoTheme, weeklySlots, type PlanSituation } from './thematicPlan';

/** Промптовете и вграденият двигател за предложенията в тематичното разпределение. */

type WeekInfo = { week: number; startDate: string; endDate: string; holidays: { name: string }[] };

export function themesPrompt(ageGroup: AgeGroup, weeks: WeekInfo[]): string {
  const g = AGE_GROUP_STANDARDS[ageGroup];
  return `Ти си опитен учител в българска детска градина и правиш годишно тематично разпределение за ${g.name} (${g.ageRange}).
${naredba5PromptRules(ageGroup)}

Предложи по ЕДНА кратка тема на седмицата (2–6 думи, на български) за всяка учебна седмица по-долу. Темите следват сезоните,
празниците в съответната седмица (ако има — темата е свързана с празника), ритмично се редуват (природа, семейство и общество,
празници и традиции, безопасност, професии, изкуство) и са подходящи за възрастта. Не повтаряй една и съща тема.
Седмици:
${weeks.map((w) => `${w.week}) ${w.startDate} – ${w.endDate}${w.holidays.length ? ` · празници: ${w.holidays.map((h) => h.name).join(', ')}` : ''}`).join('\n')}

Върни САМО валиден JSON масив (без markdown): [{"week":1,"theme":"…"}, …]`;
}

export function weekPrompt(ageGroup: AgeGroup, week: WeekInfo & { theme: string }): string {
  const g = AGE_GROUP_STANDARDS[ageGroup];
  const slots = weeklySlots(ageGroup);
  const lists = slots
    .map(({ direction, count }) => {
      const cores = resultsForGroup(direction, ageGroup)
        .map((c) => `  Ядро „${c.core}“:\n${c.results.map((r) => `    - ${r}`).join('\n')}`)
        .join('\n');
      return `${DIRECTION_STANDARDS[direction].label} (direction "${direction}") — ${count} ${count === 1 ? 'ситуация' : 'ситуации'}:\n${cores}`;
    })
    .join('\n\n');
  return `Ти си опитен учител в българска детска градина и правиш седмичното разпределение за ${g.name} (${g.ageRange}).
${naredba5PromptRules(ageGroup)}

Седмица ${week.week} (${week.startDate} – ${week.endDate}), тема на седмицата: „${week.theme || 'по избор, според сезона'}“${week.holidays.length ? `; празници: ${week.holidays.map((h) => h.name).join(', ')}` : ''}.
Предложи педагогическите ситуации за седмицата — ТОЧНО толкова по всяко направление, колкото е посочено, всички свързани с темата на седмицата.
За всяка ситуация избери ядро и 1–2 очаквани резултата САМО от списъка по-долу, копирани ДОСЛОВНО, и измисли кратка тема на ситуацията (до 8 думи).

${lists}

Върни САМО валиден JSON масив (без markdown): [{"direction":"math","core":"…","topic":"…","results":["…"]}, …]`;
}

/** Седмица без модела: по всяко направление толкова ситуации, колкото е минимумът, с ядрата поред. */
export function demoWeek(ageGroup: AgeGroup, week: { week: number; startDate: string; theme: string; holidays: { name: string }[] }): PlanSituation[] {
  const theme = week.theme || demoTheme(week, week.holidays);
  const out: PlanSituation[] = [];
  for (const { direction, count } of weeklySlots(ageGroup)) {
    const cores = resultsForGroup(direction, ageGroup);
    for (let i = 0; i < count; i++) {
      const c = cores[(week.week + i) % cores.length]!;
      out.push({ direction, core: c.core, topic: `${theme} — ${c.core.toLowerCase()}`, results: [c.results[(week.week + i) % c.results.length]!] });
    }
  }
  return out;
}

/** Слива отговора на модела със седмичния минимум: липсващите ситуации се допълват от вградения двигател. */
export function fitWeek(ageGroup: AgeGroup, raw: unknown, fallback: PlanSituation[]): PlanSituation[] {
  const clean = cleanSituations(ageGroup, raw).filter((s) => s.core && s.topic);
  const out: PlanSituation[] = [];
  for (const { direction, count } of weeklySlots(ageGroup)) {
    const mine = clean.filter((s) => s.direction === direction).slice(0, count);
    const extra = fallback.filter((s) => s.direction === direction).slice(mine.length, count);
    out.push(...mine, ...extra);
  }
  return out;
}
