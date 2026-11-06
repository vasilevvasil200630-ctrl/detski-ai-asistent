'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Zap,
  Sparkles,
  BookOpen,
  ClipboardList,
  HeartHandshake,
  Copy,
  Check,
  Printer,
  Columns,
  Maximize2,
  CheckCircle2,
  Clock,
  HelpCircle,
  Home,
  Volume2,
  RefreshCw,
} from 'lucide-react';
import {
  AgeGroup,
  EducationalDirection,
  GeneratedLessonPlan,
} from '../types';
import {
  AGE_GROUP_LABELS,
  AiSource,
  DIRECTION_LABELS,
  generateLessonPreparation,
} from '../services/aiEngine';

interface LiveDosModuleProps {
  /** Групата на влезлия учител (по подразбиране III група) */
  defaultAgeGroup?: AgeGroup;
  onTimeSaved: (minutes: number) => void;
  projectorMode: boolean;
}

const AGE_GROUPS: { id: AgeGroup; label: string; badge: string }[] = [
  { id: '1', label: '1-ва група (3-4 г.)', badge: '15 мин.' },
  { id: '2', label: '2-ра група (4-5 г.)', badge: '20 мин.' },
  { id: '3', label: '3-та група (5-6 г.)', badge: '25 мин.' },
  { id: '4', label: '4-та група (6-7 г.)', badge: '30 мин.' },
];

const DIRECTIONS: { id: EducationalDirection; label: string; emoji: string }[] = [
  { id: 'bel', label: 'Български език и литература', emoji: '📖' },
  { id: 'world', label: 'Околен свят', emoji: '🌍' },
  { id: 'math', label: 'Математика', emoji: '🔢' },
  { id: 'art', label: 'Изобразително изкуство', emoji: '🎨' },
  { id: 'music', label: 'Музика', emoji: '🎵' },
  { id: 'construct', label: 'Конструиране и технологии', emoji: '🧱' },
];

const QUICK_TOPICS: { label: string; topic: string; direction?: EducationalDirection }[] = [
  { label: '🍂 Есен в гората', topic: 'Есен в гората' },
  { label: '🚒 Професии', topic: 'Професии и мечтатели' },
  { label: '🚀 Космос и планети', topic: 'Пътешествие в Космоса' },
  { label: '🥦 Здравословно хранене', topic: 'Здравословно хранене и витамини' },
  { label: '🦖 Динозаври', topic: 'Светът на добрите динозаври' },
  { label: '💧 Пътят на капчицата', topic: 'Пътят на водната капчица' },
  { label: '🇧🇬 Моята България', topic: 'Моята красива България и родни традиции' },
  { label: '🐝 Пчеличките и цветята', topic: 'Трудолюбивите пчелички и пролетните цветя' },
];

