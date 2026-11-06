"use client";

import React from "react";
import { Glasses } from "lucide-react";
import { useEyeCare } from "@/lib/theme";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const { isEyeCare, mounted, toggleEyeCare } = useEyeCare();

  return (
    <button
      type="button"
      onClick={toggleEyeCare}
      aria-label={
        isEyeCare
          ? "Изключи щадящ режим за очите"
          : "Включи щадящ режим за очите (Eye-Care)"
      }
      title={
        !mounted
          ? "Щадящ зрението режим"
          : isEyeCare
            ? "Щадящ зрението режим (Активен) — кликнете за стандартен режим"
            : "Щадящ зрението режим (Eye-Care) — топла гама без отблясъци за продължително четене"
      }
      className={`group relative inline-flex min-h-[44px] min-w-[44px] sm:min-h-9 sm:min-w-9 items-center justify-center rounded-lg border p-2 transition-all duration-300 active:scale-98 cursor-pointer select-none ${
        mounted && isEyeCare
          ? "border-amber-300 bg-amber-50 text-amber-900 shadow-xs ring-1 ring-amber-300/60"
          : "border-slate-200/80 bg-slate-50/80 text-slate-600 hover:border-amber-200 hover:bg-amber-50/40 hover:text-amber-800"
      } ${className}`}
    >
      <span className="sr-only">Щадящ зрението режим</span>

      <Glasses
        className={`h-4 w-4 transition-transform duration-300 group-hover:scale-110 ${
          mounted && isEyeCare ? "text-amber-700" : "text-slate-600"
        }`}
      />
    </button>
  );
}

export default ThemeToggle;
