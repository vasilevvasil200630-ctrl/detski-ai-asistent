"use client";

import Link from "next/link";
import { LogoIcon, LogoWordmark } from "@/components/Logo";
import { openFeedback } from "@/components/FeedbackWidget";
import { KG, KG_SIGNATURE } from "@/config/kindergarten";

/** Долната част за гостите (родителите): какво има за тях, входът за учители и правните страници. */
const LINKS = [
  { title: "За родителите", items: [["/grupi", "Нашите групи"], ["/vitrina", "Дейности с децата"], ["/", "Предстоящи празници"], [KG.officialSite, "Официалният сайт"]] },
  { title: "За учителите", items: [["/login", "Вход за учители"]] },
  { title: "Справка", items: [["/privacy", "Поверителност"], ["/terms", "Условия за ползване"]] },
] as const;

const FEEDBACK_BUTTON = "cursor-pointer text-left hover:text-slate-800 focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4d7a0a]";

/** Долната част на сайта: навигация, нормативна основа, правни страници и обратна връзка. */
export function SiteFooter({ compact = false, guest = false }: { compact?: boolean; guest?: boolean }) {
  const year = new Date().getFullYear();
  // За родителите: поляната с цветя и оранжевата долна част от официалния сайт
  const meadow = guest ? <div aria-hidden className={`kg-meadow ${compact ? "h-14 sm:h-20" : "h-20 sm:h-28"}`} /> : null;
  if (compact) {
    return (
      <>
      {meadow}
      <footer className={`no-print px-4 py-5 text-xs text-slate-500 sm:px-6 lg:px-8 ${guest ? "kg-footer text-sm" : "border-t border-slate-200"}`}>
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <span>© {year} {KG_SIGNATURE} · Учителски облак · Съобразено с Наредба № 5</span>
          <nav aria-label="Връзки в долната част" className="flex flex-wrap gap-4">
            <Link href="/naredba5" className="hover:text-slate-800">Наредба № 5</Link>
            <Link href="/privacy" className="hover:text-slate-800">Поверителност</Link>
            <Link href="/terms" className="hover:text-slate-800">Условия</Link>
            <button type="button" onClick={openFeedback} className={FEEDBACK_BUTTON}>
              Обратна връзка
            </button>
          </nav>
        </div>
      </footer>
      </>
    );
  }
  return (
    <>
    {meadow}
    <footer className={`no-print ${guest ? "kg-footer" : "border-t border-slate-200 bg-white"}`}>
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.3fr_repeat(3,1fr)]">
        <div>
          <Link href="/" className="flex items-center gap-2.5">
            <LogoIcon className="h-12 w-auto" />
            <LogoWordmark className="text-lg" withVillage />
          </Link>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-600">
            {KG.fullName}, {KG.village}. Игри, дейности и празници от нашите групи — по Наредба № 5 за предучилищното образование.
          </p>
        </div>
        {LINKS.map((group) => (
          <nav key={group.title} aria-label={group.title}>
            <p className="text-sm font-semibold text-slate-900">{group.title}</p>
            <ul className="mt-3 space-y-2 text-sm">
              {group.items.map(([href, label]) => (
                <li key={href}>
                  {href.startsWith("http") ? (
                    <a href={href} className="text-slate-600 hover:text-[#4d7a0a]">
                      {label}
                    </a>
                  ) : (
                    <Link href={href} className="text-slate-600 hover:text-[#4d7a0a]">
                      {label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-slate-100">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-xs text-slate-500 sm:px-6">
          <span>© {year} {KG.fullName}, {KG.village}</span>
          <button type="button" onClick={openFeedback} className={FEEDBACK_BUTTON}>
            Обратна връзка
          </button>
        </div>
      </div>
    </footer>
    </>
  );
}
