import React from 'react';
import { Wand2, Sparkles, Clock, Settings, Dices, Rocket, Monitor, ShieldCheck, BookMarked, Building2, Users, UserPlus } from 'lucide-react';
import { AISettings, AppModule, Kindergarten, TeacherProfile } from '../types';

interface HeaderProps {
  activeModule: AppModule;
  onSelectModule: (mod: AppModule) => void;
  savedMinutes: number;
  lastSavedGain: number | null;
  aiSettings: AISettings;
  onOpenSettings: () => void;
  projectorMode: boolean;
  onToggleProjectorMode: () => void;
  kindergartens: Kindergarten[];
  activeKindergarten: Kindergarten;
  onSelectKindergarten: (kgId: string) => void;
  teachersInKg: TeacherProfile[];
  activeTeacher: TeacherProfile;
  onSelectTeacher: (teacher: TeacherProfile) => void;
  bankGamesCount: number;
  onOpenRegisterModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeModule,
  onSelectModule,
  savedMinutes,
  lastSavedGain,
  aiSettings,
  onOpenSettings,
  projectorMode,
  onToggleProjectorMode,
  kindergartens,
  activeKindergarten,
  onSelectKindergarten,
  teachersInKg,
  activeTeacher,
  onSelectTeacher,
  bankGamesCount,
  onOpenRegisterModal,
}) => {
  return (
    <header className="no-print sticky top-0 z-30 backdrop-blur-xl bg-white/90 border-b border-violet-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        {/* Top Row: Brand + Time Saved + AI Settings */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="relative group shrink-0">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-violet-500 via-amber-400 to-emerald-400 opacity-70 blur group-hover:opacity-100 transition duration-300" />
              <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                <Wand2 className="w-7 h-7 sm:w-8 sm:h-8 text-amber-200 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wider bg-violet-100 text-violet-800 border border-violet-200">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Съвместна AI Платформа за ДГ
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  {aiSettings.mode === 'demo' ? 'Интелигентен Демо Двигател' : `Жив AI (${aiSettings.provider.toUpperCase()})`}
                </span>
              </div>
              <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900 mt-0.5">
                Магическа кутия с игри & Учителски хъб
              </h1>
              <p className="text-xs sm:text-sm font-medium text-slate-600">
                Колективна банка със знания, ситуационни игри и ДОС разработки за целия учителски екип
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-amber-50 via-yellow-50 to-emerald-50 border-2 border-amber-200/80 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-700 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-amber-900/70">Спестено време на екипа</div>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-display text-lg font-extrabold text-slate-900">~{savedMinutes} мин.</span>
                  {lastSavedGain && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-extrabold bg-emerald-500 text-white animate-bounce">
                      +{lastSavedGain} мин.!
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onToggleProjectorMode}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold border-2 transition-all ${
                projectorMode ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
              }`}
            >
              <Monitor className="w-4 h-4" />
              <span>Проектор</span>
            </button>

            <button
              type="button"
              onClick={onOpenSettings}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold bg-white hover:bg-violet-50 text-slate-800 border-2 border-violet-200 shadow-sm transition-all"
            >
              <Settings className="w-4 h-4 text-violet-600" />
              <span>AI Настройки</span>
            </button>
          </div>
        </div>

        {/* Kindergarten & Teacher Switcher Bar */}
        <div className="mt-3 p-2.5 sm:px-4 rounded-2xl bg-gradient-to-r from-violet-50/90 via-indigo-50/80 to-emerald-50/90 border border-violet-200/80 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-violet-950">
              <Building2 className="w-4 h-4 text-violet-600 shrink-0" />
              <span>Детска градина:</span>
            </div>
            <select
              aria-label="Избор на детска градина"
              value={activeKindergarten.id}
              onChange={(e) => onSelectKindergarten(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-white border-2 border-violet-300 text-xs sm:text-sm font-extrabold text-violet-900 focus:outline-none focus:border-violet-600 cursor-pointer shadow-sm"
            >
              {kindergartens.map((kg) => (
                <option key={kg.id} value={kg.id}>
                  🏫 {kg.name} ({kg.city})
                </option>
              ))}
            </select>

            <span className="hidden sm:inline text-slate-300">|</span>

            <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-700">
              <Users className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Активен учител (кликни за смяна):</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {teachersInKg.map((t) => {
                const isActive = t.id === activeTeacher.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onSelectTeacher(t)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-extrabold border transition-all flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm scale-[1.02]'
                        : 'bg-white hover:bg-emerald-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span>{t.avatar}</span>
                    <span>{t.name}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isActive ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      {t.ageGroup}-ва/та гр.
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenRegisterModal}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-violet-600 hover:bg-violet-700 text-white shadow-sm transition-all shrink-0"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Регистрирай ДГ / Учител</span>
          </button>
        </div>

        {/* 4 Module Navigation Tabs */}
        <nav aria-label="Основни модули" className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80">
          <button
            type="button"
            onClick={() => onSelectModule('games')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-display font-bold text-xs sm:text-sm transition-all ${
              activeModule === 'games'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md scale-[1.01]'
                : 'bg-white/60 hover:bg-white text-slate-700'
            }`}
          >
            <Dices className="w-4 h-4 shrink-0" />
            <span>🎲 1. Магическа кутия с игри</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectModule('hub')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-display font-bold text-xs sm:text-sm transition-all ${
              activeModule === 'hub'
                ? 'bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 text-white shadow-md scale-[1.01]'
                : 'bg-white/60 hover:bg-white text-slate-700'
            }`}
          >
            <Building2 className="w-4 h-4 shrink-0" />
            <span>🏛️ 2. Учителски хъб & Банка ({bankGamesCount})</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectModule('dos')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-display font-bold text-xs sm:text-sm transition-all ${
              activeModule === 'dos'
                ? 'bg-gradient-to-r from-violet-600 via-purple-600 to-rose-500 text-white shadow-md scale-[1.01]'
                : 'bg-white/60 hover:bg-white text-slate-700'
            }`}
          >
            <Rocket className="w-4 h-4 shrink-0" />
            <span>🚀 3. ДОС План за 10 сек</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectModule('prompts')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-display font-bold text-xs sm:text-sm transition-all ${
              activeModule === 'prompts'
                ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white shadow-md scale-[1.01]'
                : 'bg-white/60 hover:bg-white text-slate-700'
            }`}
          >
            <BookMarked className="w-4 h-4 shrink-0" />
            <span>📚 4. Златни промптове & QR</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
