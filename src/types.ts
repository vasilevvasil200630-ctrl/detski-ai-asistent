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

export interface GameFilterState {
  ageGroup: AgeGroup;
  mood: GroupMood;
  location: PlayLocation;
  duration: PlayDuration;
  resources: PlayResources;
  customTheme?: string;
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
  sopAdaptation?: string;
  teacherTip: string;
}

export interface LessonStage {
  phase: string;
  duration: string;
  teacherAction: string;
  childrenActivity: string;
}

export interface GeneratedLessonPlan {
  topic: string;
  ageGroupLabel: string;
  directionLabel: string;
  educationalCore: string;
  totalDuration: string;
  goals: string[];
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
  kgRole: 'ADMIN' | 'TEACHER';
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
}
