'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles, Copy, Check, Printer, Wand2, Target, ScrollText, Volume2, RefreshCw, Users, Smile, MapPin, Timer, PackageOpen, Share2, Building2, HeartHandshake, Terminal } from 'lucide-react';
import { AgeGroup, GameFilterState, GeneratedGame, GroupMood, PlayDuration, PlayLocation, PlayResources, SessionTeacher } from '../types';
import { AGE_GROUP_LABELS, AiSource, buildStructuredGameUserPrompt, DURATION_LABELS, generateKindergartenGames, LOCATION_LABELS, MOOD_LABELS, RESOURCE_LABELS } from '../services/aiEngine';

const AGE_OPTIONS: { id: AgeGroup; label: string; emoji: string; desc: string }[] = [
  { id: '1', label: '1-ва група (3-4 г.)', emoji: '🐣', desc: 'Подражание и лесни образи' },
  { id: '2', label: '2-ра група (4-5 г.)', emoji: '🧸', desc: 'Въображение и загадки' },
  { id: '3', label: '3-та група (5-6 г.)', emoji: '🦊', desc: 'Правила и работа по двойки' },
  { id: '4', label: '4-та група (6-7 г.)', emoji: '🦉', desc: 'Логика, екипност и училище' },
];

const MOOD_OPTIONS: { id: GroupMood; label: string; colorClass: string }[] = [
  { id: 'noisy', label: '🔊 Шумни и пренапрегнати', colorClass: 'from-rose-500 to-orange-500 border-rose-400' },
  { id: 'tired', label: '🥱 Уморени / Тихо време', colorClass: 'from-amber-500 to-yellow-500 border-amber-400' },
  { id: 'distracted', label: '🦋 Разсеяни', colorClass: 'from-violet-600 to-indigo-600 border-violet-400' },
];

const LOCATION_OPTIONS: { id: PlayLocation; label: string }[] = [
  { id: 'classroom', label: '🧸 Занималня' },
  { id: 'music_hall', label: '🎵 Музикален салон' },
  { id: 'yard', label: '🌳 Двор' },
];

const DURATION_OPTIONS: { id: PlayDuration; label: string }[] = [
  { id: '5', label: '⏱️ 5 мин' },
  { id: '15', label: '⏱️ 15 мин' },
  { id: '30', label: '⏱️ 30 мин' },
];

const RESOURCE_OPTIONS: { id: PlayResources; label: string }[] = [
  { id: 'none', label: '🙌 Без материали' },
  { id: 'balls', label: '⚽ Само с топки' },
  { id: 'music', label: '🎶 С музика' },
  { id: 'paper_pencils', label: '📄 Хартия и моливи' },
  { id: 'hoops_ribbons', label: '🧣 Обръчи и ленти' },
];

interface MagicGamesModuleProps {
  onTimeSaved: (m: number) => void;
  projectorMode: boolean;
  /** null за гост — генераторът работи, но споделянето в банката иска профил */
  activeTeacher: SessionTeacher | null;
  /** Връща true, ако играта е записана в банката */
  onSaveGameToBank: (game: GeneratedGame, filters: GameFilterState) => Promise<boolean>;
  onOpenHub: () => void;
  onRequireLogin: () => void;
}

