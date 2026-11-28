'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Building2, Users, PlusCircle, Heart, Copy, Check, Printer, Volume2, ScrollText, Target, Search, Sparkles, Award, KeyRound, LogIn, Bookmark } from 'lucide-react';
import { AgeGroup, SavedBankGame, SessionTeacher } from '../types';
import { AGE_GROUP_LABELS } from '../services/aiEngine';
import { copyMaterial } from '../lib/client/materials';
import { toast } from './Toaster';
import { taskLine } from '../services/gameTasks';

export interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  jobTitle: string;
  ageGroup: AgeGroup;
  groupName: string;
  kgRole: 'ADMIN' | 'TEACHER';
}

interface TeacherHubModuleProps {
  /** null → гост: показва се примерна банка и покана за регистрация */
  teacher: SessionTeacher | null;
  team: TeamMember[];
  bankGames: SavedBankGame[];
  loading: boolean;
  scope: 'kg' | 'all';
  onScopeChange: (scope: 'kg' | 'all') => void;
  onToggleLikeGame: (bankId: string) => void;
  onAddCustomBankGame: (title: string, ageGroup: AgeGroup, rhymeText: string, stepsText: string, goal: string) => Promise<boolean>;
  onNavigateToGenerator: () => void;
  projectorMode: boolean;
}

