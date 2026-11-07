import { KG } from '../../config/kindergarten';
import type { AgeGroup } from '../../types';
import { LETTER_LABELS, type LetterKind, type ParentLetter } from './types';

/**
 * Вграден генератор на писма до родителите (покана, съобщение, благодарност, молба) — с
 * името на градината и подпис на учителите от групата. Изреченията се въртят, за да не са
 * всички писма еднакви.
 */

type LetterInput = {
  ageGroup: AgeGroup;
  kind: LetterKind;
  topic: string;
  date?: string;
  time?: string;
  place?: string;
  extra?: string;
  groupName?: string;
};

const GROUP_SHORT: Record<AgeGroup, string> = { '1': 'I група', '2': 'II група', '3': 'III подготвителна група', '4': 'IV подготвителна група' };

const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]!;

export function groupLabel(age: AgeGroup, groupName?: string): string {
  const name = groupName?.trim();
  if (name) return name;
  return GROUP_SHORT[age];
}

export function letterSignature(age: AgeGroup, groupName?: string): string {
  return `Учителите на ${groupLabel(age, groupName)}, ${KG.name}, ${KG.village}`;
}

export function buildDemoLetter(input: LetterInput): ParentLetter {
  const topic = input.topic.trim() || (input.kind === 'invitation' ? 'нашия празник' : 'живота в групата');
  const details = [
    ...(input.date ? [{ label: 'Дата', value: input.date }] : []),
    ...(input.time ? [{ label: 'Час', value: input.time }] : []),
    ...(input.place ? [{ label: 'Място', value: input.place }] : []),
  ];
  const extra = input.extra?.trim();
  const signature = letterSignature(input.ageGroup, input.groupName);
  const greeting = pick(['Уважаеми родители,', 'Скъпи родители,', 'Мили мами и татковци, баби и дядовци,']);

  const bodies: Record<LetterKind, { title: string; paragraphs: string[]; closing: string }> = {
    invitation: {
      title: `Покана: ${topic}`,
      paragraphs: [
        pick([
          `Децата от групата подготвят „${topic}“ и с радост ви канят да го споделите с тях.`,
          `С много вълнение ви каним на „${topic}“ — децата репетираха стихчета, песни и танци специално за вас.`,
        ]),
        pick([
          'Вашето присъствие е най-голямата награда за малките артисти.',
          'Елате да се усмихнем заедно и да им покажем колко се гордеем с тях.',
        ]),
        ...(extra ? [extra] : []),
      ],
      closing: 'Очакваме ви с нетърпение!',
    },
    notice: {
      title: `Съобщение: ${topic}`,
      paragraphs: [
        `Бихме искали да ви информираме за „${topic}“.`,
        ...(extra ? [extra] : ['Моля, запознайте се с подробностите по-долу и ни пишете или ни потърсете, ако имате въпроси.']),
        'Благодарим ви за разбирането и съдействието!',
      ],
      closing: 'С уважение,',
    },
    thanks: {
      title: 'Благодарим ви!',
      paragraphs: [
        pick([
          `Сърдечно благодарим за помощта и подкрепата за „${topic}“.`,
          `Искаме да ви кажем едно голямо „Благодаря!“ за участието ви в „${topic}“.`,
        ]),
        'Благодарение на вас децата преживяха много радост и научиха нови неща. Заедно сме по-силни!',
        ...(extra ? [extra] : []),
      ],
      closing: 'С благодарност и уважение,',
    },
    request: {
      title: `Молба: ${topic}`,
      paragraphs: [
        `За предстоящата работа по „${topic}“ ще имаме нужда от вашата помощ.`,
        ...(extra ? [extra] : ['Ако имате възможност, моля, изпратете с детето необходимите материали до посочената дата.']),
        'Всяка помощ е добре дошла — благодарим ви предварително!',
      ],
      closing: 'С благодарност,',
    },
  };

  const b = bodies[input.kind];
  return { type: 'letter', kind: input.kind, title: b.title, greeting, paragraphs: b.paragraphs, details, closing: b.closing, signature };
}

export { LETTER_LABELS };