export const LiveDosModule: React.FC<LiveDosModuleProps> = ({
  defaultAgeGroup,
  onTimeSaved,
  projectorMode,
}) => {
  const [ageGroup, setAgeGroup] = useState<AgeGroup>(defaultAgeGroup ?? '3');
  const [source, setSource] = useState<AiSource | null>(null);
  useEffect(() => {
    if (defaultAgeGroup) setAgeGroup(defaultAgeGroup);
  }, [defaultAgeGroup]);
  const [direction, setDirection] = useState<EducationalDirection>('world');
  const [topic, setTopic] = useState<string>('Есен в гората');

  const [isGenerating, setIsGenerating] = useState(false);
  const [thinkingPhase, setThinkingPhase] = useState(0);
  const [plan, setPlan] = useState<GeneratedLessonPlan | null>(null);
  const [viewMode, setViewMode] = useState<'columns' | 'tabs'>('columns');
  const [activeTab, setActiveTab] = useState<'plan' | 'story' | 'parents'>('plan');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [isSpeakingStory, setIsSpeakingStory] = useState(false);

  const panelsContainerRef = useRef<HTMLDivElement>(null);

  const thinkingSteps = [
    'Синхронизиране с ДОС (Наредба № 5) – извличане на образователно ядро, цели и очаквани резултати...',
    'Създаване на авторска приказка с главен герой и въпроси за педагогическа беседа...',
    'Оформяне на топла бележка за родителите (Viber / Табло) с 5-минутна семейна игра...',
  ];

  // Synchronize activeTab if browser's native Ctrl+F "Find in page" matches text inside a hidden="until-found" panel
  useEffect(() => {
    const container = panelsContainerRef.current;
    if (!container) return;

    if (typeof HTMLElement !== 'undefined' && !('onbeforematch' in HTMLElement.prototype)) {
      container.querySelectorAll('[hidden="until-found"]').forEach((el) => {
        el.removeAttribute('hidden');
      });
      return;
    }

    const handleBeforeMatch = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const panelEl = target.closest('[data-dos-panel]') as HTMLElement | null;
      const panelKey = panelEl?.getAttribute('data-dos-panel') as 'plan' | 'story' | 'parents' | null;
      if (panelKey) {
        setActiveTab(panelKey);
      }
    };

    container.addEventListener('beforematch', handleBeforeMatch);
    return () => container.removeEventListener('beforematch', handleBeforeMatch);
  }, [plan, viewMode]);

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const targetTopic = topic.trim() || 'Есен в гората';
    if (!topic.trim()) setTopic(targetTopic);

    setIsGenerating(true);
    setThinkingPhase(0);

    const interval = setInterval(() => {
      setThinkingPhase((prev) => (prev + 1) % 3);
    }, 750);

    try {
      const result = await generateLessonPreparation({ ageGroup, direction, topic: targetTopic });
      setPlan(result.plan);
      setSource(result.source);
      onTimeSaved(45);
    } finally {
      clearInterval(interval);
      setIsGenerating(false);
    }
  };

  const copyText = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedSection(key);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const formatPlanText = (p: GeneratedLessonPlan) =>
    [
      `📋 ПЛАН-КОНСПЕКТ НА ПЕДАГОГИЧЕСКА СИТУАЦИЯ`,
      `Тема: „${p.topic}“`,
      `Група: ${p.ageGroupLabel} (${p.totalDuration})`,
      `Образователно направление: ${p.directionLabel}`,
      `Образователно ядро: ${p.educationalCore}`,
      '',
      `🎯 ЦЕЛИ:`,
      ...p.goals.map((g, i) => `${i + 1}. ${g}`),
      '',
      `📌 ОЧАКВАНИ РЕЗУЛТАТИ (ДОС):`,
      `• Знания: ${p.expectedResults.knowledge}`,
      `• Умения: ${p.expectedResults.skills}`,
      `• Отношения: ${p.expectedResults.attitudes}`,
      '',
      `🧰 НЕОБХОДИМИ МАТЕРИАЛИ:`,
      ...p.materials.map((m) => `• ${m}`),
      '',
      `⏱️ ХОД НА СИТУАЦИЯТА ПО МИНУТИ:`,
      ...p.stages.map(
        (s) =>
          `${s.phase} (${s.duration})\n  - Дейност на учителя: ${s.teacherAction}\n  - Дейност на децата: ${s.childrenActivity}`
      ),
    ].join('\n');

  const formatStoryText = (p: GeneratedLessonPlan) =>
    [
      `🧚 АВТОРСКА ПРИКАЗКА КЪМ ТЕМАТА „${p.topic.toUpperCase()}“`,
      `Заглавие: ${p.story.title}`,
      `Главен герой: ${p.story.hero}`,
      '',
      ...p.story.paragraphs,
      '',
      `✨ ${p.story.moral}`,
      '',
      `❓ ВЪПРОСИ ЗА БЕСЕДА С ДЕЦАТА:`,
      ...p.story.discussionQuestions.map((q, i) => `${i + 1}. ${q}`),
    ].join('\n\n');

  const formatParentNoteText = (p: GeneratedLessonPlan) =>
    [
      p.parentNote.viberHeader,
      '',
      p.parentNote.summaryMessage,
      '',
      `📌 Какво научихме и преживяхме днес:`,
      ...p.parentNote.highlights.map((h) => `✅ ${h}`),
      '',
      p.parentNote.homeGameTitle,
      p.parentNote.homeGameDescription,
      '',
      p.parentNote.closingWarmth,
    ].join('\n');

  const handleSpeakStory = () => {
    if (!plan || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    if (isSpeakingStory) {
      setIsSpeakingStory(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(
      `${plan.story.title}. ${plan.story.paragraphs.join(' ')} ${plan.story.moral}`
    );
    utterance.lang = 'bg-BG';
    utterance.rate = 0.94;
    utterance.onend = () => setIsSpeakingStory(false);
    utterance.onerror = () => setIsSpeakingStory(false);
    setIsSpeakingStory(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <section aria-label="Жива демонстрация: Пълна подготовка по ДОС" className="space-y-8">
      {/* Hero Banner for Module 2 */}
      <div className="rounded-3xl bg-gradient-to-r from-violet-700 via-purple-600 to-rose-500 p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-56 h-56 rounded-full bg-amber-300/20 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-white/20 text-white backdrop-blur-sm">
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              УАУ демонстрация на живо с публиката
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold mt-2">
              🚀 „Пълна подготовка за 10 секунди“ (Генератор по ДОС)
            </h2>
            <p className="text-violet-100 text-sm sm:text-base mt-1 max-w-3xl">
              Попитайте колегите в залата за произволна тема за следващата седмица, въведете я тук и
              генерирайте едновременно план-конспект по ДОС, авторска приказка и бележка за родителите!
            </p>
          </div>
          <div className="bg-black/20 backdrop-blur-sm px-4 py-3 rounded-2xl border border-white/15 text-xs font-bold space-y-1 shrink-0">
            <div className="text-amber-200 uppercase tracking-wider">Съответствие със стандарта:</div>
            <div>✅ Наредба № 5 за предучилищното образование</div>
            <div>✅ Готово за портфолио и Viber група</div>
          </div>
        </div>
      </div>

      {/* Input Panel */}
      <form
        onSubmit={handleGenerate}
        className="rounded-3xl bg-white/95 backdrop-blur-md p-6 sm:p-8 shadow-xl border-2 border-violet-100 space-y-6"
      >
        {/* 1. Възрастова група */}
        <div>
          <label className="block text-sm sm:text-base font-extrabold text-slate-800 mb-3">
            1. Изберете възрастова група:
          </label>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {AGE_GROUPS.map((g) => {
              const active = ageGroup === g.id;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setAgeGroup(g.id)}
                  className={`py-3.5 px-4 rounded-2xl border-2 font-extrabold transition-all flex items-center justify-between ${
                    projectorMode ? 'text-lg' : 'text-sm sm:text-base'
                  } ${
                    active
                      ? 'bg-violet-600 text-white border-violet-600 shadow-md scale-[1.01]'
                      : 'bg-slate-50 hover:bg-violet-50/60 text-slate-800 border-slate-200'
                  }`}
                >
                  <span>{g.label}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      active ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {g.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Образователно направление */}
        <div>
          <label className="block text-sm sm:text-base font-extrabold text-slate-800 mb-3">
            2. Изберете образователно направление (по ДОС):
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {DIRECTIONS.map((d) => {
              const active = direction === d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDirection(d.id)}
                  className={`py-3.5 px-4 rounded-2xl border-2 font-extrabold text-left transition-all flex items-center gap-3 ${
                    projectorMode ? 'text-lg' : 'text-sm sm:text-base'
                  } ${
                    active
                      ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white border-violet-600 shadow-md scale-[1.01]'
                      : 'bg-slate-50 hover:bg-violet-50/60 text-slate-800 border-slate-200'
                  }`}
                >
                  <span className="text-2xl shrink-0">{d.emoji}</span>
                  <span>{d.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Large Topic Input Field + 1-click Quick Chips */}
        <div className="space-y-3">
          <label
            htmlFor="dos-topic-input"
            className="block text-base sm:text-lg font-extrabold text-slate-900"
          >
            3. Въведете тема на ситуацията (от колегите в залата или от годишното разпределение):
          </label>
          <div className="relative">
            <input
              id="dos-topic-input"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Въведете тема на ситуацията (напр. Есен в гората, Професии, Космос, Здравословно хранене...)"
              className={`w-full px-5 py-4 sm:py-5 rounded-2xl border-2 border-violet-300 bg-violet-50/30 font-extrabold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-violet-600 focus:bg-white shadow-inner transition-all ${
                projectorMode ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'
              }`}
            />
            {topic && (
              <button
                type="button"
                onClick={() => setTopic('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 px-3 py-1 rounded-xl text-xs font-bold bg-slate-200/80 hover:bg-slate-300 text-slate-700"
              >
                Изчисти
              </button>
            )}
          </div>

          {/* Quick Preset Topic Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mr-1">
              Бърз избор с 1 клик:
            </span>
            {QUICK_TOPICS.map((qt) => (
              <button
                key={qt.label}
                type="button"
                onClick={() => setTopic(qt.topic)}
                className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold border transition-all ${
                  topic === qt.topic
                    ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                    : 'bg-white hover:bg-violet-50 text-slate-700 border-slate-200 hover:border-violet-300'
                }`}
              >
                {qt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex flex-col items-center">
          <button
            type="submit"
            disabled={isGenerating}
            className="relative group w-full sm:w-auto sm:min-w-[480px] max-w-full py-5 px-8 rounded-2xl font-display text-lg sm:text-xl font-extrabold text-white bg-gradient-to-r from-violet-600 via-purple-600 to-rose-500 hover:from-violet-700 hover:via-purple-700 hover:to-rose-600 shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-75 disabled:cursor-wait"
          >
            <span className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-violet-400 via-amber-300 to-rose-400 opacity-40 blur-md group-hover:opacity-75 animate-pulse pointer-events-none" />
            <span className="relative flex items-center justify-center gap-3">
              {isGenerating ? (
                <>
                  <RefreshCw className="w-6 h-6 animate-spin text-amber-200" />
                  <span>Генериране на план, приказка и бележка...</span>
                </>
              ) : (
                <>
                  <Zap className="w-6 h-6 text-amber-300 animate-bounce" />
                  <span>⚡ Генерирай пълна разработка за 10 секунди</span>
                </>
              )}
            </span>
          </button>
        </div>
      </form>

      {/* Simulated Thinking Animation */}
      {isGenerating && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-3xl bg-white/95 border-2 border-violet-200 p-8 sm:p-10 shadow-xl text-center space-y-5"
        >
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-violet-600 via-fuchsia-500 to-amber-400 flex items-center justify-center text-white shadow-lg animate-bounce">
            <Sparkles className="w-10 h-10" />
          </div>
          <h3 className="font-display text-xl sm:text-2xl font-extrabold text-slate-900">
            Подготвяме методическа разработка по тема: „{topic || 'Есен в гората'}“
          </h3>
          <p className="text-base sm:text-lg font-bold text-violet-700 max-w-2xl mx-auto">
            {thinkingSteps[thinkingPhase]}
          </p>
          <div className="w-full max-w-md mx-auto h-3 rounded-full bg-slate-100 overflow-hidden p-0.5 border border-slate-200">
            <div className="h-full rounded-full bg-gradient-to-r from-violet-600 via-rose-500 to-amber-500 animate-pulse w-5/6" />
          </div>
          <div className="flex flex-wrap justify-center gap-2 text-xs font-bold text-slate-600">
            <span className="px-3 py-1 rounded-full bg-violet-50 border border-violet-200">
              {AGE_GROUP_LABELS[ageGroup].full}
            </span>
            <span className="px-3 py-1 rounded-full bg-rose-50 border border-rose-200">
              {DIRECTION_LABELS[direction].label}
            </span>
          </div>
        </div>
      )}

      {/* Results: 3 Sections simultaneously in 3 columns OR focused tabs */}
      {!isGenerating && plan && (
        <div className="space-y-6">
          {/* Result Header & Layout Switcher */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white/90 p-4 sm:p-5 rounded-2xl border border-violet-200 shadow-sm">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  ✅ Готова пълна разработка
                </span>
                {source && (
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black ${source === 'ai' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                    {source === 'ai' ? '✨ Gemini AI' : '🛡️ Демо двигател'}
                  </span>
                )}
                <span className="text-xs font-bold text-slate-500">
                  {plan.ageGroupLabel} • {plan.directionLabel}
                </span>
              </div>
              <h3 className="font-display text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
                Тема: „{plan.topic}“
              </h3>
            </div>

            <div className="no-print flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setViewMode('columns')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                    viewMode === 'columns'
                      ? 'bg-white text-violet-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Columns className="w-4 h-4" />
                  <span>3 колони едновременно</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('tabs')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                    viewMode === 'tabs'
                      ? 'bg-white text-violet-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Maximize2 className="w-4 h-4" />
                  <span>Голям таб (за проектор)</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold bg-violet-600 hover:bg-violet-700 text-white shadow-sm transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>🖨️ Принтирай всичко</span>
              </button>
            </div>
          </div>

          {/* Tab selector when in 'tabs' viewMode */}
          {viewMode === 'tabs' && (
            <div
              role="tablist"
              aria-label="Секции на разработката"
              className="no-print grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-2 rounded-2xl border-2 border-violet-100 shadow-sm"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'plan'}
                onClick={() => setActiveTab('plan')}
                className={`py-3.5 px-4 rounded-xl font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'plan'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-slate-50 hover:bg-emerald-50 text-slate-700'
                }`}
              >
                <ClipboardList className="w-5 h-5" />
                <span>📋 1. План-конспект по ДОС</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'story'}
                onClick={() => setActiveTab('story')}
                className={`py-3.5 px-4 rounded-xl font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'story'
                    ? 'bg-violet-600 text-white shadow-md'
                    : 'bg-slate-50 hover:bg-violet-50 text-slate-700'
                }`}
              >
                <BookOpen className="w-5 h-5" />
                <span>🧚 2. Авторска приказка</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'parents'}
                onClick={() => setActiveTab('parents')}
                className={`py-3.5 px-4 rounded-xl font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'parents'
                    ? 'bg-rose-500 text-white shadow-md'
                    : 'bg-slate-50 hover:bg-rose-50 text-slate-700'
                }`}
              >
                <HeartHandshake className="w-5 h-5" />
                <span>💌 3. Бележка за родителите</span>
              </button>
            </div>
          )}

          {/* 3 Panels Container */}
          <div
            ref={panelsContainerRef}
            className={
              viewMode === 'columns'
                ? 'grid grid-cols-1 xl:grid-cols-3 gap-6 items-start'
                : 'space-y-6'
            }
          >
            {/* SECTION 1: План-конспект на педагогическа ситуация */}
            <div
              data-dos-panel="plan"
              {...(viewMode === 'tabs' && activeTab !== 'plan'
                ? ({ hidden: 'until-found' } as unknown as React.HTMLAttributes<HTMLDivElement>)
                : {})}
            >
              <article className="print-card rounded-2xl bg-white border-2 border-emerald-200 shadow-lg overflow-hidden">
                <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                      <ClipboardList className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-100">
                        Секция 1 • Методика и ДОС
                      </span>
                      <h4 className="font-display text-lg sm:text-xl font-extrabold">
                        📋 План-конспект на ситуация
                      </h4>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyText('plan', formatPlanText(plan))}
                    className="no-print px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-xs font-extrabold flex items-center gap-1.5 shrink-0"
                  >
                    {copiedSection === 'plan' ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Копирано!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Копирай</span>
                      </>
                    )}
                  </button>
                </div>

                <div className={`p-5 sm:p-6 space-y-5 ${projectorMode ? 'text-base' : 'text-sm'}`}>
                  {/* Core metadata */}
                  <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-2">
                    <div>
                      <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800">
                        Образователно ядро:
                      </span>
                      <p className="font-extrabold text-slate-900">{plan.educationalCore}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 pt-1">
                      <Clock className="w-4 h-4 text-emerald-600" />
                      <span>Продължителност по ДОС: {plan.totalDuration}</span>
                    </div>
                  </div>

                  {/* Goals */}
                  <div>
                    <h5 className="font-extrabold text-slate-900 uppercase tracking-wider text-xs mb-2 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Образователни цели:</span>
                    </h5>
                    <ul className="space-y-1.5 pl-1">
                      {plan.goals.map((g, i) => (
                        <li key={i} className="flex items-start gap-2 text-slate-700">
                          <span className="font-extrabold text-emerald-600">•</span>
                          <span>{g}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Expected Results (DOS) */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <h5 className="font-extrabold text-slate-900 uppercase tracking-wider text-xs">
                      Очаквани резултати (според ДОС):
                    </h5>
                    <p className="text-slate-700">
                      <strong className="text-emerald-800">Знания:</strong> {plan.expectedResults.knowledge}
                    </p>
                    <p className="text-slate-700">
                      <strong className="text-emerald-800">Умения:</strong> {plan.expectedResults.skills}
                    </p>
                    <p className="text-slate-700">
                      <strong className="text-emerald-800">Отношения:</strong> {plan.expectedResults.attitudes}
                    </p>
                  </div>

                  {/* Ход на ситуацията по минути */}
                  <div>
                    <h5 className="font-extrabold text-slate-900 uppercase tracking-wider text-xs mb-3 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-emerald-600" />
                      <span>Ход на ситуацията по минути:</span>
                    </h5>
                    <div className="space-y-3">
                      {plan.stages.map((st, i) => (
                        <div
                          key={i}
                          className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/30 space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-extrabold text-slate-900">{st.phase}</span>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-600 text-white shrink-0">
                              {st.duration}
                            </span>
                          </div>
                          <p className="text-slate-700">
                            <strong className="text-slate-900">Учител:</strong> {st.teacherAction}
                          </p>
                          <p className="text-slate-700">
                            <strong className="text-slate-900">Деца:</strong> {st.childrenActivity}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            </div>

            {/* SECTION 2: Авторска приказка / История към темата */}
            <div
              data-dos-panel="story"
              {...(viewMode === 'tabs' && activeTab !== 'story'
                ? ({ hidden: 'until-found' } as unknown as React.HTMLAttributes<HTMLDivElement>)
                : {})}
            >
              <article className="print-card rounded-2xl bg-white border-2 border-violet-200 shadow-lg overflow-hidden">
                <div className="p-5 sm:p-6 bg-gradient-to-r from-violet-600 to-purple-600 text-white flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-violet-100">
                        Секция 2 • Художествен текст
                      </span>
                      <h4 className="font-display text-lg sm:text-xl font-extrabold">
                        🧚 Авторска приказка към темата
                      </h4>
                    </div>
                  </div>
                  <div className="no-print flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleSpeakStory}
                      title="Прочети приказката на глас"
                      className="px-2.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-xs font-extrabold flex items-center gap-1"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>{isSpeakingStory ? 'Спри' : 'Чуй'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => copyText('story', formatStoryText(plan))}
                      className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-xs font-extrabold flex items-center gap-1.5"
                    >
                      {copiedSection === 'story' ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Копирано!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Копирай</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className={`p-5 sm:p-6 space-y-5 ${projectorMode ? 'text-base' : 'text-sm'}`}>
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-50 to-fuchsia-50 border border-violet-200">
                    <div className="text-xs font-extrabold uppercase tracking-wider text-violet-700">
                      Заглавие на приказката:
                    </div>
                    <h5 className="font-display text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5">
                      „{plan.story.title}“
                    </h5>
                    <p className="text-xs font-bold text-violet-800 mt-1">
                      🌟 Главен герой: {plan.story.hero}
                    </p>
                  </div>

                  {/* Story Paragraphs */}
                  <div className="space-y-3.5 text-slate-800 leading-relaxed bg-amber-50/40 p-4 rounded-2xl border border-amber-200/70">
                    {plan.story.paragraphs.map((para, idx) => (
                      <p key={idx} className="first-letter:text-xl first-letter:font-extrabold first-letter:text-violet-700">
                        {para}
                      </p>
                    ))}
                    <div className="pt-2 border-t border-amber-200/80 font-extrabold text-amber-900 italic">
                      ✨ {plan.story.moral}
                    </div>
                  </div>

                  {/* 3 Questions for pedagogical conversation */}
                  <div className="p-4 rounded-2xl bg-violet-50/70 border border-violet-200 space-y-2.5">
                    <h5 className="font-extrabold text-violet-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-violet-600" />
                      <span>3 въпроса за беседа след прочитането:</span>
                    </h5>
                    <ol className="space-y-2">
                      {plan.story.discussionQuestions.map((q, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-slate-800 font-semibold">
                          <span className="w-5 h-5 rounded-full bg-violet-600 text-white text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span>{q}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </article>
            </div>

            {/* SECTION 3: Бележка за родителите (за таблото или Viber групата) */}
            <div
              data-dos-panel="parents"
              {...(viewMode === 'tabs' && activeTab !== 'parents'
                ? ({ hidden: 'until-found' } as unknown as React.HTMLAttributes<HTMLDivElement>)
                : {})}
            >
              <article className="print-card rounded-2xl bg-white border-2 border-rose-200 shadow-lg overflow-hidden">
                <div className="p-5 sm:p-6 bg-gradient-to-r from-rose-500 to-orange-500 text-white flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                      <HeartHandshake className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-100">
                        Секция 3 • Партньорство със семейството
                      </span>
                      <h4 className="font-display text-lg sm:text-xl font-extrabold">
                        💌 Бележка за родителите (Viber / Табло)
                      </h4>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyText('parents', formatParentNoteText(plan))}
                    className="no-print px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-xs font-extrabold flex items-center gap-1.5 shrink-0"
                  >
                    {copiedSection === 'parents' ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Копирано!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Копирай за Viber</span>
                      </>
                    )}
                  </button>
                </div>

                <div className={`p-5 sm:p-6 space-y-5 ${projectorMode ? 'text-base' : 'text-sm'}`}>
                  {/* Viber style preview card */}
                  <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-3">
                    <div className="font-extrabold text-rose-950 text-base">
                      {plan.parentNote.viberHeader}
                    </div>
                    <p className="text-slate-700 leading-relaxed">{plan.parentNote.summaryMessage}</p>

                    <div className="space-y-2 pt-1">
                      <div className="text-xs font-extrabold uppercase tracking-wider text-rose-800">
                        Какво научиха и преживяха децата днес:
                      </div>
                      {plan.parentNote.highlights.map((h, i) => (
                        <div key={i} className="flex items-start gap-2 text-slate-800">
                          <span className="text-emerald-600 font-bold">✅</span>
                          <span>{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 5-minute Home Game Idea */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-300 space-y-2">
                    <div className="flex items-center gap-2 text-amber-900 font-extrabold text-sm sm:text-base">
                      <Home className="w-5 h-5 text-amber-600 shrink-0" />
                      <span>{plan.parentNote.homeGameTitle}</span>
                    </div>
                    <p className="text-slate-800 leading-relaxed">
                      {plan.parentNote.homeGameDescription}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-semibold italic text-center">
                    {plan.parentNote.closingWarmth}
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
