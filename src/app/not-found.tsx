import Link from "next/link";
import { ArrowLeft, BookMarked, Building2, Dices, Rocket } from "lucide-react";

// Копирано от МатураПлюс (src/app/not-found.tsx) — с разделите на детския сайт.

const QUICK_LINKS = [
  { href: "/games", label: "Игри", icon: Dices },
  { href: "/dos", label: "ДОС план", icon: Rocket },
  { href: "/hub", label: "Банка", icon: Building2 },
  { href: "/prompts", label: "Промптове", icon: BookMarked },
];

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4d7a0a] focus-visible:ring-offset-2";

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] flex-col px-4 py-6 text-slate-900 sm:px-6">
      <section className="mx-auto my-auto w-full max-w-xl py-12 text-center">
        <p className="text-6xl font-bold tracking-tight text-[#4d7a0a]">404</p>
        <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">Страницата не е намерена</h1>
        <p className="mx-auto mt-3 max-w-md leading-relaxed text-slate-600">
          Адресът, който търсите, не съществува или е преместен.
        </p>
        <Link
          href="/games"
          className={`mt-8 inline-flex items-center gap-2 rounded-lg bg-[#4d7a0a] px-6 py-3 font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-[#3d6108] active:bg-[#2b4406] ${focusRing}`}
        >
          <ArrowLeft className="h-4 w-4" />
          Към началото
        </Link>
        <nav aria-label="Бързи препратки" className="mt-12 border-t border-slate-200 pt-8">
          <p className="mb-4 text-sm text-slate-500">Или отворете директно:</p>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {QUICK_LINKS.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex flex-col items-center gap-2 rounded-2xl border border-slate-200/80 bg-white p-4 text-sm font-medium text-slate-700 transition-colors duration-150 hover:border-[#4d7a0a]/40 hover:text-[#4d7a0a] active:bg-slate-50 ${focusRing}`}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </section>
    </main>
  );
}
