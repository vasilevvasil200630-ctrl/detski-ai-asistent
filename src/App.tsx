import React, { useState } from 'react';
import { Header } from './components/Header';
import { MagicGamesModule } from './components/MagicGamesModule';
import { TeacherHubModule } from './components/TeacherHubModule';
import { LiveDosModule } from './components/LiveDosModule';
import { GoldenPromptsModule } from './components/GoldenPromptsModule';
import { AISettingsModal } from './components/AISettingsModal';
import { AgeGroup, AISettings, AppModule, GameFilterState, GeneratedGame, Kindergarten, SavedBankGame, TeacherProfile } from './types';
import { INITIAL_BANK_GAMES, INITIAL_KINDERGARTENS, INITIAL_TEACHERS } from './services/hubSeedData';
import { AGE_GROUP_LABELS } from './services/aiEngine';
import { Sparkles, Heart, ShieldCheck, Wand2 } from 'lucide-react';

export function App() {
  const [activeModule, setActiveModule] = useState<AppModule>('games');
  const [savedMinutes, setSavedMinutes] = useState<number>(60);
  const [lastSavedGain, setLastSavedGain] = useState<number | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [projectorMode, setProjectorMode] = useState<boolean>(false);

  const [kindergartens, setKindergartens] = useState<Kindergarten[]>(() => {
    try {
      const s = localStorage.getItem('detski_hub_kgs');
      if (s) return JSON.parse(s);
    } catch {}
    return INITIAL_KINDERGARTENS;
  });

  const [activeKgId, setActiveKgId] = useState<string>('kg-slance');

  const [teachers, setTeachers] = useState<TeacherProfile[]>(() => {
    try {
      const s = localStorage.getItem('detski_hub_teachers');
      if (s) return JSON.parse(s);
    } catch {}
    return INITIAL_TEACHERS;
  });

  const [activeTeacherId, setActiveTeacherId] = useState<string>('t-petrova');

  const [bankGames, setBankGames] = useState<SavedBankGame[]>(() => {
    try {
      const s = localStorage.getItem('detski_hub_bank');
      if (s) return JSON.parse(s);
    } catch {}
    return INITIAL_BANK_GAMES;
  });

  const [aiSettings, setAiSettings] = useState<AISettings>(() => {
    try {
      const saved = localStorage.getItem('detski_ai_settings');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { mode: 'demo', provider: 'gemini', apiKey: '', model: 'gemini-2.5-flash' };
  });

  const activeKindergarten = kindergartens.find((k) => k.id === activeKgId) || kindergartens[0];
  const teachersInKg = teachers.filter((t) => t.kindergartenId === activeKindergarten.id);
  const activeTeacher = teachersInKg.find((t) => t.id === activeTeacherId) || teachersInKg[0] || teachers[0];

  const handleSelectKindergarten = (kgId: string) => {
    setActiveKgId(kgId);
    const firstTeacher = teachers.find((t) => t.kindergartenId === kgId);
    if (firstTeacher) setActiveTeacherId(firstTeacher.id);
  };

  const handleAddKindergarten = (name: string, city: string, motto: string) => {
    const newKg: Kindergarten = { id: `kg-${Date.now()}`, name, city, motto };
    const defaultTeachers: TeacherProfile[] = [
      { id: `t-${Date.now()}-1`, name: 'Г-жа Димитрова', role: 'Старши учител', ageGroup: '1', groupName: 'I група „Слънчице“ (3–4 г.)', avatar: '👩‍🏫', kindergartenId: newKg.id },
      { id: `t-${Date.now()}-2`, name: 'Г-жа Николова', role: 'Учител ПГ', ageGroup: '3', groupName: 'III ПГ „Звездички“ (5–6 г.)', avatar: '🦸‍♀️', kindergartenId: newKg.id },
    ];
    const nextKgs = [newKg, ...kindergartens];
    const nextTeachers = [...defaultTeachers, ...teachers];
    setKindergartens(nextKgs);
    setTeachers(nextTeachers);
    setActiveKgId(newKg.id);
    setActiveTeacherId(defaultTeachers[0].id);
    try {
      localStorage.setItem('detski_hub_kgs', JSON.stringify(nextKgs));
      localStorage.setItem('detski_hub_teachers', JSON.stringify(nextTeachers));
    } catch {}
  };

  const handleAddTeacher = (name: string, role: string, ageGroup: AgeGroup, groupName: string, avatar: string) => {
    const newT: TeacherProfile = {
      id: `t-${Date.now()}`,
      name,
      role,
      ageGroup,
      groupName,
      avatar,
      kindergartenId: activeKindergarten.id,
    };
    const next = [...teachers, newT];
    setTeachers(next);
    setActiveTeacherId(newT.id);
    try { localStorage.setItem('detski_hub_teachers', JSON.stringify(next)); } catch {}
  };

  const handleSaveGameToBank = (game: GeneratedGame, filters: GameFilterState) => {
    const newEntry: SavedBankGame = {
      id: `bank-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      kindergartenId: activeKindergarten.id,
      kindergartenName: activeKindergarten.name,
      authorId: activeTeacher.id,
      authorName: activeTeacher.name,
      authorAvatar: activeTeacher.avatar,
      authorGroupName: activeTeacher.groupName,
      ageGroup: filters.ageGroup,
      mood: filters.mood,
      location: filters.location,
      resources: filters.resources,
      createdAt: 'Току-що',
      likes: 1,
      likedByMe: true,
      game,
    };
    const next = [newEntry, ...bankGames];
    setBankGames(next);
    try { localStorage.setItem('detski_hub_bank', JSON.stringify(next)); } catch {}
  };

  const handleAddCustomBankGame = (title: string, ageGroup: AgeGroup, rhymeText: string, stepsText: string, goal: string) => {
    const newEntry: SavedBankGame = {
      id: `bank-${Date.now()}`,
      kindergartenId: activeKindergarten.id,
      kindergartenName: activeKindergarten.name,
      authorId: activeTeacher.id,
      authorName: activeTeacher.name,
      authorAvatar: activeTeacher.avatar,
      authorGroupName: activeTeacher.groupName,
      ageGroup,
      mood: 'noisy',
      location: 'classroom',
      resources: 'none',
      createdAt: 'Току-що',
      likes: 1,
      likedByMe: true,
      game: {
        id: `custom-${Date.now()}`,
        title,
        subtitle: `Авторска практика от ${activeTeacher.name} (${activeKindergarten.name})`,
        tags: ['Авторска игра', AGE_GROUP_LABELS[ageGroup].ageRange, activeKindergarten.name],
        badgeColor: 'mint',
        rhymeTitle: '📜 Римуван стих / закачка за старт:',
        rhymeLines: rhymeText.split('\n').filter(Boolean),
        steps: stepsText.split('\n').filter(Boolean),
        pedagogicalGoal: goal,
        teacherTip: `Споделено в колективната банка на ${activeKindergarten.name}.`,
      },
    };
    const next = [newEntry, ...bankGames];
    setBankGames(next);
    try { localStorage.setItem('detski_hub_bank', JSON.stringify(next)); } catch {}
  };

  const handleToggleLikeGame = (bankId: string) => {
    const next = bankGames.map((item) => {
      if (item.id !== bankId) return item;
      const liked = !item.likedByMe;
      return { ...item, likedByMe: liked, likes: liked ? item.likes + 1 : Math.max(0, item.likes - 1) };
    });
    setBankGames(next);
    try { localStorage.setItem('detski_hub_bank', JSON.stringify(next)); } catch {}
  };

  const handleSaveSettings = (s: AISettings) => {
    setAiSettings(s);
    try { localStorage.setItem('detski_ai_settings', JSON.stringify(s)); } catch {}
  };

  const handleTimeSaved = (m: number) => {
    setSavedMinutes((p) => p + m);
    setLastSavedGain(m);
    setTimeout(() => setLastSavedGain((c) => (c === m ? null : c)), 5500);
  };

  return (
    <div className={`min-h-screen flex flex-col ${projectorMode ? 'text-lg' : 'text-base'}`}>
      <Header
        activeModule={activeModule}
        onSelectModule={setActiveModule}
        savedMinutes={savedMinutes}
        lastSavedGain={lastSavedGain}
        aiSettings={aiSettings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        projectorMode={projectorMode}
        onToggleProjectorMode={() => setProjectorMode((p) => !p)}
        kindergartens={kindergartens}
        activeKindergarten={activeKindergarten}
        onSelectKindergarten={handleSelectKindergarten}
        teachersInKg={teachersInKg}
        activeTeacher={activeTeacher}
        onSelectTeacher={(t) => setActiveTeacherId(t.id)}
        bankGamesCount={bankGames.length}
        onOpenRegisterModal={() => setActiveModule('hub')}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeModule === 'games' && (
          <MagicGamesModule
            aiSettings={aiSettings}
            onTimeSaved={handleTimeSaved}
            projectorMode={projectorMode}
            activeTeacher={activeTeacher}
            activeKindergarten={activeKindergarten}
            onSaveGameToBank={handleSaveGameToBank}
            onOpenHub={() => setActiveModule('hub')}
          />
        )}
        {activeModule === 'hub' && (
          <TeacherHubModule
            kindergartens={kindergartens}
            activeKindergarten={activeKindergarten}
            onSelectKindergarten={handleSelectKindergarten}
            onAddKindergarten={handleAddKindergarten}
            teachers={teachers}
            activeTeacher={activeTeacher}
            onSelectTeacher={(t) => setActiveTeacherId(t.id)}
            onAddTeacher={handleAddTeacher}
            bankGames={bankGames}
            onToggleLikeGame={handleToggleLikeGame}
            onAddCustomBankGame={handleAddCustomBankGame}
            onNavigateToGenerator={() => setActiveModule('games')}
            projectorMode={projectorMode}
          />
        )}
        {activeModule === 'dos' && (
          <LiveDosModule
            aiSettings={aiSettings}
            onTimeSaved={handleTimeSaved}
            projectorMode={projectorMode}
          />
        )}
        {activeModule === 'prompts' && (
          <GoldenPromptsModule
            aiSettings={aiSettings}
            onTimeSaved={handleTimeSaved}
            projectorMode={projectorMode}
          />
        )}
      </main>

      <footer className="no-print mt-12 border-t border-violet-100 bg-white/80 backdrop-blur-sm py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-slate-600">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <Wand2 className="w-4 h-4 text-violet-600" />
            <span>„Магическа кутия с игри & Учителски хъб“</span>
            <span className="text-slate-300">•</span>
            <span className="text-emerald-700 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" />
              Активна ДГ: {activeKindergarten.name} ({activeTeacher.name})
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500">
            <span>Създадено с</span>
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
            <span>за практическа квалификация: „Изкуственият интелект в работата на учителя в детската градина“</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
        </div>
      </footer>

      <AISettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={aiSettings}
        onSaveSettings={handleSaveSettings}
      />
    </div>
  );
}

export default App;
