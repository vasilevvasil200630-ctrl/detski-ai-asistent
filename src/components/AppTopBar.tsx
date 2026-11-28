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
  ExternalLink,
} from "lucide-react";
import { LogoIcon, LogoWordmark } from "./Logo";
import { openFeedback } from "./FeedbackWidget";
import { ThemeToggle } from "./ThemeToggle";
import { performSignOut } from "@/lib/session-cache";
import { useMe } from "@/lib/client/useMe";
import { useAppStore } from "@/store/appStore";
import { startParentPreview } from "@/lib/parent-preview";
import { KG } from "@/config/kindergarten";

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
      className="kg-menubar sticky top-0 z-30 flex h-16 items-center justify-between gap-3 px-3 sm:px-5"
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <button
          type="button"
          onClick={onOpenMobile}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-kg-yellow-ink transition-colors hover:bg-[#4d7a0a] hover:text-white md:hidden touch-manipulation"
          aria-label="Отвори менюто"
        >
          <Menu className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden rounded-lg p-2 text-kg-yellow-ink transition-colors hover:bg-[#4d7a0a] hover:text-white md:inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kg-yellow-ink"
          aria-label={collapsed ? "Разгъни менюто" : "Свий менюто"}
          title={collapsed ? "Разгъни менюто" : "Свий менюто"}
        >
          {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        </button>
        <Link href="/" className="group flex items-center gap-2.5 md:hidden" aria-label="ДГ „Пролет“ — Начало">
          <LogoIcon className="h-10 w-auto shrink-0" />
          <LogoWordmark className="hidden text-base sm:inline-flex" withVillage />
        </Link>
        <span className="font-hand hidden truncate text-xl font-bold text-kg-yellow-ink md:inline sm:text-2xl">
          Учителски облак · {KG.name}, {KG.village}
        </span>
      </div>

      <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
        {/* Само когато сървърът няма ключ: генераторът е в демо режим */}
        {aiLive === false && (
          <span
            className="hidden items-center gap-1.5 rounded-lg border border-[#cca000] bg-white/90 px-2.5 py-1.5 text-xs font-semibold text-kg-yellow-ink lg:inline-flex"
            title="Генераторът работи във вградения демо режим"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-[#4d7a0a]" />
            Демо режим
          </span>
        )}

        <a
          href={KG.officialSite}
          className="hidden items-center gap-1.5 rounded-lg border border-[#cca000] bg-white/90 px-2.5 py-1.5 text-xs font-semibold text-kg-yellow-ink transition hover:bg-[#4d7a0a] hover:border-[#4d7a0a] hover:text-white xl:inline-flex"
        >
          <span>Официален сайт</span>
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>

        {/* Как изглежда сайтът за родителите и гостите — с един клик, без излизане от профила */}
        {user && (
          <button
            type="button"
            onClick={startParentPreview}
            title="Виж сайта като родител"
            aria-label="Виж сайта като родител"
            className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-lg border border-[#cca000] bg-white/92 px-2 text-xs font-semibold text-kg-yellow-ink transition hover:border-[#4d7a0a] hover:bg-[#4d7a0a] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kg-yellow-ink sm:min-h-0 sm:min-w-0 sm:px-3 sm:py-1.5"
          >
            <Eye className="h-4 w-4 text-[#4d7a0a] group-hover:text-white" aria-hidden />
            <span className="hidden lg:inline">Виж като родител</span>
          </button>
        )}

        <ThemeToggle className="border-[#cca000] bg-white/92 text-kg-yellow-ink hover:bg-white" />

        {loading ? (
          <div className="flex items-center gap-2 animate-pulse">
            <div className="h-8 w-16 rounded-xl bg-white/70 sm:w-20" />
          </div>
        ) : !user ? (
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link
              href="/login"
              aria-label="Вход"
              className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-lg bg-white/90 px-2 py-1.5 text-xs font-semibold text-kg-yellow-ink transition-colors duration-150 ease-in-out hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kg-yellow-ink sm:min-h-0 sm:min-w-0 sm:px-3"
            >
              <LogIn className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
              <span className="hidden sm:inline">Вход</span>
            </Link>
            <Link
              href="/register"
              className="kg-leaf inline-flex shrink-0 items-center gap-1.5 bg-[#4d7a0a] px-3 py-1.5 text-xs font-bold text-white shadow-xs transition-colors duration-150 ease-in-out hover:bg-[#c43d00] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kg-yellow-ink sm:px-3.5"
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
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#cca000] bg-white/95 p-1.5 pr-2.5 text-xs font-semibold text-[#2e2e2e] transition hover:bg-white touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kg-yellow-ink"
              aria-expanded={dropdownOpen}
              aria-label="Потребителско меню"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f4f9e8] text-sm">{user.avatar}</span>
              <span className="hidden font-semibold text-[#2e2e2e] sm:inline">{firstName}</span>
              <ChevronDown className={`h-3.5 w-3.5 text-kg-yellow-ink transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 z-50 mt-2 w-64 origin-top-right rounded-xl border border-[#e6cf67] bg-[#fffef9] p-2 text-xs shadow-md ring-1 ring-black/5">
                <div className="border-b border-[#f2dd77] px-3 py-2.5">
                  <p className="truncate text-sm font-bold text-[#2e2e2e]">{user.name}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-600">{user.email}</p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-full border border-[#cfe69e] bg-[#f4f9e8] px-2.5 py-0.5 text-xs font-bold text-[#3d6108]">
                      {user.kgRole === "ADMIN" ? "Администратор на ДГ" : "Учител"}
                    </span>
                  </div>
                </div>
                <div className="space-y-0.5 py-1.5">
                  <Link
                    href="/hub"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium text-[#2e2e2e] transition-colors hover:bg-[#fff6c7]"
                  >
                    <Building2 className="h-4 w-4 text-[#4d7a0a]" />
                    <span>{user.kindergarten?.name ?? "Учителски хъб"}</span>
                  </Link>
                  <Link
                    href="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium text-[#2e2e2e] transition-colors hover:bg-[#fff6c7]"
                  >
                    <UserIcon className="h-4 w-4 text-[#c43d00]" />
                    <span>Моят профил</span>
                  </Link>
                  <button
                    type="button"
                    role="menuitemcheckbox"
                    aria-checked={projectorMode}
                    onClick={toggleProjectorMode}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 font-medium text-[#2e2e2e] transition-colors hover:bg-[#fff6c7]"
                  >
                    <Monitor className="h-4 w-4 text-[#4d7a0a]" />
                    <span className="flex-1 text-left">Режим „Проектор“</span>
                    <span
                      aria-hidden
                      className={`relative h-4 w-7 rounded-full transition-colors ${projectorMode ? "bg-[#4d7a0a]" : "bg-slate-300"}`}
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
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 font-medium text-[#2e2e2e] transition-colors hover:bg-[#fff6c7]"
                  >
                    <MessageSquareText className="h-4 w-4 text-[#c43d00]" />
                    <span>Обратна връзка</span>
                  </button>
                </div>
                <div className="border-t border-[#f2dd77] pt-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      void performSignOut();
                    }}
                    className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 font-semibold text-[#c43d00] transition-colors hover:bg-[#fff3eb]"
                  >
                    <LogOut className="h-4 w-4 text-[#c43d00]" />
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
