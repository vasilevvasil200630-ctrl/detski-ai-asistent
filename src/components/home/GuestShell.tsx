"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { LogoIcon } from "@/components/Logo";
import { KG } from "@/config/kindergarten";
import { SiteFooter } from "./SiteFooter";

/** Менюто за родителите — в жълтата лента като на официалния сайт */
const NAV = [
  { href: "/", label: "Начало", match: (p: string) => p === "/" },
  { href: "/grupi", label: "Групи", match: (p: string) => p.startsWith("/grupi") },
  { href: "/vitrina", label: "Дейности", match: (p: string) => p.startsWith("/vitrina") },
] as const;

const NAV_LINK =
  "font-hand shrink-0 whitespace-nowrap rounded-lg px-2.5 py-1 text-xl text-kg-yellow-ink transition-colors duration-150 hover:bg-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kg-yellow-ink sm:px-3.5 sm:text-2xl";

/**
 * Рамката на сайта за родителите и гостите — продължение на официалния сайт на градината:
 * същото лого, небето с облаци, ръкописното заглавие и жълтата лента с менюто.
 * Менюто с инструментите се показва едва след вход — облакът е затворен.
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
    <div className="kg-site flex min-h-screen flex-col bg-white text-slate-900">
      <header className="print:hidden">
        <div className="kg-sky">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4">
            <Link href="/" className="flex min-w-0 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4d7a0a] sm:gap-4" aria-label={`${KG.siteName} — начало`}>
              <LogoIcon className="h-14 w-auto shrink-0 sm:h-20" priority />
              <span className="flex min-w-0 flex-col">
                <span className="font-hand text-[2rem] leading-none text-kg-green-ink [text-shadow:0_1px_0_rgb(255_255_255/0.9)] sm:text-[2.75rem]">{KG.name}</span>
                <span className="font-hand mt-1 text-lg leading-tight text-slate-700 sm:truncate sm:text-2xl">{KG.tagline}</span>
              </span>
            </Link>
            <a
              href={KG.officialSite}
              className="hidden shrink-0 items-center gap-1.5 rounded-xl bg-white/80 px-3 py-2 text-sm font-semibold text-[#4d7a0a] shadow-sm ring-1 ring-slate-200/70 transition-colors hover:bg-white md:inline-flex"
            >
              Официален сайт <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          </div>
        </div>
        <nav aria-label="Основно меню" className="bg-kg-yellow shadow-[0_1px_2px_rgb(0_0_0/0.25)]">
          <div className="no-scrollbar mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-3 py-1.5 sm:px-5">
            {NAV.map((item) => {
              const active = item.match(pathname);
              return (
                <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`${NAV_LINK} ${active ? "bg-white/70" : ""}`}>
                  {item.label}
                </Link>
              );
            })}
            <Link href="/login" className={`${NAV_LINK} ml-auto ${pathname === "/login" ? "bg-white/70" : ""}`}>
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
