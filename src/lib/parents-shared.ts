/** Групите и публикациите за родителите — общи типове и етикети за сървъра и браузъра. */

export const AGE_LABEL: Record<string, string> = { '1': 'I група', '2': 'II група', '3': 'III група (ПГ)', '4': 'IV група (ПГ)' };

export interface GroupView {
  id: string;
  name: string;
  ageGroup: string;
  slug: string;
  /** „II група „Пчелички““ */
  label: string;
  teachers: { id: string; name: string; avatar: string; jobTitle: string }[];
}

export type ParentPostKind = 'NOTICE' | 'LETTER' | 'VERSES';
export type ParentPostStatus = 'PENDING' | 'APPROVED' | 'RETURNED';

export const PARENT_POST_KINDS: { id: ParentPostKind; label: string; hint: string }[] = [
  { id: 'NOTICE', label: 'Обява', hint: 'Среща, събитие, напомняне — с дата, ако има' },
  { id: 'LETTER', label: 'Покана или писмо', hint: 'Писмо до родителите или покана за празник' },
  { id: 'VERSES', label: 'Стихче или песен', hint: 'Какво учим сега — за вкъщи по желание, без домашна работа' },
];
export const PARENT_POST_LABEL: Record<ParentPostKind, string> = { NOTICE: 'Обява', LETTER: 'Покана или писмо', VERSES: 'Стихче или песен' };

export interface ParentPostView {
  id: string;
  kind: ParentPostKind;
  title: string;
  body: string;
  /** „ГГГГ-ММ-ДД“ или null */
  eventDate: string | null;
  groupId: string | null;
  groupLabel: string | null;
  status: ParentPostStatus;
  reviewNote: string | null;
  publishedAt: string | null;
  createdAt: string;
  author: { id: string; name: string; avatar: string };
  mine: boolean;
  /** Има ли материал за печат (писмо или стихчета от „Материали за печат“) */
  hasPrintable: boolean;
}

export function groupLabel(g: { name: string; ageGroup: string }): string {
  const age = AGE_LABEL[g.ageGroup]?.replace(/ \(ПГ\)$/, '') ?? '';
  return `${age} „${g.name}“`.trim();
}

/** Латиница за адреса на групата: „Пчелички“ → „pchelichki“. */
export function slugify(name: string): string {
  const map: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p',
    р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sht', ъ: 'a', ь: 'y', ю: 'yu', я: 'ya',
  };
  const out = name
    .toLowerCase()
    .split('')
    .map((ch) => map[ch] ?? ch)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return out || 'grupa';
}
