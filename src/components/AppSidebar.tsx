"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Dices,
  Rocket,
  BookMarked,
  Building2,
  User as UserIcon,
  X,
  LogOut,
  Mail,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { LogoIcon, LogoWordmark } from "./Logo";
import { performSignOut } from "@/lib/session-cache";
import { useMe } from "@/lib/client/useMe";

// Копирано от МатураПлюс (src/components/AppSidebar.tsx): групи с навигация, активен елемент
// с плътен бранд цвят, сгъване до иконки, профилна карта / вход в долната част.

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    title: "AI ИНСТРУМЕНТИ",
    items: [
      { href: "/games", label: "Магическа кутия с игри", icon: Dices },
      { href: "/dos", label: "ДОС план за 10 сек", icon: Rocket },
      { href: "/prompts", label: "Златни промптове", icon: BookMarked },
    ],
  },
  {
    title: "ДЕТСКАТА ГРАДИНА",
    items: [
      { href: "/hub", label: "Учителски хъб и банка", icon: Building2 },
      { href: "/profile", label: "Моят профил", icon: UserIcon },
    ],
  },
];

type Props = {
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
};

export function AppSidebar({ collapsed, mobileOpen, onCloseMobile }: Props) {
  const pathname = usePathname();
  const { user } = useMe();

  const isLoggedIn = Boolean(user);
  const userName = user?.name || user?.email?.split("@")[0] || "Учител";
  const kgName = user?.kindergarten?.name ?? null;

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const width = collapsed ? "md:w-16" : "md:w-64";

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-stone-950/60 backdrop-blur-sm md:hidden"
          onClick={onCloseMobile}
          aria-hidden
        />
      )}

      <aside
        data-app-sidebar
        className={`fixed left-0 top-0 z-50 flex h-screen w-64 shrink-0 flex-col border-r border-stone-200/75 bg-white transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } md:sticky md:top-0 md:translate-x-0 ${width}`}
      >
        <div className="flex h-16 items-center justify-between border-b border-stone-200/75 px-4">
          {!collapsed && (
            <Link href="/games" className="group flex items-center gap-2.5" onClick={onCloseMobile}>
              <LogoIcon className="h-8 w-8 shrink-0 transition-transform group-hover:scale-105" />
              <LogoWordmark />
            </Link>
          )}
          {collapsed && (
            <Link
              href="/games"
              className="mx-auto flex h-8 w-8 items-center justify-center transition-transform hover:scale-105"
              title="Детски AI — Начало"
            >
              <LogoIcon className="h-8 w-8 shrink-0" />
            </Link>
          )}
          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-900 md:hidden"
            aria-label="Затвори менюто"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4" aria-label="Основна навигация">
          {NAV_GROUPS.map((group, groupIdx) => (
            <div key={group.title} className={groupIdx > 0 ? "pt-3 border-t border-stone-200/70" : ""}>
              {!collapsed ? (
                <p className="mb-2 px-2.5 text-xs font-bold uppercase tracking-wider text-stone-500">{group.title}</p>
              ) : (
                <div className="mb-2 mx-auto h-px w-8 bg-stone-200" aria-hidden />
              )}
              <ul className="space-y-1.5">
                {group.items.map(({ href, label, icon: Icon }) => {
                  const active = isActive(href);
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        onClick={onCloseMobile}
                        title={collapsed ? label : undefined}
                        aria-current={active ? "page" : undefined}
                        className={`group flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c2410c] ${
                          active
                            ? "bg-[#c2410c] text-white shadow-xs"
                            : "text-stone-700 hover:bg-stone-100 hover:text-stone-900"
                        } ${collapsed ? "justify-center px-2" : ""}`}
                      >
                        <Icon
                          className={`h-5 w-5 shrink-0 transition-transform group-hover:scale-105 ${
                            active ? "text-white" : "text-stone-500 group-hover:text-stone-800"
                          }`}
                        />
                        {!collapsed && <span className="truncate">{label}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Профилна карта / вход */}
        {collapsed ? (
          <div className="border-t border-stone-200/75 p-2 flex flex-col items-center gap-2.5">
            {isLoggedIn ? (
              <>
                <div
                  title={`${userName}${kgName ? ` (${kgName})` : ""}`}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fff4eb] text-lg ring-1 ring-stone-200"
                >
                  {user?.avatar || "👩‍🏫"}
                </div>
                <button
                  type="button"
                  onClick={() => void performSignOut()}
                  title="Изход"
                  className="grid h-8 w-8 place-items-center rounded-lg text-stone-500 hover:bg-rose-50 hover:text-rose-600 active:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 transition-colors duration-150"
                  aria-label="Изход"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <Link
                href="/login"
                title="Вход с имейл и парола"
                aria-label="Вход с имейл и парола"
                className="grid h-9 w-9 place-items-center rounded-xl border border-stone-200/75 bg-white text-[#c2410c] shadow-2xs transition-colors duration-150 hover:bg-stone-50 active:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c2410c]"
              >
                <Mail className="h-4 w-4" aria-hidden />
              </Link>
            )}
          </div>
        ) : (
          <div className="border-t border-stone-200/75 p-3 space-y-2.5">
            <div className="rounded-xl border border-stone-200/80 bg-stone-50/70 p-2 text-center">
              <p className="text-xs font-semibold text-stone-800 flex items-center justify-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" />
                {kgName ?? "Детски AI Асистент"}
              </p>
              <p className="mt-0.5 text-xs text-[#166534] font-medium">
                {isLoggedIn ? "Колективна банка на екипа" : "Влез за общата банка с игри"}
              </p>
            </div>

            {isLoggedIn ? (
              <div className="flex items-center gap-3 rounded-2xl border border-stone-200/75 bg-stone-50/70 p-2.5 shadow-2xs">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fff4eb] text-xl ring-1 ring-stone-900/5">
                  {user?.avatar || "👩‍🏫"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-stone-900" title={userName}>
                    {userName}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-stone-500" title={user?.groupName || user?.jobTitle}>
                    {user?.groupName || user?.jobTitle}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void performSignOut()}
                  title="Изход"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-stone-500 hover:bg-rose-50 hover:text-rose-600 active:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 transition-colors duration-150"
                  aria-label="Изход от профила"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Link
                  href="/register"
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#c2410c] px-3.5 py-2.5 text-xs font-bold text-white shadow-xs transition-colors duration-150 hover:bg-[#9a3412] active:bg-[#7c2d12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c2410c] focus-visible:ring-offset-2"
                >
                  <UserPlus className="h-4 w-4 shrink-0" aria-hidden />
                  <span>Регистрирай градината си</span>
                </Link>
                <Link
                  href="/login"
                  className="flex w-full items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold text-[#c2410c] transition-colors duration-150 hover:bg-orange-50 active:bg-orange-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c2410c]"
                >
                  <Mail className="h-4 w-4 shrink-0" aria-hidden />
                  <span>Вход с имейл и парола</span>
                </Link>
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
