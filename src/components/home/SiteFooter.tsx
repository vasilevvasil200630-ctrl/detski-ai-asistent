"use client";

import Link from "next/link";
import { LogoIcon, LogoWordmark } from "@/components/Logo";
import { openFeedback } from "@/components/FeedbackWidget";
import { KG, KG_SIGNATURE } from "@/config/kindergarten";

/** Долната част на сайта: какво има за родителите, входът за учители и правните страници. */
const LINKS = [
  { title: "За родителите", items: [["/grupi", "Нашите групи"], ["/vitrina", "Дейности с децата"], ["/", "Предстоящи празници"], [KG.officialSite, "Официалният сайт"]] },
  { title: "За учителите", items: [["/login", "Вход за учители"]] },
  { title: "Справка", items: [["/privacy", "Поверителност"], ["/terms", "Условия за ползване"]] },
] as const;

const FEEDBACK_BUTTON =
  "cursor-pointer text-left underline-offset-4 hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white";

/**
 * Долната част на целия сайт — поляната с цветя (.kg-meadow) и оранжевата лента с бял
 * ръкописен шрифт (.kg-footer), както на официалния сайт на ДГ „Пролет“ (dg-yagodovo.com).
 */
export function SiteFooter({ compact = false, guest = false }: { compact?: boolean; guest?: boolean }) {
  void guest;
  const year = new Date().getFullYear();
  const meadow = <div aria-hidden className={`no-print kg-meadow ${compact ? "h-12 sm:h-16" : "h-20 sm:h-28"}`} />;

  if (compact) {
    return (
      <>
        {meadow}
        <footer className="no-print kg-footer px-4 py-4 text-base sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
            <span>© {year} {KG_SIGNATURE} · Учителски облак · Съобразено с Наредба № 5</span>
            <nav aria-label="Връзки в долната част" className="flex flex-wrap gap-4">
              <Link href="/naredba5">Наредба № 5</Link>
              <Link href="/privacy">Поверителност</Link>
              <Link href="/terms">Условия</Link>
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
      <footer className="no-print kg-footer">
        <div className="mx-auto grid max-w-[73.125rem] gap-10 px-4 py-10 sm:px-6 md:grid-cols-[1.3fr_repeat(3,1fr)]">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <LogoIcon className="h-12 w-auto rounded-lg bg-white/90 p-1" />
              <LogoWordmark className="text-xl" withVillage />
            </Link>
            <p className="mt-3 max-w-xs text-lg leading-relaxed">
              {KG.fullName}, {KG.village}. Игри, дейности и празници от нашите групи — по Наредба № 5 за предучилищното образование.
            </p>
          </div>
          {LINKS.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <p className="text-xl font-bold">{group.title}</p>
              <ul className="mt-2.5 space-y-1.5 text-lg">
                {group.items.map(([href, label]) => (
                  <li key={href}>
                    {href.startsWith("http") ? (
                      <a href={href} className="underline-offset-4 hover:underline">
                        {label}
                      </a>
                    ) : (
                      <Link href={href} className="underline-offset-4 hover:underline">
                        {label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="border-t border-white/30">
          <div className="mx-auto flex max-w-[73.125rem] flex-wrap items-center justify-between gap-3 px-4 py-4 text-base sm:px-6">
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
