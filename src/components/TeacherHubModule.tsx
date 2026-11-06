import React, { useState } from 'react';
import { Building2, Users, UserPlus, PlusCircle, Heart, Copy, Check, Printer, Volume2, ScrollText, Target, Search, Sparkles, Award } from 'lucide-react';
import { AgeGroup, Kindergarten, SavedBankGame, TeacherProfile } from '../types';
import { AGE_GROUP_LABELS } from '../services/aiEngine';

interface TeacherHubModuleProps {
  kindergartens: Kindergarten[];
  activeKindergarten: Kindergarten;
  onSelectKindergarten: (kgId: string) => void;
  onAddKindergarten: (name: string, city: string, motto: string) => void;
  teachers: TeacherProfile[];
  activeTeacher: TeacherProfile;
  onSelectTeacher: (teacher: TeacherProfile) => void;
  onAddTeacher: (name: string, role: string, ageGroup: AgeGroup, groupName: string, avatar: string) => void;
  bankGames: SavedBankGame[];
  onToggleLikeGame: (bankId: string) => void;
  onAddCustomBankGame: (title: string, ageGroup: AgeGroup, rhymeText: string, stepsText: string, goal: string) => void;
  onNavigateToGenerator: () => void;
  projectorMode: boolean;
}

const AVATARS = ['👩‍🏫', '👨‍🏫', '👩‍🎨', '🦸‍♀️', '🧚‍♀️', '👩‍🔬', '🌟', '🦉'];

