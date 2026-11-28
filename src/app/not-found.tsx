import Link from "next/link";
import { ArrowLeft, Home, Images, LogIn, Users } from "lucide-react";

const QUICK_LINKS = [
  { href: "/", label: "Начало", icon: Home },
  { href: "/grupi", label: "Нашите групи", icon: Users },
  { href: "/vitrina", label: "Дейности", icon: Images },
  { href: "/login", label: "Вход за учители", icon: LogIn },
];

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4d7a0a] focus-visible:ring-offset-2";

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] flex-col px-4 py-6 text-[#2e2e2e] sm:px-6">
      <section className="mx-auto my-auto w-full max-w-xl py-12 text-center">
        <p className="font-hand text-7xl font-bold tracking-tight text-kg-orange-ink">404</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Страницата не е намерена</h1>
        <p className="mx-auto mt-3 max-w-md leading-relaxed text-slate-700">
          Адресът, който търсите, не съществува или е преместен.
        </p>
        <Link
          href="/"
          className={`kg-leaf mt-8 inline-flex items-center gap-2 bg-[#4d7a0a] px-6 py-3 font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-[#c43d00] active:bg-[#2b4406] ${focusRing}`}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Към началото
        </Link>
        <nav aria-label="Бързи препратки" className="mt-12 border-t-2 border-kg-yellow pt-8">
          <p className="mb-4 text-sm text-slate-600">Или отворете директно:</p>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {QUICK_LINKS.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex flex-col items-center gap-2 rounded-xl border border-[#e6cf67] bg-kg-cream p-4 text-sm font-semibold text-[#2e2e2e] transition-colors duration-150 hover:border-[#4d7a0a] hover:bg-[#f4f9e8] hover:text-[#4d7a0a] ${focusRing}`}
                >
                  <Icon className="h-5 w-5 text-[#4d7a0a]" aria-hidden />
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