export const MagicGamesModule: React.FC<MagicGamesModuleProps> = ({
  onTimeSaved,
  projectorMode,
  activeTeacher,
  onSaveGameToBank,
  onOpenHub,
  onRequireLogin,
}) => {
  const kgName = activeTeacher?.kindergarten?.name ?? 'вашата детска градина';
  const [filters, setFilters] = useState<GameFilterState>({
    ageGroup: activeTeacher?.ageGroup ?? '2',
    mood: 'noisy',
    location: 'classroom',
    duration: '15',
    resources: 'none',
    customTheme: '',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [games, setGames] = useState<GeneratedGame[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedUserPrompt, setCopiedUserPrompt] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [savedBankIds, setSavedBankIds] = useState<Record<string, boolean>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [source, setSource] = useState<AiSource | null>(null);

  useEffect(() => {
    if (activeTeacher) setFilters((prev) => ({ ...prev, ageGroup: activeTeacher.ageGroup }));
  }, [activeTeacher?.id, activeTeacher?.ageGroup]);

  const liveUserPromptText = buildStructuredGameUserPrompt(filters);

  const handleCopyUserPrompt = async () => {
    try { await navigator.clipboard.writeText(liveUserPromptText); } catch {}
    setCopiedUserPrompt(true);
    setTimeout(() => setCopiedUserPrompt(false), 2500);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await generateKindergartenGames(filters);
      setGames(res.games);
      setSource(res.source);
      onTimeSaved(30);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyCard = async (g: GeneratedGame) => {
    const text = [
      `1. Заглавие на играта: ${g.title}`,
      `2. Римуван стих за старт:\n${g.rhymeLines.map((l) => `„${l}“`).join('\n')}`,
      `3. Точни стъпки за играта:\n${g.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`,
      `4. Развивани умения по Наредба № 5: ${g.pedagogicalGoal}`,
      `5. Идея за адаптация за дете със СОП: ${g.sopAdaptation || 'Индивидуална визуална опора и участие в спокоен ритъм с подкрепящо другарче.'}`,
    ].join('\n\n');
    try { await navigator.clipboard.writeText(text); } catch {}
    setCopiedId(g.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleShareToBank = async (g: GeneratedGame) => {
    if (savedBankIds[g.id] || savingId) return;
    if (!activeTeacher) {
      onRequireLogin();
      return;
    }
    setSavingId(g.id);
    try {
      if (await onSaveGameToBank(g, filters)) setSavedBankIds((prev) => ({ ...prev, [g.id]: true }));
    } finally {
      setSavingId(null);
    }
  };

  const handleSpeakRhyme = (g: GeneratedGame) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    if (speakingId === g.id) { setSpeakingId(null); return; }
    const u = new SpeechSynthesisUtterance(g.rhymeLines.join('. '));
    u.lang = 'bg-BG';
    u.rate = 0.92;
    u.onend = () => setSpeakingId(null);
    setSpeakingId(g.id);
    window.speechSynthesis.speak(u);
  };

  return (
    <section className="space-y-8">
      <div className="rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 sm:p-8 text-white shadow-lg flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-white/20">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            {activeTeacher ? <>Активен профил: {activeTeacher.avatar} {activeTeacher.name}{activeTeacher.groupName ? ` (${activeTeacher.groupName})` : ''}</> : 'Режим „Гост“ • влезте, за да споделяте игри с колегите'}
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold mt-2">
            🎲 „Магическа кутия с игри“ (AI Генератор за 30 сек)
          </h2>
          <p className="text-emerald-50 text-sm sm:text-base mt-1 max-w-3xl">
            Генерирайте 3 ситуационни игри със заглавие, римуван стих за старт, точни стъпки (1, 2, 3), умения по Наредба № 5 и идея за адаптация за дете със СОП!
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-bold bg-black/15 p-3.5 rounded-2xl xl:shrink-0 xl:max-w-sm">
          <span className="px-2.5 py-1 rounded-lg bg-white/20">{AGE_GROUP_LABELS[filters.ageGroup].short}</span>
          <span className="px-2.5 py-1 rounded-lg bg-white/20">{MOOD_LABELS[filters.mood].emoji} {MOOD_LABELS[filters.mood].label}</span>
          <span className="px-2.5 py-1 rounded-lg bg-white/20">{LOCATION_LABELS[filters.location].emoji} {LOCATION_LABELS[filters.location].label}</span>
          <span className="px-2.5 py-1 rounded-lg bg-white/20">{RESOURCE_LABELS[filters.resources].emoji} {RESOURCE_LABELS[filters.resources].label}</span>
        </div>
      </div>

      <div className="rounded-3xl bg-white/95 p-6 sm:p-8 shadow-xl border-2 border-emerald-100 space-y-6">
        <div>
          <label className="flex items-center gap-2 text-sm sm:text-base font-extrabold text-slate-800 mb-3">
            <Users className="w-5 h-5 text-emerald-600" />
            <span>1. Възрастова група{activeTeacher ? ` (автоматично синхронизирана с ${activeTeacher.name})` : ''}:</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {AGE_OPTIONS.map((item) => (
              <button key={item.id} type="button" onClick={() => setFilters((p) => ({ ...p, ageGroup: item.id }))} className={`flex items-center gap-3.5 p-4 rounded-2xl border-2 text-left transition-all ${filters.ageGroup === item.id ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-emerald-600 shadow-md scale-[1.02]' : 'bg-slate-50 hover:bg-emerald-50 text-slate-800 border-slate-200'}`}>
                <span className="text-3xl">{item.emoji}</span>
                <div><div className="font-extrabold">{item.label}</div><div className={`text-xs ${filters.ageGroup === item.id ? 'text-emerald-100' : 'text-slate-500'}`}>{item.desc}</div></div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm sm:text-base font-extrabold text-slate-800 mb-3">
            <Smile className="w-5 h-5 text-rose-500" /> 2. Настроение на децата:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {MOOD_OPTIONS.map((item) => (
              <button key={item.id} type="button" onClick={() => setFilters((p) => ({ ...p, mood: item.id }))} className={`py-4 px-5 rounded-2xl border-2 font-extrabold transition-all ${filters.mood === item.id ? `bg-gradient-to-r ${item.colorClass} text-white shadow-md scale-[1.02]` : 'bg-slate-50 hover:bg-rose-50 text-slate-800 border-slate-200'}`}>{item.label}</button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="p-4 rounded-2xl bg-violet-50/60 border border-violet-100">
            <label className="flex items-center gap-2 text-sm font-extrabold text-slate-800 mb-3"><MapPin className="w-5 h-5 text-violet-600" /> 3. Място:</label>
            <div className="flex flex-col gap-2">
              {LOCATION_OPTIONS.map((item) => (
                <button key={item.id} type="button" onClick={() => setFilters((p) => ({ ...p, location: item.id }))} className={`py-3 px-4 rounded-xl border-2 font-extrabold text-left ${filters.location === item.id ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-slate-700 border-slate-200'}`}>{item.label}</button>
              ))}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100">
            <label className="flex items-center gap-2 text-sm font-extrabold text-slate-800 mb-3"><Timer className="w-5 h-5 text-amber-600" /> 4. Времетраене:</label>
            <div className="flex flex-col gap-2">
              {DURATION_OPTIONS.map((item) => (
                <button key={item.id} type="button" onClick={() => setFilters((p) => ({ ...p, duration: item.id }))} className={`py-3 px-4 rounded-xl border-2 font-extrabold text-left ${filters.duration === item.id ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-slate-700 border-slate-200'}`}>{item.label}</button>
              ))}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
            <label className="flex items-center gap-2 text-sm font-extrabold text-slate-800 mb-3"><PackageOpen className="w-5 h-5 text-emerald-600" /> 5. Налични материали:</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
              {RESOURCE_OPTIONS.map((item) => (
                <button key={item.id} type="button" onClick={() => setFilters((p) => ({ ...p, resources: item.id }))} className={`py-2.5 px-3.5 rounded-xl border-2 text-xs sm:text-sm font-extrabold text-left ${filters.resources === item.id ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-200'}`}>{item.label}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <label className="text-xs sm:text-sm font-extrabold text-slate-700 shrink-0">🪄 По желание: Специална тема от публиката:</label>
          <input type="text" value={filters.customTheme} onChange={(e) => setFilters((p) => ({ ...p, customTheme: e.target.value }))} placeholder="напр. Дъждовни капчици, Котенца, Космос..." className="flex-1 px-4 py-2.5 rounded-xl border-2 border-slate-200 bg-white text-sm font-semibold" />
        </div>

        {/* Live Structured User Prompt Preview ("Запитване за игра (User Prompt)") */}
        <div className="rounded-2xl bg-slate-900 text-slate-100 p-5 border-2 border-violet-400/40 shadow-md space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/80 pb-2.5">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-amber-300">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Запитване за игра (User Prompt – обновява се автоматично според избраните бутони):</span>
            </div>
            <button
              type="button"
              onClick={handleCopyUserPrompt}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                copiedUserPrompt ? 'bg-emerald-500 text-white' : 'bg-white/15 hover:bg-white/25 text-white'
              }`}
            >
              {copiedUserPrompt ? <><Check className="w-3.5 h-3.5" /> Копирано!</> : <><Copy className="w-3.5 h-3.5" /> 📋 Копирай запитването (User Prompt)</>}
            </button>
          </div>
          <pre className="whitespace-pre-wrap font-sans text-xs sm:text-sm text-slate-100 leading-relaxed">
            {liveUserPromptText}
          </pre>
        </div>

        <div className="pt-2 flex justify-center">
          <button type="button" disabled={isGenerating} onClick={handleGenerate} className="w-full sm:w-auto sm:min-w-[460px] max-w-full py-5 px-8 rounded-2xl font-display text-lg sm:text-xl font-extrabold text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-violet-600 hover:from-emerald-600 hover:to-violet-700 shadow-xl transition-all flex items-center justify-center gap-3">
            {isGenerating ? <><RefreshCw className="w-6 h-6 animate-spin text-amber-200" /> Магическата кутия съчинява 3 игри...</> : <><Wand2 className="w-6 h-6 text-amber-200 animate-bounce" /> ✨ Отвори Магическата кутия (Генерирай 3 игри)</>}
          </button>
        </div>
      </div>

      {isGenerating && (
        <div className="rounded-3xl bg-white/95 border-2 border-violet-200 p-8 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-500 to-violet-500 flex items-center justify-center text-white shadow-lg animate-bounce"><Sparkles className="w-8 h-8" /></div>
          <h3 className="font-display text-xl font-extrabold text-slate-900">Детският AI Асистент генерира по зададения User Prompt...</h3>
          <p className="text-sm font-bold text-violet-700">1. Заглавие • 2. Римуван стих • 3. Точни стъпки • 4. Умения по Наредба № 5 • 5. Адаптация за СОП</p>
        </div>
      )}

      {!isGenerating && games.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 bg-indigo-50 border border-indigo-200 px-5 py-3.5 rounded-2xl">
            <div className="text-xs sm:text-sm font-extrabold text-indigo-950 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>Харесва ли ви някоя игра? Запазете я в колективната банка на <strong>{kgName}</strong> за всички колеги!</span>
              {source && <span className={`ml-1 px-2 py-0.5 rounded-full text-[11px] font-black ${source === 'ai' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'}`}>{source === 'ai' ? '✨ Генерирано от Gemini AI' : '🛡️ Вграден демо двигател'}</span>}
            </div>
            <button type="button" onClick={onOpenHub} className="text-xs font-extrabold text-indigo-700 hover:text-indigo-900 underline">
              Отвори Учителския хъб →
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {games.map((game, idx) => {
              const isSaved = !!savedBankIds[game.id];
              return (
                <article key={game.id} className="print-card rounded-2xl bg-white border-2 border-emerald-200 shadow-lg flex flex-col justify-between overflow-hidden">
                  <div>
                    <div className="p-5 bg-gradient-to-b from-emerald-500/10 to-transparent border-b border-slate-100">
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-slate-900 text-white">Игра #{idx + 1}</span>
                        {game.tags.map((t) => <span key={t} className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900">{t}</span>)}
                      </div>
                      <div className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800">1. Заглавие на играта:</div>
                      <h4 className={`font-display font-extrabold text-slate-900 ${projectorMode ? 'text-xl' : 'text-lg'}`}>{game.title}</h4>
                      <p className="text-xs text-slate-600 mt-1">{game.subtitle}</p>
                    </div>
                    <div className="p-5 space-y-4">
                      <div className="p-4 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/80">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-extrabold text-amber-900 flex items-center gap-1"><ScrollText className="w-4 h-4" /> 2. Римуван стих за старт:</span>
                          <button type="button" onClick={() => handleSpeakRhyme(game)} className="no-print inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold bg-white text-amber-900 border border-amber-300"><Volume2 className="w-3.5 h-3.5" /> {speakingId === game.id ? 'Спри' : 'Чуй'}</button>
                        </div>
                        <div className="space-y-1 font-bold italic text-slate-900 text-sm sm:text-base">
                          {game.rhymeLines.map((l, i) => <p key={i}>„{l}“</p>)}
                        </div>
                      </div>
                      <div>
                        <h5 className="text-xs font-extrabold uppercase text-slate-700 flex items-center gap-1.5 mb-2"><Target className="w-4 h-4 text-emerald-600" /> 3. Точни стъпки за играта (1, 2, 3):</h5>
                        <ol className="space-y-2">
                          {game.steps.map((s, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                              <span className="w-5 h-5 rounded-md bg-emerald-600 text-white text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                              <span>{s}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                      <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm space-y-1">
                        <p><strong className="font-extrabold text-emerald-950">4. Развивани умения по Наредба № 5:</strong> {game.pedagogicalGoal}</p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-violet-50 border border-violet-200 text-xs sm:text-sm space-y-1">
                        <p className="flex items-start gap-1.5">
                          <HeartHandshake className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
                          <span><strong className="font-extrabold text-violet-950">5. Идея за адаптация за дете със СОП:</strong> {game.sopAdaptation || 'Използване на визуална карта-опора, щадящо темпо и участие в двойка с подкрепящо другарче или учител.'}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="no-print px-5 py-4 bg-slate-50 border-t border-slate-100 space-y-2">
                    <button
                      type="button"
                      onClick={() => handleShareToBank(game)}
                      className={`w-full py-2.5 px-3 rounded-xl text-xs sm:text-sm font-extrabold border-2 flex items-center justify-center gap-1.5 transition-all ${
                        isSaved
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white border-indigo-600 shadow-sm'
                      }`}
                    >
                      {isSaved ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Споделено в Банката на {kgName}!</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="w-4 h-4" />
                          <span>{savingId === game.id ? 'Записване…' : activeTeacher ? `💾 Сподели в Банката на ДГ (${activeTeacher.name.split(' ')[1] || activeTeacher.name})` : '🔐 Влез, за да споделиш в Банката на ДГ'}</span>
                        </>
                      )}
                    </button>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => handleCopyCard(game)} className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold border-2 flex items-center justify-center gap-1.5 ${copiedId === game.id ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-200'}`}>
                        {copiedId === game.id ? <><Check className="w-3.5 h-3.5" /> Копирано!</> : <><Copy className="w-3.5 h-3.5" /> 📋 Копирай</>}
                      </button>
                      <button type="button" onClick={() => window.print()} className="flex-1 py-2 px-3 rounded-xl text-xs font-extrabold bg-white hover:bg-violet-50 text-violet-800 border-2 border-violet-200 flex items-center justify-center gap-1.5"><Printer className="w-3.5 h-3.5" /> 🖨️ Принтирай</button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};