export const TeacherHubModule: React.FC<TeacherHubModuleProps> = ({
  kindergartens,
  activeKindergarten,
  onSelectKindergarten,
  onAddKindergarten,
  teachers,
  activeTeacher,
  onSelectTeacher,
  onAddTeacher,
  bankGames,
  onToggleLikeGame,
  onAddCustomBankGame,
  onNavigateToGenerator,
  projectorMode,
}) => {
  const [ageFilter, setAgeFilter] = useState<'all' | AgeGroup>('all');
  const [scopeFilter, setScopeFilter] = useState<'kg' | 'all'>('kg');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  // Forms state
  const [showNewKgForm, setShowNewKgForm] = useState(false);
  const [kgName, setKgName] = useState('');
  const [kgCity, setKgCity] = useState('');
  const [kgMotto, setKgMotto] = useState('Децата са нашето вдъхновение!');

  const [showNewTeacherForm, setShowNewTeacherForm] = useState(false);
  const [tName, setTName] = useState('');
  const [tRole, setTRole] = useState('Старши учител');
  const [tAgeGroup, setTAgeGroup] = useState<AgeGroup>('3');
  const [tGroupName, setTGroupName] = useState('III ПГ „Бонбони“ (5–6 г.)');
  const [tAvatar, setTAvatar] = useState('👩‍🏫');

  const [showAddGameForm, setShowAddGameForm] = useState(false);
  const [gTitle, setGTitle] = useState('');
  const [gRhyme, setGRhyme] = useState('');
  const [gSteps, setGSteps] = useState('');
  const [gGoal, setGGoal] = useState('');

  const teachersInCurrentKg = teachers.filter((t) => t.kindergartenId === activeKindergarten.id);

  const filteredBank = bankGames.filter((item) => {
    if (scopeFilter === 'kg' && item.kindergartenId !== activeKindergarten.id) return false;
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

  const handleCreateKg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kgName.trim()) return;
    onAddKindergarten(kgName.trim(), kgCity.trim() || 'България', kgMotto.trim());
    setKgName('');
    setKgCity('');
    setShowNewKgForm(false);
  };

  const handleCreateTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tName.trim()) return;
    onAddTeacher(tName.trim(), tRole, tAgeGroup, tGroupName.trim() || `${tAgeGroup}-та група`, tAvatar);
    setTName('');
    setShowNewTeacherForm(false);
  };

  const handleCreateGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gTitle.trim()) return;
    onAddCustomBankGame(
      gTitle.trim(),
      activeTeacher.ageGroup,
      gRhyme.trim() || 'Ръчички горе вдигни и с усмивка играта започни!',
      gSteps.trim() || '1. Децата застават в кръг.\n2. Изпълняват движенията по сигнал на учителя.',
      gGoal.trim() || 'Развитие на вниманието, екипността и емоционалната саморегулация.'
    );
    setGTitle('');
    setGRhyme('');
    setGSteps('');
    setGGoal('');
    setShowAddGameForm(false);
  };

  const handleCopy = async (item: SavedBankGame) => {
    const text = `🎲 ${item.game.title} (Споделено от ${item.authorName}, ${item.kindergartenName})\n\n${item.game.rhymeLines.join('\n')}\n\n🎯 Правила:\n${item.game.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\n💡 Развивани умения: ${item.game.pedagogicalGoal}`;
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
      {/* Hero Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-700 via-blue-600 to-teal-600 p-6 sm:p-8 text-white shadow-lg flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-white/20">
            <Building2 className="w-3.5 h-3.5 text-amber-300" />
            Колективна банка със знания на учителския екип
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold mt-2">
            🏛️ Учителски хъб: {activeKindergarten.name} ({activeKindergarten.city})
          </h2>
          <p className="text-indigo-100 text-sm sm:text-base mt-1 max-w-3xl">
            „{activeKindergarten.motto}“ — Превключвайте между учителите от I до IV група, регистрирайте вашата детска градина и споделяйте любимите AI игри в общата банка на екипа!
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowNewKgForm((v) => !v)}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl font-extrabold text-xs sm:text-sm bg-white text-indigo-950 hover:bg-indigo-50 shadow-md transition-all"
          >
            <Building2 className="w-4 h-4 text-indigo-600" />
            <span>+ Нова Детска градина</span>
          </button>
          <button
            type="button"
            onClick={() => setShowNewTeacherForm((v) => !v)}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl font-extrabold text-xs sm:text-sm bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Добави учител в екипа</span>
          </button>
        </div>
      </div>

      {/* Form 1: Register New Kindergarten */}
      {showNewKgForm && (
        <form onSubmit={handleCreateKg} className="rounded-3xl bg-white p-6 border-2 border-indigo-300 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-extrabold text-slate-900">🏫 Регистрация на Детска градина (Демонстрация на живо)</h3>
            <button type="button" onClick={() => setShowNewKgForm(false)} className="text-xs font-bold text-slate-500">Затвори</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input type="text" required value={kgName} onChange={(e) => setKgName(e.target.value)} placeholder="Име на ДГ (напр. ДГ „Детелина“)" className="px-4 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-bold" />
            <input type="text" value={kgCity} onChange={(e) => setKgCity(e.target.value)} placeholder="Населено място (напр. гр. Бургас)" className="px-4 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-bold" />
            <input type="text" value={kgMotto} onChange={(e) => setKgMotto(e.target.value)} placeholder="Мото на градината..." className="px-4 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-bold" />
          </div>
          <button type="submit" className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-extrabold shadow-md">
            Създай и превключи към тази Детска градина
          </button>
        </form>
      )}

      {/* Form 2: Add New Teacher Profile */}
      {showNewTeacherForm && (
        <form onSubmit={handleCreateTeacher} className="rounded-3xl bg-white p-6 border-2 border-amber-300 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-extrabold text-slate-900">👩‍🏫 Добавяне на учител към екипа на {activeKindergarten.name}</h3>
            <button type="button" onClick={() => setShowNewTeacherForm(false)} className="text-xs font-bold text-slate-500">Затвори</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <input type="text" required value={tName} onChange={(e) => setTName(e.target.value)} placeholder="Име (напр. Г-жа Тодорова)" className="px-4 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-bold" />
            <select value={tAgeGroup} onChange={(e) => {
              const ag = e.target.value as AgeGroup;
              setTAgeGroup(ag);
              setTGroupName(`${ag}-ва/та група (${AGE_GROUP_LABELS[ag].ageRange})`);
            }} className="px-4 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-bold">
              <option value="1">I група (3–4 г.)</option>
              <option value="2">II група (4–5 г.)</option>
              <option value="3">III ПГ (5–6 г.)</option>
              <option value="4">IV ПГ (6–7 г.)</option>
            </select>
            <input type="text" value={tGroupName} onChange={(e) => setTGroupName(e.target.value)} placeholder="Име на групата (напр. III гр. Слънчо)" className="px-4 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-bold" />
            <div className="flex items-center gap-1.5">
              {AVATARS.map((av) => (
                <button key={av} type="button" onClick={() => setTAvatar(av)} className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center border-2 ${tAvatar === av ? 'border-amber-500 bg-amber-50' : 'border-slate-200'}`}>{av}</button>
              ))}
            </div>
          </div>
          <button type="submit" className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-extrabold shadow-md">
            Добави учителя и влез в неговия профил
          </button>
        </form>
      )}

      {/* Kindergarten & Team Roster Cards */}
      <div className="rounded-3xl bg-white/95 p-6 sm:p-7 border-2 border-indigo-100 shadow-lg space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-display text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <span>Учителски екип на {activeKindergarten.name} (Кликнете върху учител за превключване)</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-600">
              Когато превключите учителя, AI генераторът автоматично се настройва за неговата възрастова група и запазва игрите от негово име!
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {kindergartens.map((kg) => (
              <button
                key={kg.id}
                type="button"
                onClick={() => onSelectKindergarten(kg.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border-2 transition-all ${
                  kg.id === activeKindergarten.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-indigo-300'
                }`}
              >
                🏫 {kg.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {teachersInCurrentKg.map((teacher) => {
            const isSelected = teacher.id === activeTeacher.id;
            return (
              <button
                key={teacher.id}
                type="button"
                onClick={() => onSelectTeacher(teacher)}
                className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between gap-3 ${
                  isSelected
                    ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-500 shadow-md ring-2 ring-emerald-500/20 scale-[1.01]'
                    : 'bg-slate-50/70 hover:bg-white border-slate-200 hover:border-indigo-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-3xl w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center">
                    {teacher.avatar}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${isSelected ? 'bg-emerald-600 text-white' : 'bg-indigo-100 text-indigo-900'}`}>
                    {isSelected ? '✓ Активен профил' : `${teacher.ageGroup}-ва/та група`}
                  </span>
                </div>
                <div>
                  <div className="font-display font-extrabold text-slate-900 text-base">{teacher.name}</div>
                  <div className="text-xs font-bold text-indigo-700 mt-0.5">{teacher.groupName}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{teacher.role}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Shared Kindergarten Idea Bank Section */}
      <div className="space-y-5">
        <div className="rounded-3xl bg-white/95 p-5 sm:p-6 border-2 border-emerald-100 shadow-md space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                <Award className="w-6 h-6 text-amber-500" />
                <span>Споделена колективна банка за идеи ({filteredBank.length})</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-600">
                Всички колеги от детската градина виждат споделените игри, могат да ги филтрират по възрастови групи и да ги ползват веднага!
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowAddGameForm((v) => !v)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Сподели собствена игра</span>
              </button>
              <button
                type="button"
                onClick={onNavigateToGenerator}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold bg-violet-600 hover:bg-violet-700 text-white shadow-sm"
              >
                <Sparkles className="w-4 h-4 text-amber-200" />
                <span>Генерирай нова с AI</span>
              </button>
            </div>
          </div>

          {showAddGameForm && (
            <form onSubmit={handleCreateGame} className="p-5 rounded-2xl bg-emerald-50/70 border-2 border-emerald-300 space-y-3">
              <div className="font-extrabold text-sm text-emerald-950">
                ➕ Споделяне на игра в банката от името на {activeTeacher.name} ({activeTeacher.groupName})
              </div>
              <input type="text" required value={gTitle} onChange={(e) => setGTitle(e.target.value)} placeholder="Заглавие на играта..." className="w-full px-4 py-2 rounded-xl border border-emerald-300 text-sm font-bold" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <textarea rows={2} value={gRhyme} onChange={(e) => setGRhyme(e.target.value)} placeholder="Римуван стих за старт (по 1 стих на ред)..." className="w-full px-3 py-2 rounded-xl border border-emerald-300 text-xs font-semibold" />
                <textarea rows={2} value={gSteps} onChange={(e) => setGSteps(e.target.value)} placeholder="Стъпки / правила на играта..." className="w-full px-3 py-2 rounded-xl border border-emerald-300 text-xs font-semibold" />
              </div>
              <input type="text" value={gGoal} onChange={(e) => setGGoal(e.target.value)} placeholder="Развивани умения / Педагогическа цел..." className="w-full px-4 py-2 rounded-xl border border-emerald-300 text-xs font-semibold" />
              <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-extrabold">Запази в Колективната банка</button>
            </form>
          )}

          {/* Filters: Scope + Age Group + Search */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setAgeFilter('all')}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border ${ageFilter === 'all' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-700 border-slate-200'}`}
              >
                Всички групи
              </button>
              {(['1', '2', '3', '4'] as AgeGroup[]).map((ag) => (
                <button
                  key={ag}
                  type="button"
                  onClick={() => setAgeFilter(ag)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border ${ageFilter === ag ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-700 border-slate-200'}`}
                >
                  {AGE_GROUP_LABELS[ag].short}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                <button type="button" onClick={() => setScopeFilter('kg')} className={`px-3 py-1 rounded-lg text-xs font-extrabold ${scopeFilter === 'kg' ? 'bg-white text-indigo-800 shadow-sm' : 'text-slate-600'}`}>
                  🏫 Само {activeKindergarten.name}
                </button>
                <button type="button" onClick={() => setScopeFilter('all')} className={`px-3 py-1 rounded-lg text-xs font-extrabold ${scopeFilter === 'all' ? 'bg-white text-indigo-800 shadow-sm' : 'text-slate-600'}`}>
                  🌍 Всички градини
                </button>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Търси игра или учител..."
                  className="pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Shared Games Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredBank.map((item) => (
            <article key={item.id} className="print-card rounded-2xl bg-white border-2 border-slate-200 hover:border-indigo-300 shadow-lg flex flex-col justify-between overflow-hidden">
              <div>
                {/* Author Header */}
                <div className="px-5 py-3.5 bg-gradient-to-r from-indigo-50/90 via-violet-50/60 to-emerald-50/70 border-b border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center">{item.authorAvatar}</span>
                    <div>
                      <div className="text-xs sm:text-sm font-extrabold text-slate-900">{item.authorName}</div>
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
                        <span key={t} className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-900">
                          {t}
                        </span>
                      ))}
                    </div>
                    <h4 className={`font-display font-extrabold text-slate-900 ${projectorMode ? 'text-xl' : 'text-lg'}`}>
                      🎲 {item.game.title}
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">{item.game.subtitle}</p>
                  </div>

                  {/* Rhyme */}
                  <div className="p-4 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/80">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-extrabold text-amber-900 flex items-center gap-1">
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
                    <h5 className="text-xs font-extrabold uppercase text-slate-700 flex items-center gap-1.5 mb-2">
                      <Target className="w-4 h-4 text-emerald-600" /> 🎯 Стъпка по стъпка правила за децата:
                    </h5>
                    <ol className="space-y-1.5">
                      {item.game.steps.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-slate-700">
                          <span className="w-5 h-5 rounded-md bg-indigo-600 text-white text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Goal & SOP Adaptation */}
                  <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs sm:text-sm space-y-1.5">
                    <p><strong className="font-extrabold text-emerald-950">4. Развивани умения по Наредба № 5:</strong> {item.game.pedagogicalGoal}</p>
                    <p className="text-violet-900 bg-violet-50/90 p-2.5 rounded-lg border border-violet-200">
                      <strong className="font-extrabold">5. Идея за адаптация за дете със СОП:</strong>{' '}
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
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold border-2 transition-all ${
                    item.likedByMe ? 'bg-rose-500 text-white border-rose-500' : 'bg-white hover:bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${item.likedByMe ? 'fill-white' : 'fill-rose-500 text-rose-500'}`} />
                  <span>Ползвах я ({item.likes})</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(item)}
                    className={`py-2 px-3 rounded-xl text-xs font-extrabold border-2 flex items-center gap-1 ${
                      copiedId === item.id ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    {copiedId === item.id ? <><Check className="w-3.5 h-3.5" /> Копирано</> : <><Copy className="w-3.5 h-3.5" /> Копирай</>}
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="py-2 px-3 rounded-xl text-xs font-extrabold bg-white hover:bg-indigo-50 text-indigo-800 border-2 border-indigo-200 flex items-center gap-1"
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