export const TeacherHubModule: React.FC<TeacherHubModuleProps> = ({
  teacher,
  team,
  bankGames,
  loading,
  scope,
  onScopeChange,
  onToggleLikeGame,
  onAddCustomBankGame,
  onNavigateToGenerator,
  projectorMode,
}) => {
  const kg = teacher?.kindergarten ?? null;
  const [ageFilter, setAgeFilter] = useState<'all' | AgeGroup>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedToLibrary, setSavedToLibrary] = useState<Record<string, boolean>>({});
  const [copiedCode, setCopiedCode] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const [showAddGameForm, setShowAddGameForm] = useState(false);
  const [savingGame, setSavingGame] = useState(false);
  const [gTitle, setGTitle] = useState('');
  const [gRhyme, setGRhyme] = useState('');
  const [gSteps, setGSteps] = useState('');
  const [gGoal, setGGoal] = useState('');

  const filteredBank = bankGames.filter((item) => {
    if (ageFilter !== 'all' && item.ageGroup !== ageFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.game.title.toLowerCase().includes(q);
      const matchAuthor = item.authorName.toLowerCase().includes(q);
      const matchGoal = item.game.pedagogicalGoal.toLowerCase().includes(q);
      if (!matchTitle && !matchAuthor && !matchGoal) return false;
    }
    return true;
  });

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gTitle.trim() || !teacher || savingGame) return;
    setSavingGame(true);
    const ok = await onAddCustomBankGame(
      gTitle.trim(),
      teacher.ageGroup,
      gRhyme.trim() || 'Ръчички горе вдигни и с усмивка играта започни!',
      gSteps.trim() || 'Децата застават в кръг.\nИзпълняват движенията по сигнал на учителя.',
      gGoal.trim() || 'Развитие на вниманието, екипността и емоционалната саморегулация.'
    );
    setSavingGame(false);
    if (!ok) return;
    setGTitle('');
    setGRhyme('');
    setGSteps('');
    setGGoal('');
    setShowAddGameForm(false);
  };

  const handleCopyCode = async () => {
    if (!kg) return;
    try { await navigator.clipboard.writeText(kg.joinCode); } catch {}
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleCopy = async (item: SavedBankGame) => {
    const text = `${item.game.title} (Споделено от ${item.authorName}, ${item.kindergartenName})\n\n${item.game.rhymeLines.join('\n')}\n\n🎯 Правила:\n${item.game.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\n💡 Развивани умения: ${item.game.pedagogicalGoal}`;
    try { await navigator.clipboard.writeText(text); } catch {}
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleSpeak = (item: SavedBankGame) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    if (speakingId === item.id) { setSpeakingId(null); return; }
    const u = new SpeechSynthesisUtterance(item.game.rhymeLines.join('. '));
    u.lang = 'bg-BG';
    u.rate = 0.92;
    u.onend = () => setSpeakingId(null);
    setSpeakingId(item.id);
    window.speechSynthesis.speak(u);
  };

  return (
    <section aria-label="Учителски хъб и Колективна банка на детската градина" className="space-y-8">
      {/* Заглавна карта */}
      <div className="border-b border-slate-200 pb-6 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold ">
            Учителски хъб{kg ? `: ${kg.name}${kg.city ? ` (${kg.city})` : ''}` : ''}
          </h2>
          <p className="text-slate-600 text-sm sm:text-base mt-1 max-w-3xl">
            {kg?.motto ? `„${kg.motto}“ — ` : ''}Споделяйте любимите си игри в общата банка на екипа — всички колеги от градината ги виждат веднага.
          </p>
        </div>

        {kg ? (
          <div className="shrink-0 rounded-2xl bg-slate-50 p-4 space-y-2 min-w-[240px]">
            <div className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" /> Код за колеги
            </div>
            <div className="flex items-center gap-2">
              <code className="text-xl font-bold">{kg.joinCode}</code>
              <button
                type="button"
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-xs font-bold text-indigo-800 transition-colors duration-150 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
              >
                {copiedCode ? <><Check className="w-3.5 h-3.5" /> Копиран</> : <><Copy className="w-3.5 h-3.5" /> Копирай</>}
              </button>
            </div>
            <p className="text-xs text-slate-600">Колегите въвеждат кода при регистрация и влизат в същата банка.</p>
          </div>
        ) : !teacher ? (
          <div className="flex flex-wrap gap-2.5 shrink-0">
            <Link href="/register" className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl font-semibold text-xs sm:text-sm bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-colors">
              <Building2 className="w-4 h-4" /> Регистрирай градината си
            </Link>
            <Link href="/login?callbackUrl=/hub" className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl font-semibold text-xs sm:text-sm bg-white border border-slate-200 text-slate-900 hover:bg-slate-100 transition-colors">
              <LogIn className="w-4 h-4" /> Вход
            </Link>
          </div>
        ) : null}
      </div>

      {!teacher && (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-semibold text-amber-900">
          Разглеждате примерна банка. Регистрирайте се, за да създадете банка за вашата градина и да споделяте игри с колегите.
        </p>
      )}

      {/* Учителски екип */}
      {teacher && (
        <div className="rounded-2xl bg-white/95 p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5">
          <div className="pb-4 border-b border-slate-100">
            <h3 className="font-display text-lg sm:text-xl font-semibold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-700" />
              <span>Учителски екип{kg ? ` на ${kg.name}` : ''} ({team.length})</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-600">Всеки колега влиза със собствен профил — генераторът се настройва за неговата група.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {team.map((member) => {
              const isMe = member.id === teacher.id;
              return (
                <div
                  key={member.id}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between gap-3 ${
                    isMe ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/15' : 'bg-slate-50/70 border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-3xl w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center">{member.avatar}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${isMe ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-800'}`}>
                      {isMe ? '✓ Това сте вие' : member.kgRole === 'ADMIN' ? 'Администратор' : AGE_GROUP_LABELS[member.ageGroup]?.short ?? ''}
                    </span>
                  </div>
                  <div>
                    <div className="font-display font-semibold text-slate-900 text-base">{member.name}</div>
                    {member.groupName && <div className="text-xs font-bold text-indigo-800 mt-0.5">{member.groupName}</div>}
                    <div className="text-[11px] text-slate-500 mt-0.5">{member.jobTitle}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Колективна банка */}
      <div className="space-y-5">
        <div className="rounded-2xl bg-white/95 p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-xl sm:text-2xl font-semibold text-slate-900 flex items-center gap-2">
                <Award className="w-6 h-6 text-amber-500" />
                <span>Споделена колективна банка за идеи ({filteredBank.length})</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-600">
                Всички колеги от детската градина виждат споделените игри, могат да ги филтрират по възрастови групи и да ги ползват веднага!
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {teacher && (
                <button
                  type="button"
                  onClick={() => setShowAddGameForm((v) => !v)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-green-700 hover:bg-green-800 text-white shadow-sm transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Сподели собствена игра</span>
                </button>
              )}
              <button
                type="button"
                onClick={onNavigateToGenerator}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-700 hover:bg-indigo-800 text-white shadow-sm transition-colors"
              >
                <Sparkles className="w-4 h-4 text-amber-200" />
                <span>Генерирай нова игра</span>
              </button>
            </div>
          </div>

          {showAddGameForm && teacher && (
            <form onSubmit={handleCreateGame} className="p-5 rounded-2xl bg-green-50/70 border border-green-300 space-y-3">
              <div className="font-semibold text-sm text-green-950">
                Споделяне на игра в банката от името на {teacher.name}{teacher.groupName ? ` (${teacher.groupName})` : ''}
              </div>
              <input type="text" required value={gTitle} onChange={(e) => setGTitle(e.target.value)} placeholder="Заглавие на играта..." className="w-full px-4 py-2 rounded-xl border border-green-300 bg-white text-sm font-bold" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <textarea rows={3} value={gRhyme} onChange={(e) => setGRhyme(e.target.value)} placeholder="Римуван стих за старт (по 1 стих на ред)..." className="w-full px-3 py-2 rounded-xl border border-green-300 bg-white text-xs font-semibold" />
                <textarea rows={3} value={gSteps} onChange={(e) => setGSteps(e.target.value)} placeholder="Стъпки / правила на играта (по 1 на ред)..." className="w-full px-3 py-2 rounded-xl border border-green-300 bg-white text-xs font-semibold" />
              </div>
              <input type="text" value={gGoal} onChange={(e) => setGGoal(e.target.value)} placeholder="Развивани умения / Педагогическа цел..." className="w-full px-4 py-2 rounded-xl border border-green-300 bg-white text-xs font-semibold" />
              <button type="submit" disabled={savingGame} className="px-5 py-2 rounded-xl bg-green-700 hover:bg-green-800 text-white text-xs font-semibold disabled:opacity-60 transition-colors">
                {savingGame ? 'Записване…' : 'Запази в Колективната банка'}
              </button>
            </form>
          )}

          {/* Филтри: възраст + обхват + търсене */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setAgeFilter('all')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold border ${ageFilter === 'all' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-700 border-slate-200'}`}
              >
                Всички групи
              </button>
              {(['1', '2', '3', '4'] as AgeGroup[]).map((ag) => (
                <button
                  key={ag}
                  type="button"
                  onClick={() => setAgeFilter(ag)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold border ${ageFilter === ag ? 'bg-indigo-700 text-white border-indigo-700' : 'bg-slate-50 text-slate-700 border-slate-200'}`}
                >
                  {AGE_GROUP_LABELS[ag].short}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {teacher && (
                <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                  <button type="button" onClick={() => onScopeChange('kg')} className={`px-3 py-1 rounded-lg text-xs font-semibold ${scope === 'kg' ? 'bg-white text-indigo-800 shadow-sm' : 'text-slate-600'}`}>
                    Само {kg?.name ?? 'моята градина'}
                  </button>
                  <button type="button" onClick={() => onScopeChange('all')} className={`px-3 py-1 rounded-lg text-xs font-semibold ${scope === 'all' ? 'bg-white text-indigo-800 shadow-sm' : 'text-slate-600'}`}>
                    Всички градини
                  </button>
                </div>
              )}

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Търси игра или учител..."
                  aria-label="Търси игра или учител"
                  className="pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>
          </div>
        </div>

        {loading && <p className="text-center text-sm font-semibold text-slate-500">Зареждане на банката…</p>}
        {!loading && filteredBank.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-8 text-center text-sm text-slate-600">
            Още няма споделени игри. Генерирайте игра в „Магическа кутия“ и натиснете „💾 Сподели в Банката на ДГ“.
          </div>
        )}

        {/* Shared Games Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredBank.map((item) => (
            <article key={item.id} className="print-card rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 shadow-sm flex flex-col justify-between overflow-hidden">
              <div>
                {/* Author Header */}
                <div className="px-5 py-3.5 bg-indigo-50/90 border-b border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center">{item.authorAvatar}</span>
                    <div>
                      <div className="text-xs sm:text-sm font-semibold text-slate-900">{item.authorName}</div>
                      <div className="text-[11px] font-bold text-indigo-700">{item.authorGroupName} • {item.kindergartenName}</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200">
                    {item.createdAt}
                  </span>
                </div>

                {/* Game Body */}
                <div className="p-5 space-y-4">
                  <div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {item.game.tags.map((t) => (
                        <span key={t} className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900">
                          {t}
                        </span>
                      ))}
                    </div>
                    <h4 className={`font-display font-semibold text-slate-900 ${projectorMode ? 'text-xl' : 'text-lg'}`}>
                      {item.game.title}
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">{item.game.subtitle}</p>
                  </div>

                  {/* Rhyme */}
                  <div className="p-4 rounded-2xl border border-dashed border-amber-300 bg-amber-50/80">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-amber-900 flex items-center gap-1">
                        <ScrollText className="w-4 h-4" /> {item.game.rhymeTitle}
                      </span>
                      <button type="button" onClick={() => handleSpeak(item)} className="no-print inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-amber-900 border border-amber-300">
                        <Volume2 className="w-3.5 h-3.5" /> {speakingId === item.id ? 'Спри' : 'Чуй'}
                      </button>
                    </div>
                    <div className="space-y-1 font-bold italic text-slate-900 text-sm">
                      {item.game.rhymeLines.map((l, i) => <p key={i}>„{l}“</p>)}
                    </div>
                  </div>

                  {/* Steps */}
                  <div>
                    <h5 className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-2">
                      <Target className="w-4 h-4 text-emerald-600" /> Стъпка по стъпка правила за децата:
                    </h5>
                    <ol className="space-y-1.5">
                      {item.game.steps.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-slate-700">
                          <span className="w-5 h-5 rounded-md bg-indigo-600 text-white text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Goal & SOP Adaptation */}
                  <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs sm:text-sm space-y-1.5">
                    {item.game.tasks && item.game.tasks.length > 0 && (
                      <div>
                        <strong className="font-semibold text-[#4d7a0a]">Образователни задачи (Наредба № 5):</strong>
                        <ul className="mt-1 list-disc space-y-0.5 pl-5 text-slate-700">
                          {item.game.tasks.map((t) => <li key={`${t.core}|${t.result}`}>{taskLine(t)}</li>)}
                        </ul>
                      </div>
                    )}
                    <p><strong className="font-semibold text-emerald-950">4. {item.game.mode === 'quick' ? 'Полза от играта' : 'Развивани умения по Наредба № 5'}:</strong> {item.game.pedagogicalGoal}</p>
                    <p className="text-indigo-900 bg-indigo-50/90 p-2.5 rounded-lg border border-indigo-200">
                      <strong className="font-semibold">5. Идея за адаптация за дете със СОП:</strong>{' '}
                      {item.game.sopAdaptation || 'Осигурете визуална карта-опора, предвидим сигнал и участие в двойка с подкрепящо другарче или учител.'}
                    </p>
                    <p className="text-xs text-slate-600 italic"><strong>Колегиален съвет:</strong> {item.game.teacherTip}</p>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="no-print px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onToggleLikeGame(item.id)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    item.likedByMe ? 'bg-rose-500 text-white border-rose-500' : 'bg-white hover:bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${item.likedByMe ? 'fill-white' : 'fill-rose-500 text-rose-500'}`} />
                  <span>Ползвах я ({item.likes})</span>
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Игра на колега → копие в моята библиотека (за моята група) */}
                  {teacher && item.authorId && item.authorId !== teacher.id && (
                    <button
                      type="button"
                      disabled={!!savedToLibrary[item.id]}
                      onClick={async () => {
                        const res = await copyMaterial(item.id);
                        if (res) {
                          setSavedToLibrary((prev) => ({ ...prev, [item.id]: true }));
                          toast('Играта е запазена в твоята библиотека! 📚', 'success');
                        }
                      }}
                      className="py-2 px-3 rounded-xl text-xs font-semibold border flex items-center gap-1 bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 disabled:opacity-70"
                    >
                      {savedToLibrary[item.id] ? <><Check className="w-3.5 h-3.5" /> В библиотеката</> : <><Bookmark className="w-3.5 h-3.5" /> Запази при мен</>}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleCopy(item)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center gap-1 ${
                      copiedId === item.id ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    {copiedId === item.id ? <><Check className="w-3.5 h-3.5" /> Копирано</> : <><Copy className="w-3.5 h-3.5" /> Копирай</>}
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="py-2 px-3 rounded-xl text-xs font-semibold bg-white hover:bg-slate-100 text-indigo-800 border border-indigo-200 flex items-center gap-1"
                  >
                    <Printer className="w-3.5 h-3.5" /> Принтирай
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
