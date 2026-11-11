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
  Monitor,
  ShieldCheck,
  MessageSquareText,
  Eye,
} from "lucide-react";
import { LogoIcon, LogoWordmark } from "./Logo";
import { openFeedback } from "./FeedbackWidget";
import { ThemeToggle } from "./ThemeToggle";
import { performSignOut } from "@/lib/session-cache";
import { useMe } from "@/lib/client/useMe";
import { useAppStore } from "@/store/appStore";
import { startParentPreview } from "@/lib/parent-preview";

// Копирано от МатураПлюс (src/components/AppTopBar.tsx): лепкава лента с бутони за менюто,
// лого на мобилни, вход/регистрация за гости и падащо профилно меню. Вместо серия и XP —
// режим „Проектор“ в профилното меню и знак, когато генераторът е в демо режим.

type Props = {
  onOpenMobile: () => void;
  onToggleCollapse: () => void;
  collapsed: boolean;
};

export function AppTopBar({ onOpenMobile, onToggleCollapse, collapsed }: Props) {
  const { user, loading } = useMe();
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
      className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b-[3px] border-kg-yellow bg-white/95 px-3 sm:px-4 backdrop-blur-md"
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
        <Link href="/" className="flex items-center gap-2.5 md:hidden group" aria-label="ДГ „Пролет“ — Начало">
          <LogoIcon className="h-10 w-auto shrink-0" />
          <LogoWordmark className="hidden text-base sm:inline-flex" withVillage />
        </Link>
      </div>

      <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
        {/* Само когато сървърът няма ключ: генераторът е в демо режим */}
        {aiLive === false && (
          <span
            className="hidden lg:inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-600"
            title="Генераторът работи във вградения демо режим"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Демо режим
          </span>
        )}

        {/* Как изглежда сайтът за родителите и гостите — с един клик, без излизане от профила */}
        {user && (
          <button
            type="button"
            onClick={startParentPreview}
            title="Виж сайта като родител"
            aria-label="Виж сайта като родител"
            className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-lg border border-slate-200/75 bg-white px-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a4b82] sm:min-h-0 sm:min-w-0 sm:px-3 sm:py-1.5"
          >
            <Eye className="h-4 w-4 text-[#0a4b82]" aria-hidden />
            <span className="hidden lg:inline">Виж като родител</span>
          </button>
        )}

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
                  {/* По-едър текст при показване на проектор или голям екран */}
                  <button
                    type="button"
                    role="menuitemcheckbox"
                    aria-checked={projectorMode}
                    onClick={toggleProjectorMode}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                  >
                    <Monitor className="h-4 w-4 text-slate-500" />
                    <span className="flex-1 text-left">Режим „Проектор“</span>
                    <span
                      aria-hidden
                      className={`relative h-4 w-7 rounded-full transition-colors ${projectorMode ? "bg-[#0a4b82]" : "bg-slate-300"}`}
                    >
                      <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${projectorMode ? "left-3.5" : "left-0.5"}`} />
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      openFeedback();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                  >
                    <MessageSquareText className="h-4 w-4 text-slate-500" />
                    <span>Обратна връзка</span>
                  </button>
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
