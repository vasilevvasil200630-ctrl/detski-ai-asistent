export type AgeGroup = '1' | '2' | '3' | '4';
export type GroupMood = 'noisy' | 'tired' | 'distracted';
export type PlayLocation = 'classroom' | 'music_hall' | 'yard';
export type PlayDuration = '5' | '15' | '30';
export type PlayResources = 'none' | 'balls' | 'music' | 'paper_pencils' | 'hoops_ribbons';
export type EducationalDirection = 'bel' | 'world' | 'math' | 'art' | 'music' | 'construct' | 'pe';
/** Седемте направления по Наредба № 5 + БДП (интегрирано, по програмите на МОН). */
export type LessonDirection = EducationalDirection | 'bdp';
export type AppModule = 'games' | 'hub' | 'dos' | 'prompts';
export type PromptCategory = 'all' | 'dos_planning' | 'holidays' | 'parents' | 'inclusion_emotions' | 'portfolio';

export interface Kindergarten {
  id: string;
  name: string;
  city: string;
  motto: string;
}

export interface TeacherProfile {
  id: string;
  name: string;
  role: string;
  ageGroup: AgeGroup;
  groupName: string;
  avatar: string;
  kindergartenId: string;
}

export interface SavedBankGame {
  id: string;
  kindergartenId: string;
  kindergartenName: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorGroupName: string;
  ageGroup: AgeGroup;
  mood: GroupMood;
  location: PlayLocation;
  resources: PlayResources;
  createdAt: string;
  likes: number;
  likedByMe?: boolean;
  game: GeneratedGame;
}

export interface GoldenPromptItem {
  id: string;
  title: string;
  category: Exclude<PromptCategory, 'all'>;
  categoryLabel: string;
  savedMinutes: number;
  badgeColor: 'mint' | 'lavender' | 'sunshine' | 'coral';
  whyItWorks: string;
  placeholderLabel: string;
  defaultPlaceholderValue: string;
  buildPromptText: (ageGroupLabel: string, customInput: string) => string;
  buildSampleResult: (ageGroupLabel: string, customInput: string) => { title: string; content: string[]; tip: string };
}

/**
 * Режим на играта: бърза (без образователни задачи), към тема (0–3 задачи по избор)
 * или ситуация по ДОС (1–3 задължителни задачи).
 */
export type GameMode = 'quick' | 'theme' | 'dos';

/** Образователна задача, избрана от учителя: очакван резултат по Наредба № 5 (или тема по БДП). */
export interface GameTask {
  direction: LessonDirection;
  /** Образователното ядро (за БДП — темата от програмата на МОН) */
  core: string;
  /** Очакваният резултат точно както е в наредбата (за БДП — по програмата) */
  result: string;
}

export interface GameFilterState {
  /** Липсва при старите заявки — значи „theme“ */
  mode?: GameMode;
  /** Избраните от учителя задачи (празно при „quick“) */
  tasks?: GameTask[];
  ageGroup: AgeGroup;
  mood: GroupMood;
  location: PlayLocation;
  duration: PlayDuration;
  resources: PlayResources;
  /** Темата, която групата е взела (или тема по желание) */
  customTheme?: string;
  /** Направление по Наредба № 5 или БДП; „mixed“ — смесени игри според настроението и материалите */
  direction?: LessonDirection | 'mixed';
}

export interface GeneratedGame {
  id: string;
  title: string;
  subtitle: string;
  tags: string[];
  badgeColor: 'mint' | 'lavender' | 'sunshine' | 'coral';
  rhymeTitle: string;
  rhymeLines: string[];
  steps: string[];
  pedagogicalGoal: string;
  /** Режимът, в който е създадена играта */
  mode?: GameMode;
  /** Образователните задачи, избрани от учителя (по Наредба № 5) */
  tasks?: GameTask[];
  /** Материалите към играта: работен лист, карти, стихче за стената, бележка, пособия */
  kit?: import('./services/printables/types').GameKit;
  sopAdaptation?: string;
  teacherTip: string;
}

export interface LessonStage {
  phase: string;
  duration: string;
  teacherAction: string;
  childrenActivity: string;
}

/** Вид на педагогическата ситуация според дидактическата ѝ задача. */
export type SituationType = 'new' | 'practice' | 'summary' | 'check';

export interface GeneratedLessonPlan {
  topic: string;
  ageGroupLabel: string;
  directionLabel: string;
  educationalCore: string;
  totalDuration: string;
  /** Вид на ситуацията, напр. „Ситуация за нови знания“ (по-старите планове го нямат). */
  situationType?: string;
  /** Целта — едно изречение. Когато я има, `goals` са задачите (образователна, развиваща, възпитателна). */
  aim?: string;
  goals: string[];
  /** Очакваните резултати дословно от Наредба № 5 за ядрото и групата (по-старите планове ги нямат). */
  naredbaResults?: string[];
  /** Откъде са резултатите, напр. „Наредба № 5, приложение № 2, ядро „Измерване““. */
  resultsSource?: string;
  /** Методи и похвати. */
  methods?: string[];
  /** Как учителят проверява дали децата са постигнали резултатите. */
  assessment?: string;
  /** Подход към дете със СОП и към децата, които напредват по-бързо. */
  differentiation?: string;
  expectedResults: { knowledge: string; skills: string; attitudes: string };
  materials: string[];
  stages: LessonStage[];
  /** Връзки с други образователни направления (интегриран подход). */
  integrativeLinks?: string[];
  /** Форма на организация: фронтална, групова или индивидуална. */
  organizationForm?: string;
  /** Познавателна книжка от „Златно ключе“ („Бит и техника“), ако има за направлението. */
  programMaterial?: string;
  story: { title: string; hero: string; paragraphs: string[]; moral: string; discussionQuestions: string[] };
  parentNote: { viberHeader: string; summaryMessage: string; highlights: string[]; homeGameTitle: string; homeGameDescription: string; closingWarmth: string };
}


/** Влезлият учител (от /api/auth/me). */
export interface SessionTeacher {
  id: string;
  email: string;
  name: string;
  avatar: string;
  jobTitle: string;
  ageGroup: AgeGroup;
  groupName: string;
  /** Кратко представяне за публичната витрина */
  showcaseBio: string;
  kgRole: 'ADMIN' | 'TEACHER';
  /** Влязла е с временна парола от директора */
  mustChangePassword: boolean;
  kindergarten: { id: string; name: string; city: string; motto: string; joinCode: string } | null;
}

/** Вид материал в библиотеката: игра, ДОС план или помощен материал. */
export type MaterialKind = 'GAME' | 'LESSON' | 'MATERIAL';

/** Материал от библиотеката на учителя (собствен или споделен от колега). */
export interface SavedMaterial {
  id: string;
  kind: MaterialKind;
  title: string;
  ageGroup: AgeGroup;
  direction: LessonDirection | null;
  core: string | null;
  holiday: string | null;
  meta: Record<string, unknown> | null;
  /** GeneratedGame, GeneratedLessonPlan или { text } */
  content: unknown;
  shared: boolean;
  /** Моят ли е (мога да го споделя/изтривам) */
  mine: boolean;
  authorName: string;
  authorAvatar: string;
  authorGroupName: string;
  createdAt: string;
  likes: number;
  likedByMe: boolean;
  copiedFromId: string | null;
  /** „Изпитано с деца“: кога и как е минало (null — още не е отбелязано) */
  tried: { at: string; note: string } | null;
}
