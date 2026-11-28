"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Dices,
  LayoutDashboard,
  Rocket,
  BookMarked,
  BookOpenCheck,
  Library,
  CalendarHeart,
  Building2,
  User as UserIcon,
  X,
  LogOut,
  Mail,
  UserPlus,
  Printer,
  Cloud,
  NotebookPen,
  UsersRound,
  type LucideIcon,
  Store,
  FolderHeart,
  Megaphone,
  CalendarRange,
  HeartHandshake,
  ChartColumn,
} from "lucide-react";
import { LogoIcon, LogoWordmark } from "./Logo";
import { performSignOut } from "@/lib/session-cache";
import { useMe } from "@/lib/client/useMe";
import { useReminders } from "@/lib/client/reminders";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Само за директора / администратора на облака */
  adminOnly?: boolean;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    title: "Инструменти",
    items: [
      { href: "/", label: "Начало", icon: LayoutDashboard },
      { href: "/games", label: "Магическа кутия с игри", icon: Dices },
      { href: "/materials", label: "Материали за печат", icon: Printer },
      { href: "/dos", label: "ДОС план-конспект", icon: Rocket },
      { href: "/plan", label: "Тематично разпределение", icon: CalendarRange },
      { href: "/prompts", label: "Златни промптове", icon: BookMarked },
    ],
  },
  {
    title: "Детската градина",
    items: [
      { href: "/announcements", label: "Обяви", icon: Megaphone },
      { href: "/cloud", label: "Общ облак", icon: Cloud },
      { href: "/notebook", label: "Моят бележник", icon: NotebookPen },
      { href: "/hub", label: "Учителски хъб и банка", icon: Building2 },
      { href: "/za-roditelite", label: "За родителите", icon: HeartHandshake },
      { href: "/showcase", label: "Витрина за родители", icon: Store },
      { href: "/library", label: "Моята библиотека", icon: Library },
      { href: "/portfolio", label: "Моето портфолио", icon: FolderHeart },
      { href: "/holidays", label: "Празници", icon: CalendarHeart },
      { href: "/naredba5", label: "Наредба 5 и „Златно ключе“", icon: BookOpenCheck },
      { href: "/otcheti", label: "Отчети", icon: ChartColumn, adminOnly: true },
      { href: "/team", label: "Управление на екипа", icon: UsersRound, adminOnly: true },
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

  // Брой непрочетени обяви — при смяна на страницата и след „Прочетох“
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    if (!user?.kindergarten) return;
    let active = true;
    const refresh = () =>
      fetch("/api/announcements?unread=1", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : { unread: 0 }))
        .then((d: { unread?: number }) => active && setUnread(d.unread ?? 0))
        .catch(() => undefined);
    void refresh();
    window.addEventListener("detski-announcements-changed", refresh);
    return () => {
      active = false;
      window.removeEventListener("detski-announcements-changed", refresh);
    };
  }, [user?.kindergarten, pathname]);

  // Напомнянията за днес от бележника
  const reminders = useReminders().reminders.length;

  const width = collapsed ? "md:w-16" : "md:w-64";

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-xs md:hidden"
          onClick={onCloseMobile}
          aria-hidden
        />
      )}

      <aside
        data-app-sidebar
        className={`fixed left-0 top-0 z-50 flex h-screen w-64 shrink-0 flex-col border-r border-[#e6cf67] bg-[#fffef8]/96 backdrop-blur-sm transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } md:sticky md:top-0 md:translate-x-0 ${width}`}
      >
        {/* Шапка с небето и логото като на dg-yagodovo.com */}
        <div className="kg-sky flex h-16 items-center justify-between border-b-[3px] border-kg-yellow px-3.5">
          {!collapsed && (
            <Link href="/" className="group flex items-center gap-2.5" onClick={onCloseMobile}>
              <LogoIcon className="h-11 w-auto shrink-0 transition-transform" />
              <LogoWordmark withVillage />
            </Link>
          )}
          {collapsed && (
            <Link
              href="/"
              className="mx-auto flex h-10 w-10 items-center justify-center transition-colors"
              title="ДГ „Пролет“ — Начало"
            >
              <LogoIcon className="h-10 w-auto shrink-0" />
            </Link>
          )}
          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-lg p-1.5 text-[#3d2f00] hover:bg-white/80 md:hidden"
            aria-label="Затвори менюто"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4" aria-label="Основна навигация">
          {NAV_GROUPS.map((group, groupIdx) => (
            <div key={group.title} className={groupIdx > 0 ? "border-t-2 border-kg-yellow/75 pt-3" : ""}>
              {!collapsed ? (
                <p className="font-hand mb-1.5 px-2.5 text-xl font-bold text-kg-orange-ink">{group.title}</p>
              ) : (
                <div className="mx-auto mb-2 h-0.5 w-8 bg-kg-yellow" aria-hidden />
              )}
              <ul className="space-y-1">
                {group.items
                  .filter((item) => !item.adminOnly || user?.kgRole === "ADMIN")
                  .map(({ href, label, icon: Icon }) => {
                    const active = isActive(href);
                    return (
                      <li key={href}>
                        <Link
                          href={href}
                          onClick={onCloseMobile}
                          title={collapsed ? label : undefined}
                          aria-current={active ? "page" : undefined}
                          className={`group flex items-center gap-3 rounded-[7px] px-3 py-2 text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4d7a0a] ${
                            active
                              ? "bg-[#4d7a0a] text-white shadow-xs"
                              : "text-[#2e2e2e] hover:bg-[#fff4b8] hover:text-[#3d2f00]"
                          } ${collapsed ? "justify-center px-2" : ""}`}
                        >
                          <Icon
                            className={`h-5 w-5 shrink-0 transition-colors ${
                              active ? "text-[#faca04]" : "text-[#4d7a0a] group-hover:text-[#c43d00]"
                            }`}
                          />
                          {!collapsed && <span className="truncate">{label}</span>}
                          {href === "/notebook" && reminders > 0 && (
                            <span
                              className={`ml-auto grid min-w-5 place-items-center rounded-full bg-[#c43d00] px-1.5 text-xs font-bold text-white ${collapsed ? "absolute -mt-6 ml-6" : ""}`}
                              aria-label={`${reminders} ${reminders === 1 ? "напомняне" : "напомняния"}`}
                            >
                              {reminders}
                            </span>
                          )}
                          {href === "/announcements" && unread > 0 && (
                            <span
                              className={`ml-auto grid min-w-5 place-items-center rounded-full bg-kg-yellow px-1.5 text-xs font-bold text-kg-yellow-ink ${collapsed ? "absolute -mt-6 ml-6" : ""}`}
                              aria-label={`${unread} непрочетени`}
                            >
                              {unread}
                            </span>
                          )}
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
          <div className="flex flex-col items-center gap-2.5 border-t border-[#e6cf67] bg-kg-cream/80 p-2">
            {isLoggedIn ? (
              <>
                <div
                  title={`${userName}${kgName ? ` (${kgName})` : ""}`}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f4f9e8] text-lg ring-1 ring-[#cfe69e]"
                >
                  {user?.avatar || "👩‍🏫"}
                </div>
                <button
                  type="button"
                  onClick={() => void performSignOut()}
                  title="Изход"
                  className="grid h-8 w-8 place-items-center rounded-lg text-slate-600 transition-colors duration-150 hover:bg-[#fff3eb] hover:text-[#c43d00] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c43d00]"
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
                className="grid h-9 w-9 place-items-center rounded-xl border border-[#e6cf67] bg-white text-[#4d7a0a] shadow-2xs transition-colors duration-150 hover:bg-[#f4f9e8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4d7a0a]"
              >
                <Mail className="h-4 w-4" aria-hidden />
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-2.5 border-t border-[#e6cf67] bg-kg-cream/65 p-3">
            <div className="rounded-lg border border-[#e6cf67] bg-kg-cream p-2 text-center">
              <p className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#2e2e2e]">
                <span className="h-2 w-2 rounded-full bg-[#74a710]" />
                {kgName ?? "ДГ „Пролет“"}
              </p>
              <p className="mt-0.5 text-xs font-semibold text-[#4d7a0a]">
                {isLoggedIn ? "Колективна банка на екипа" : "Влез за общата банка с игри"}
              </p>
            </div>

            {isLoggedIn ? (
              <div className="flex items-center gap-3 rounded-xl border border-[#e6cf67] bg-white p-2.5 shadow-2xs">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f4f9e8] text-xl ring-1 ring-[#cfe69e]">
                  {user?.avatar || "👩‍🏫"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-[#2e2e2e]" title={userName}>
                    {userName}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-600" title={user?.groupName || user?.jobTitle}>
                    {user?.groupName || user?.jobTitle}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void performSignOut()}
                  title="Изход"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-500 transition-colors duration-150 hover:bg-[#fff3eb] hover:text-[#c43d00] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c43d00]"
                  aria-label="Изход от профила"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Link
                  href="/register"
                  className="kg-leaf flex w-full items-center justify-center gap-2 bg-[#4d7a0a] px-3.5 py-2.5 text-xs font-bold text-white shadow-xs transition-colors duration-150 hover:bg-[#c43d00] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4d7a0a] focus-visible:ring-offset-2"
                >
                  <UserPlus className="h-4 w-4 shrink-0" aria-hidden />
                  <span>Регистрирай градината си</span>
                </Link>
                <Link
                  href="/login"
                  className="flex w-full items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold text-[#4d7a0a] transition-colors duration-150 hover:bg-[#fff4b8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4d7a0a]"
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
