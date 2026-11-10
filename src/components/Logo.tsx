import React from "react";
import Image from "next/image";
import { KG } from "@/config/kindergarten";

// Логото е същото като на официалния сайт на ДГ „Пролет“ (dg-yagodovo.com): дървото с ръчички и децата.
// Марката е с ръкописния шрифт и зеленото на официалния сайт.

export interface LogoIconProps {
  className?: string;
  /** За логото над формата за вход — зарежда се веднага */
  priority?: boolean;
}

export const LogoIcon = React.memo(function LogoIcon({ className = "h-8 w-8", priority = false }: LogoIconProps) {
  return <Image src={KG.logo} alt="" aria-hidden width={124} height={135} priority={priority} className={`object-contain ${className}`} />;
});

export interface LogoProps {
  className?: string;
  showText?: boolean;
}

export default React.memo(function Logo({ className = "h-9 w-auto", showText = true }: LogoProps) {
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <LogoIcon className="h-full w-auto shrink-0" />
      {showText && <LogoWordmark className="text-xl" />}
    </div>
  );
});

/** Марката на облака: „ДГ „Пролет““ с ръкописния шрифт и по желание селото на втори ред. */
export function LogoWordmark({ className = "text-base", withVillage = false }: { className?: string; withVillage?: boolean }) {
  return (
    <span className={`inline-flex flex-col leading-none ${className}`}>
      <span className="kg-wordmark font-hand whitespace-nowrap text-[1.35em] leading-[1.05] text-kg-green-ink">{KG.name}</span>
      {withVillage && <span className="mt-1 whitespace-nowrap font-sans text-[0.7em] font-medium tracking-tight text-slate-500">{KG.village}</span>}
    </span>
  );
}
