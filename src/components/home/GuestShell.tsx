"use client";

import Link from "next/link";
import { LogoIcon, LogoWordmark } from "@/components/Logo";
import { KG } from "@/config/kindergarten";
import { SiteFooter } from "./SiteFooter";

/**
 * Рамката на сайта за родителите и гостите: марката на градината, „Дейности“ и малка връзка
 * „Вход за учители“. Менюто с инструментите се показва едва след вход — облакът е затворен.
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
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <header className="border-b border-slate-200 print:hidden">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5" aria-label={`${KG.siteName} — начало`}>
            <LogoIcon className="h-9 w-9" />
            <LogoWordmark className="text-lg" withVillage />
          </Link>
          <nav aria-label="Основно меню" className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/vitrina"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-[#0a4b82] transition-colors duration-150 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a4b82]"
            >
              Дейности
            </Link>
            <Link
              href="/login"
              className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a4b82]"
            >
              <span className="sm:hidden">Вход</span>
              <span className="hidden sm:inline">Вход за учители</span>
            </Link>
          </nav>
        </div>
      </header>
      <div className="flex-1">{children}</div>
      <div className="print:hidden">
        <SiteFooter compact={footer === "compact"} />
      </div>
    </div>
  );
}
