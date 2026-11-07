"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dices, Rocket, Building2, Library, CalendarHeart } from "lucide-react";

// Копирано от МатураПлюс (src/components/MobileBottomNav.tsx) — с разделите на детския сайт.

const NAV_ITEMS = [
  { href: "/games", label: "Игри", icon: Dices },
  { href: "/dos", label: "ДОС план", icon: Rocket },
  { href: "/library", label: "Библиотека", icon: Library },
  { href: "/hub", label: "Хъб", icon: Building2 },
  { href: "/holidays", label: "Празници", icon: CalendarHeart },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      data-mobile-nav
      aria-label="Бърза мобилна навигация"
      className="fixed bottom-0 inset-x-0 z-30 md:hidden bg-white/95 backdrop-blur-md border-t border-slate-200/75 px-3 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-xs"
    >
      <div className="grid grid-cols-5 gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex flex-col items-center justify-center min-h-[48px] py-1 px-2 rounded-xl transition-all duration-150 active:scale-95 touch-manipulation ${
                isActive ? "text-[#0a4b82] font-semibold bg-[#eef5fb]" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <div className="relative">
                <Icon className={`h-4.5 w-4.5 mb-0.5 ${isActive ? "stroke-[2.2]" : "stroke-[1.75]"}`} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#16a34a] rounded-full shadow-2xs" />
                )}
              </div>
              <span className="text-xs font-medium leading-tight tracking-tight mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
