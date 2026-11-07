import Link from "next/link";
import { LogoIcon, LogoWordmark } from "@/components/Logo";

const LINKS = [
  { title: "Инструменти", items: [["/games", "Магическа кутия с игри"], ["/dos", "ДОС план-конспект"], ["/prompts", "Златни промптове"]] },
  { title: "Детската градина", items: [["/hub", "Учителски хъб"], ["/library", "Моята библиотека"], ["/holidays", "Празници"]] },
  { title: "Справочник", items: [["/naredba5", "Наредба № 5 и „Златно ключе“"], ["/login", "Вход"], ["/register", "Регистрация"]] },
] as const;

/** Долната част на сайта: навигация и нормативна основа. */
export function SiteFooter({ compact = false }: { compact?: boolean }) {
  const year = new Date().getFullYear();
  if (compact) {
    return (
      <footer className="border-t border-slate-200 px-4 py-5 text-xs text-slate-500 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <span>© {year} Детски асистент · Съобразено с Наредба № 5 за предучилищното образование</span>
          <nav aria-label="Връзки в долната част" className="flex flex-wrap gap-4">
            <Link href="/naredba5" className="hover:text-slate-800">Наредба № 5</Link>
            <Link href="/holidays" className="hover:text-slate-800">Празници</Link>
            <Link href="/library" className="hover:text-slate-800">Библиотека</Link>
          </nav>
        </div>
      </footer>
    );
  }
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.3fr_repeat(3,1fr)]">
        <div>
          <Link href="/" className="flex items-center gap-2.5">
            <LogoIcon className="h-8 w-8" />
            <LogoWordmark className="text-base" />
          </Link>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-600">
            Платформа за учителите в детската градина. Съобразена с Наредба № 5 за предучилищното образование.
          </p>
        </div>
        {LINKS.map((group) => (
          <nav key={group.title} aria-label={group.title}>
            <p className="text-sm font-semibold text-slate-900">{group.title}</p>
            <ul className="mt-3 space-y-2 text-sm">
              {group.items.map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="text-slate-600 hover:text-[#0a4b82]">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-slate-100">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-slate-500 sm:px-6">© {year} Детски асистент</p>
      </div>
    </footer>
  );
}
