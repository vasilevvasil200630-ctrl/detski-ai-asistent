import type { GeneratedGame, GeneratedLessonPlan, LessonDirection, MaterialKind } from '../types';
import { DIRECTION_STANDARDS } from './naredba5';
import { BDP } from './bdp';
import { findHoliday } from './holidays';
import { taskLine } from './gameTasks';
import { blocksText, planBlocksAfter, planBlocksBefore } from './lessonSections';

/** Текстов вид на материалите — за преглед, копиране и печат в библиотеката. */

export const KIND_LABELS: Record<MaterialKind, { label: string; emoji: string }> = {
  GAME: { label: 'Игра', emoji: '🎲' },
  LESSON: { label: 'ДОС план', emoji: '📋' },
  MATERIAL: { label: 'Помощен материал', emoji: '📎' },
};

export const AGE_SHORT: Record<string, string> = { '1': 'I група', '2': 'II група', '3': 'III ПГ', '4': 'IV ПГ' };

export function directionLabel(d: LessonDirection | null | undefined): string | null {
  if (!d) return null;
  return d === 'bdp' ? BDP.label : DIRECTION_STANDARDS[d]?.label ?? null;
}

export function holidayLabel(id: string | null | undefined): string | null {
  const h = findHoliday(id);
  return h ? `${h.emoji} ${h.name}` : null;
}

export function formatGameText(g: GeneratedGame): string {
  return [
    `🎲 ${g.title}`,
    g.subtitle,
    '',
    g.rhymeTitle || '📜 Римуван стих за старт:',
    ...(g.rhymeLines ?? []),
    '',
    '👣 Стъпки:',
    ...(g.steps ?? []).map((s, i) => `${i + 1}. ${s}`),
    '',
    ...(g.tasks?.length ? ['📌 Образователни задачи (Наредба № 5):', ...g.tasks.map((t) => `• ${taskLine(t)}`), ''] : []),
    `🎯 ${g.mode === 'quick' ? 'Полза от играта' : 'Развивани умения по Наредба № 5'}: ${g.pedagogicalGoal}`,
    ...(g.sopAdaptation ? [`🤝 Адаптация за дете със СОП: ${g.sopAdaptation}`] : []),
    ...(g.teacherTip ? [`💡 Съвет: ${g.teacherTip}`] : []),
  ]
    .filter((l) => l !== undefined)
    .join('\n');
}

export function formatPlanText(p: GeneratedLessonPlan): string {
  return [
    `📋 ПЛАН-КОНСПЕКТ НА ПЕДАГОГИЧЕСКА СИТУАЦИЯ`,
    `Тема: „${p.topic}“`,
    `Група: ${p.ageGroupLabel} (${p.totalDuration})`,
    `Образователно направление: ${p.directionLabel}`,
    `Образователно ядро: ${p.educationalCore}`,
    ...(p.situationType ? [`Вид на ситуацията: ${p.situationType}`] : []),
    ...(p.organizationForm ? [`Форма на организация: ${p.organizationForm}`] : []),
    '',
    ...blocksText(planBlocksBefore(p)),
    `ХОД НА СИТУАЦИЯТА:`,
    ...p.stages.map((s) => `${s.phase} (${s.duration})\n  - Учител: ${s.teacherAction}\n  - Деца: ${s.childrenActivity}`),
    '',
    ...blocksText(planBlocksAfter(p)),
  ]
    .join('\n')
    .trim();
}

export function formatStoryText(p: GeneratedLessonPlan): string {
  return [
    `🧚 ПРИКАЗКА: ${p.story.title}`,
    `Главен герой: ${p.story.hero}`,
    '',
    ...p.story.paragraphs,
    '',
    `✨ ${p.story.moral}`,
    '',
    `❓ ВЪПРОСИ ЗА БЕСЕДА:`,
    ...p.story.discussionQuestions.map((q, i) => `${i + 1}. ${q}`),
  ].join('\n');
}

export function formatParentNoteText(p: GeneratedLessonPlan): string {
  return [
    p.parentNote.viberHeader,
    '',
    p.parentNote.summaryMessage,
    '',
    ...p.parentNote.highlights.map((h) => `✅ ${h}`),
    '',
    p.parentNote.homeGameTitle,
    p.parentNote.homeGameDescription,
    '',
    p.parentNote.closingWarmth,
  ].join('\n');
}

function isLessonPlan(c: unknown): c is GeneratedLessonPlan {
  return !!c && typeof c === 'object' && Array.isArray((c as GeneratedLessonPlan).stages) && !!(c as GeneratedLessonPlan).story;
}
function isGame(c: unknown): c is GeneratedGame {
  return !!c && typeof c === 'object' && Array.isArray((c as GeneratedGame).steps);
}

/** Цялото съдържание като текст, раздели с празен ред между тях. */
export function materialToText(kind: MaterialKind, content: unknown): string {
  if (content && typeof content === 'object' && typeof (content as { text?: unknown }).text === 'string') {
    return (content as { text: string }).text;
  }
  if (kind === 'LESSON' && isLessonPlan(content)) {
    return [formatPlanText(content), formatStoryText(content), `💌 БЕЛЕЖКА ЗА РОДИТЕЛИТЕ\n${formatParentNoteText(content)}`].join('\n\n────────\n\n');
  }
  if (kind === 'GAME' && isGame(content)) return formatGameText(content);
  return '';
}
