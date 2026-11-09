import type { AgeGroup, LessonDirection } from '../../types';

/**
 * Материали за печат: работни листове, стихчета/гатанки/броилки и писма до родителите.
 * Грамотите и дипломите се попълват в браузъра (имената на децата не отиват на сървъра).
 */
export type PrintableType = 'worksheet' | 'verses' | 'letter';

/** Картинка в работния лист — емоджи и думата за него (думата е за учителя и за задачите със звук). */
export type Pic = { e: string; w: string };

/** Клетка от „Открий разликите“: картинка (по желание по-голяма) или празно място. */
export type DiffCell = (Pic & { big?: boolean }) | null;

/** Рисунките за „Дорисувай половината“ (виж drawings.ts). */
export type HalfShapeId = 'house' | 'tree' | 'heart' | 'butterfly' | 'apple' | 'mushroom' | 'tulip' | 'rocket' | 'car' | 'owl';

export type WorksheetTask =
  /** Преброй картинките и огради числото */
  | { kind: 'count'; prompt: string; groups: { pic: Pic; count: number }[]; max: number }
  /** Свържи с линия */
  | { kind: 'match'; prompt: string; pairs: { left: Pic; right: Pic }[] }
  /** Огради излишното във всеки ред */
  | { kind: 'odd'; prompt: string; rows: { items: Pic[]; odd: number }[] }
  /** Продължи редицата */
  | { kind: 'sequence'; prompt: string; pattern: Pic[]; repeat: number }
  /** Следвай пунктира (подготовка за писане) */
  | { kind: 'trace'; prompt: string; shape: 'line' | 'arches' | 'wave' | 'zigzag' | 'loops'; start: Pic; end: Pic }
  /** Огради картинките, чиито имена започват със звука */
  | { kind: 'sound'; prompt: string; sound: string; pics: Pic[] }
  /** Нарисувай / оцвети в рамката */
  | { kind: 'draw'; prompt: string }
  /** Лабиринт: клетките са цифри 0–3 (+1 стена вдясно, +2 стена отдолу); вход горе вляво, изход долу вдясно */
  | { kind: 'maze'; prompt: string; cols: number; rows: number; walls: string; start: Pic; end: Pic }
  /** Открий разликите: две сцени с еднакво разположение, в дясната има `count` разлики */
  | { kind: 'differences'; prompt: string; cols: number; rows: number; left: DiffCell[]; right: DiffCell[]; count: number }
  /** Дорисувай половината: по пунктира (I–II гр.) или по точките в мрежа (III–IV гр.) */
  | { kind: 'half'; prompt: string; shape: HalfShapeId; mode: 'trace' | 'grid' };

export interface Worksheet {
  type: 'worksheet';
  title: string;
  ageGroup: AgeGroup;
  direction: LessonDirection;
  topic: string;
  tasks: WorksheetTask[];
  /** Бележка за учителя: цел по Наредба № 5 и отговори */
  teacherNote: string;
}

export type VersesKind = 'poem' | 'riddles' | 'counting' | 'tongue';

export interface VersesSheet {
  type: 'verses';
  kind: VersesKind;
  title: string;
  topic: string;
  ageGroup: AgeGroup;
  /** Стихчета, броилки или скоропоговорки */
  pieces: { title?: string; lines: string[] }[];
  /** Гатанки с отговорите (отговорите се печатат на гърба / за учителя) */
  riddles: { lines: string[]; answer: string }[];
  note?: string;
}

export type LetterKind = 'invitation' | 'notice' | 'thanks' | 'request';

export interface ParentLetter {
  type: 'letter';
  kind: LetterKind;
  title: string;
  greeting: string;
  paragraphs: string[];
  details: { label: string; value: string }[];
  closing: string;
  signature: string;
}

export type Printable = Worksheet | VersesSheet | ParentLetter;

/** Какъв работен лист: смесен по направлението или цял лист от една рисувана задача. */
export type WorksheetStyle = 'mixed' | 'maze' | 'differences' | 'half';

export const WORKSHEET_STYLE_LABELS: Record<WorksheetStyle, string> = {
  mixed: 'Смесени задачи',
  maze: 'Лабиринти',
  differences: 'Открий разликите',
  half: 'Дорисувай половината',
};

/** Параметрите за генериране — едни и същи за сървъра и за вградения двигател. */
export type PrintableRequest =
  | { type: 'worksheet'; ageGroup: AgeGroup; direction: LessonDirection; topic: string; style?: WorksheetStyle }
  | { type: 'verses'; ageGroup: AgeGroup; kind: VersesKind; topic: string }
  | {
      type: 'letter';
      ageGroup: AgeGroup;
      kind: LetterKind;
      topic: string;
      date?: string;
      time?: string;
      place?: string;
      extra?: string;
      groupName?: string;
    };

export const VERSES_LABELS: Record<VersesKind, string> = {
  poem: 'Стихчета',
  riddles: 'Гатанки',
  counting: 'Броилки',
  tongue: 'Скоропоговорки',
};

export const LETTER_LABELS: Record<LetterKind, string> = {
  invitation: 'Покана за празник или събитие',
  notice: 'Съобщение до родителите',
  thanks: 'Благодарствено писмо',
  request: 'Молба за материали или помощ',
};

export const PRINTABLE_TYPE_LABELS: Record<PrintableType, string> = {
  worksheet: 'Работен лист',
  verses: 'Стихчета и гатанки',
  letter: 'Писмо до родителите',
};

/* ───────────────────────── Комплект към играта ───────────────────────── */

/** Вид задача в работния лист — учителят избира кои да влязат. */
export type SheetKind = WorksheetTask['kind'];

export const SHEET_KIND_LABELS: Record<SheetKind, string> = {
  count: 'Преброй и огради',
  match: 'Свържи с линия',
  odd: 'Огради излишното',
  sequence: 'Продължи редицата',
  trace: 'По пунктира',
  sound: 'Първият звук (III–IV гр.)',
  draw: 'Нарисувай и оцвети',
  maze: 'Лабиринт',
  differences: 'Открий разликите',
  half: 'Дорисувай половината',
};

/** Карти с картинки за изрязване (за самата игра). */
export interface PictureCards {
  title: string;
  cards: Pic[];
}

/** Бележка до родителите след играта (играта вкъщи е само по желание — чл. 32). */
export interface KitParentNote {
  title: string;
  paragraphs: string[];
  homeIdea?: string;
}

/** Части на комплекта, които учителят отмята. */
export type KitPart = 'worksheet' | 'cards' | 'poster' | 'parent' | 'supplies';

export const KIT_PART_LABELS: Record<KitPart, { label: string; hint: string }> = {
  worksheet: { label: 'Работен лист', hint: 'Задачи към играта — изберете кои' },
  cards: { label: 'Карти с картинки', hint: '8 карти за изрязване за самата игра' },
  poster: { label: 'Стихчето за стената', hint: 'Римуваният стих на цял лист, с едри букви' },
  parent: { label: 'Бележка до родителите', hint: 'Какво играхме и идея за вкъщи по желание' },
  supplies: { label: 'Списък с пособия', hint: 'Какво да приготвите преди играта' },
};

export const KIT_PART_ORDER: KitPart[] = ['worksheet', 'cards', 'poster', 'parent', 'supplies'];

/** Комплектът към играта: всяка част е по желание на учителя. */
export interface GameKit {
  worksheet?: Worksheet;
  cards?: PictureCards;
  poster?: boolean;
  parentNote?: KitParentNote;
  supplies?: string[];
}
