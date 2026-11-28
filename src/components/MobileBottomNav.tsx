"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Cloud, Dices, NotebookPen, Printer, Rocket } from "lucide-react";
import { useReminders } from "@/lib/client/reminders";

const NAV_ITEMS = [
  { href: "/cloud", label: "Облак", icon: Cloud },
  { href: "/games", label: "Игри", icon: Dices },
  { href: "/materials", label: "Печат", icon: Printer },
  { href: "/dos", label: "ДОС план", icon: Rocket },
  { href: "/notebook", label: "Бележник", icon: NotebookPen },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const reminders = useReminders().reminders.length;

  return (
    <nav
      data-mobile-nav
      aria-label="Бърза мобилна навигация"
      className="fixed inset-x-0 bottom-0 z-30 border-t-[3px] border-kg-yellow bg-[#fffef6]/98 px-3 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-xs backdrop-blur-md md:hidden"
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
              className={`flex min-h-[48px] flex-col items-center justify-center rounded-xl px-2 py-1 transition-all duration-150 active:scale-95 touch-manipulation ${
                isActive ? "bg-[#f4f9e8] font-semibold text-[#4d7a0a]" : "text-[#2e2e2e] hover:bg-[#fff6c7]"
              }`}
            >
              <div className="relative">
                <Icon className={`mb-0.5 h-4.5 w-4.5 ${isActive ? "stroke-[2.2]" : "stroke-[1.75]"}`} />
                {item.href === "/notebook" && reminders > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 grid min-w-4 place-items-center rounded-full bg-[#c43d00] px-1 text-[10px] font-bold leading-4 text-white" aria-label={`${reminders} напомняния`}>
                    {reminders}
                  </span>
                )}
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[#c43d00] shadow-2xs" />
                )}
              </div>
              <span className="mt-0.5 text-xs font-medium leading-tight tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
