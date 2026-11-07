"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  User as UserIcon,
  LogIn,
  UserPlus,
  LogOut,
  Building2,
  ChevronDown,
  Clock,
  Monitor,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { LogoIcon, LogoWordmark } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { performSignOut } from "@/lib/session-cache";
import { useMe } from "@/lib/client/useMe";
import { useAppStore } from "@/store/appStore";

// Копирано от МатураПлюс (src/components/AppTopBar.tsx): лепкава лента с бутони за менюто,
// лого на мобилни, вход/регистрация за гости и падащо профилно меню. Вместо серия и XP —
// брояч на спестеното време, режим „Проектор“ и индикатор дали работи истински AI.

type Props = {
  onOpenMobile: () => void;
  onToggleCollapse: () => void;
  collapsed: boolean;
};

export function AppTopBar({ onOpenMobile, onToggleCollapse, collapsed }: Props) {
  const { user, loading } = useMe();
  const savedMinutes = useAppStore((s) => s.savedMinutes);
  const lastSavedGain = useAppStore((s) => s.lastSavedGain);
  const projectorMode = useAppStore((s) => s.projectorMode);
  const toggleProjectorMode = useAppStore((s) => s.toggleProjectorMode);

  const [aiLive, setAiLive] = useState<boolean | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/ai/status", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { ai?: boolean } | null) => setAiLive(Boolean(d?.ai)))
      .catch(() => setAiLive(false));
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const firstName = user?.name ? user.name.split(" ").slice(-1)[0] : "Профил";

  return (
    <header
      data-app-topbar
      className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-slate-200/75 bg-white/95 px-3 sm:px-4 backdrop-blur-md"
    >
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={onOpenMobile}
          className="rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 md:hidden touch-manipulation"
          aria-label="Отвори менюто"
        >
          <Menu className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 md:inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a4b82]"
          aria-label={collapsed ? "Разгъни менюто" : "Свий менюто"}
          title={collapsed ? "Разгъни менюто" : "Свий менюто"}
        >
          {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        </button>
        <Link href="/games" className="flex items-center gap-2.5 md:hidden group" aria-label="Детски асистент — Начало">
          <LogoIcon className="h-8 w-8 shrink-0" />
          <LogoWordmark className="hidden text-base sm:inline" />
        </Link>
      </div>

      <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
        {/* Дали отговаря истински AI или вграденият демо двигател */}
        {aiLive !== null && (
          <span
            className={`hidden lg:inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${
              aiLive
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-slate-200 bg-slate-50 text-slate-600"
            }`}
            title={aiLive ? "Сървърът е свързан с Google Gemini" : "Генераторът работи във вградения демо режим"}
          >
            {aiLive ? <Sparkles className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
            {aiLive ? "Gemini" : "Демо режим"}
          </span>
        )}

        {/* Спестено време — на мястото на серията/XP в МатураПлюс */}
        <span
          className={`hidden sm:inline-flex min-h-10 items-center gap-1.5 whitespace-nowrap rounded-lg border px-2.5 text-xs font-medium transition-colors duration-200 ${
            lastSavedGain
              ? "border-[#16a34a] bg-green-50 text-green-900 ring-2 ring-[#16a34a]/40"
              : "border-amber-200/90 bg-amber-50/80 text-amber-900"
          }`}
          title="Спестено време на екипа в тази сесия"
        >
          <Clock className="h-3.5 w-3.5 text-amber-600" />
          <span className="font-bold">~{savedMinutes} мин.</span>
          {lastSavedGain && <span className="hidden sm:inline font-bold text-green-700">+{lastSavedGain}</span>}
        </span>

        <button
          type="button"
          onClick={toggleProjectorMode}
          aria-pressed={projectorMode}
          title="Режим „Проектор“ — по-едър текст за прожекция пред залата"
          className={`hidden sm:inline-flex sm:min-h-9 sm:min-w-9 items-center justify-center gap-1.5 rounded-lg border px-2 text-xs font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a4b82] ${
            projectorMode
              ? "border-[#0a4b82] bg-[#0a4b82] text-white"
              : "border-slate-200/80 bg-slate-50/80 text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Monitor className="h-4 w-4" />
          <span className="hidden xl:inline">Проектор</span>
        </button>

        <ThemeToggle />

        {loading ? (
          <div className="flex items-center gap-2 animate-pulse">
            <div className="h-8 w-16 sm:w-20 rounded-xl bg-slate-200/80" />
          </div>
        ) : !user ? (
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link
              href="/login"
              aria-label="Вход"
              className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-700 transition-colors duration-150 ease-in-out hover:bg-slate-100 active:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a4b82] sm:min-h-0 sm:min-w-0 sm:px-3"
            >
              <LogIn className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
              <span className="hidden sm:inline">Вход</span>
            </Link>
            <Link
              href="/register"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#0a4b82] px-3 py-1.5 text-xs font-bold text-white shadow-xs transition-colors duration-150 ease-in-out hover:bg-[#083861] active:scale-98 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a4b82] focus-visible:ring-offset-2 sm:px-3.5"
            >
              <UserPlus className="hidden h-3.5 w-3.5 sm:block" />
              <span>Регистрация</span>
            </Link>
          </div>
        ) : (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200/75 bg-slate-50/70 p-1.5 pr-2.5 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a4b82]"
              aria-expanded={dropdownOpen}
              aria-label="Потребителско меню"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#eef5fb] text-sm">{user.avatar}</span>
              <span className="hidden font-medium text-slate-800 sm:inline">{firstName}</span>
              <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 origin-top-right rounded-xl border border-slate-200/90 bg-white p-2 text-xs shadow-sm ring-1 ring-black/5 z-50">
                <div className="border-b border-slate-100 px-3 py-2.5">
                  <p className="font-bold text-slate-900 truncate text-sm">{user.name}</p>
                  <p className="mt-0.5 text-xs text-slate-500 truncate">{user.email}</p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-[#083861] border border-indigo-200/60">
                      {user.kgRole === "ADMIN" ? "Администратор на ДГ" : "Учител"}
                    </span>
                  </div>
                </div>
                <div className="py-1.5 space-y-0.5">
                  <Link
                    href="/hub"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                  >
                    <Building2 className="h-4 w-4 text-[#0a4b82]" />
                    <span>{user.kindergarten?.name ?? "Учителски хъб"}</span>
                  </Link>
                  <Link
                    href="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                  >
                    <UserIcon className="h-4 w-4 text-green-600" />
                    <span>Моят профил</span>
                  </Link>
                </div>
                <div className="border-t border-slate-100 pt-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      void performSignOut();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 font-semibold text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 text-rose-500" />
                    <span>Изход от профила</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
