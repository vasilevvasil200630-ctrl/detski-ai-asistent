"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { LogoIcon } from "@/components/Logo";
import { KG } from "@/config/kindergarten";
import { SiteFooter } from "./SiteFooter";

/** Менюто за родителите — в жълтата лента като на официалния сайт (dg-yagodovo.com) */
const NAV = [
  { href: "/", label: "Начало", match: (p: string) => p === "/" },
  { href: "/grupi", label: "Групи", match: (p: string) => p.startsWith("/grupi") },
  { href: "/vitrina", label: "Дейности", match: (p: string) => p.startsWith("/vitrina") },
] as const;

const NAV_LINK =
  "kg-menu-link shrink-0 whitespace-nowrap px-3 py-1.5 text-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kg-yellow-ink sm:px-4 sm:text-2xl";

/**
 * Рамката на сайта за родителите и гостите — в стила на официалния сайт на ДГ „Пролет“:
 * небето с облаци, логото с дървото, ръкописното зелено заглавие, жълтата лента с менюто
 * (зелено при посочване, оранжево за активната страница), поляната с цветя и оранжевият футър.
 */
export function GuestShell({
  children,
  footer = "compact",
  variant = "site",
}: {
  children: React.ReactNode;
  footer?: "full" | "compact";
  /** showcase — публичната витрина за родителите: без „Регистрация“, с връзка към витрината */
  variant?: "site" | "showcase";
}) {
  void variant;
  const pathname = usePathname() ?? "/";
  return (
    <div className="kg-site flex min-h-screen flex-col bg-[#fffef9] text-[#2e2e2e]">
      <header className="print:hidden">
        <div className="kg-sky">
          <div className="mx-auto flex max-w-[73.125rem] items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4">
            <Link href="/" className="flex min-w-0 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4d7a0a] sm:gap-4" aria-label={`${KG.siteName} — начало`}>
              <LogoIcon className="h-14 w-auto shrink-0 sm:h-20" priority />
              <span className="flex min-w-0 flex-col">
                <span className="font-hand text-[2.15rem] leading-none text-kg-green-ink [text-shadow:0_1px_0_rgb(255_255_255/0.95)] sm:text-[2.85rem]">{KG.name}</span>
                <span className="font-hand mt-1 text-lg leading-tight text-[#2e2e2e] sm:truncate sm:text-2xl">{KG.tagline}</span>
              </span>
            </Link>
            <a
              href={KG.officialSite}
              className="kg-leaf hidden shrink-0 items-center gap-1.5 bg-[#4d7a0a] px-3.5 py-2 font-hand text-xl text-white shadow-xs transition-colors hover:bg-[#c43d00] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4d7a0a] focus-visible:ring-offset-2 md:inline-flex"
            >
              Официален сайт <ExternalLink className="h-4 w-4" aria-hidden />
            </a>
          </div>
        </div>
        <nav aria-label="Основно меню" className="kg-menubar">
          <div className="no-scrollbar mx-auto flex max-w-[73.125rem] items-center gap-1.5 overflow-x-auto px-3 py-1.5 sm:px-5">
            {NAV.map((item) => {
              const active = item.match(pathname);
              return (
                <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={NAV_LINK}>
                  {item.label}
                </Link>
              );
            })}
            <Link href="/login" aria-current={pathname === "/login" ? "page" : undefined} className={`${NAV_LINK} ml-auto`}>
              <span className="sm:hidden">Вход</span>
              <span className="hidden sm:inline">Вход за учители</span>
            </Link>
          </div>
        </nav>
      </header>
      {/* Като официалния сайт: поляната е фон, съдържанието — в бяла колона */}
      <div className="kg-page flex-1">
        <div className="kg-panel">{children}</div>
      </div>
      <div className="print:hidden">
        <SiteFooter compact={footer === "compact"} guest />
      </div>
    </div>
  );
}
