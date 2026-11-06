import React from "react";

// Същата структура като Logo.tsx в МатураПлюс (LogoIcon + текстова марка с два цвята),
// но с емблема за детската градина: вълшебна кутия с излитаща звезда.

export interface LogoIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export const LogoIcon = React.memo(function LogoIcon({ className = "h-8 w-8", ...props }: LogoIconProps) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden {...props}>
      {/* Кутия */}
      <rect x="16" y="46" width="68" height="44" rx="10" fill="#0a4b82" />
      <rect x="16" y="46" width="68" height="12" rx="6" fill="#083861" />
      {/* Панделка */}
      <rect x="45" y="46" width="10" height="44" fill="#f59e0b" />
      {/* Отворен капак */}
      <path d="M12 40L50 30L88 40L86 48H14Z" fill="#0e5e9e" />
      {/* Звезда, която излита */}
      <path
        d="M50 4l4.6 9.4 10.4 1.5-7.5 7.3 1.8 10.3L50 27.6l-9.3 4.9 1.8-10.3-7.5-7.3 10.4-1.5z"
        fill="#f59e0b"
        stroke="#b45309"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Листенце (растеж) */}
      <path d="M70 22c8-1 13 3 14 9-7 1-12-2-14-9z" fill="#1ea858" />
      <path d="M30 22c-8-1-13 3-14 9 7 1 12-2 14-9z" fill="#1ea858" opacity="0.75" />
    </svg>
  );
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

export function LogoWordmark({ className = "text-base" }: { className?: string }) {
  return (
    <span className={`font-sans font-bold tracking-tight ${className}`}>
      <span className="text-[#0a4b82]">Детски</span>
      <span className="text-[#1ea858]">AI</span>
    </span>
  );
}
