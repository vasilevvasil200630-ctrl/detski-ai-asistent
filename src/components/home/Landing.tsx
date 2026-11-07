import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { LogoIcon, LogoWordmark } from "@/components/Logo";
import { NAREDBA5 } from "@/services/naredba5";
import { SiteFooter } from "./SiteFooter";

/** Пример от продукта: как изглежда един план-конспект (по Наредба № 5, III ПГ). */
function PlanPreview() {
  const stages = [
    { part: "Уводна част", min: "5 мин", text: "Куклата Щурчо носи мартеница и загадка за Баба Марта." },
    { part: "Основна част", min: "17 мин", text: "Децата подреждат бели и червени елементи и разказват за обичая." },
    { part: "Заключителна част", min: "3 мин", text: "Всяко дете казва пожелание за здраве на приятел." },
  ];
  return (
    <figure className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <p className="text-xs font-semibold text-[#0a4b82]">План-конспект · III подготвителна група · 25 мин</p>
        <p className="mt-1 text-lg font-bold text-slate-900">Баба Марта</p>
        <p className="mt-0.5 text-sm text-slate-600">Околен свят · ядро „Културни и национални ценности“</p>
      </div>
      <ol className="divide-y divide-slate-100">
        {stages.map((s) => (
          <li key={s.part} className="flex gap-4 px-5 py-3">
            <span className="w-14 shrink-0 text-sm font-semibold tabular-nums text-slate-500">{s.min}</span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-slate-900">{s.part}</span>
              <span className="block text-sm text-slate-600">{s.text}</span>
            </span>
          </li>
        ))}
      </ol>
      <figcaption className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
        Към плана: авторска приказка, въпроси за беседа и бележка за родителите.
      </figcaption>
    </figure>
  );
}

const FEATURES = [
  {
    title: "Ситуационни игри",
    text: "Три игри според групата, настроението на децата, мястото и наличните материали — с римуван стих за начало, стъпки и адаптация за дете със СОП.",
    href: "/games",
  },
  {
    title: "План-конспект по ДОС",
    text: "Педагогическа ситуация с образователно ядро, цели, очаквани резултати и ход в три части, авторска приказка и бележка за родителите.",
    href: "/dos",
  },
  {
    title: "Библиотека по възрастови групи",
    text: "Всичко създадено се пази в профила на учителя, подредено по групи — игри, планове, промптове и собствени материали.",
    href: "/library",
  },
  {
    title: "Обща банка на градината",
    text: "Колегите споделят материалите си с целия екип, харесват ги и ги запазват при себе си с един бутон.",
    href: "/hub",
  },
  {
    title: "Празници",
    text: "Игри и материали за празниците през учебната година — от Деня на будителите до 1 юни.",
    href: "/holidays",
  },
  {
    title: "Безопасност на движението",
    text: "Темите от програмите на МОН по БДП за всяка група, интегрирани в направленията по Наредба № 5.",
    href: "/dos",
  },
];

/** Началната страница за посетители без профил. */
export function Landing() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="border-b border-slate-200">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Детски асистент — начало">
            <LogoIcon className="h-8 w-8" />
            <LogoWordmark className="text-lg" />
          </Link>
          <nav aria-label="Основна навигация" className="flex items-center gap-1 sm:gap-2">
            <Link href="/naredba5" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 md:inline-block">
              Наредба № 5
            </Link>
            <Link href="/holidays" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 md:inline-block">
              Празници
            </Link>
            <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
              Вход
            </Link>
            <Link href="/register" className="rounded-lg bg-[#0a4b82] px-4 py-2 text-sm font-semibold text-white hover:bg-[#083861]">
              Регистрация
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Първи екран: какво е продуктът и за кого */}
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:py-20">
          <div>
            <h1 className="text-balance text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">
              Подготовката за детската градина — на едно място
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
              Ситуационни игри, план-конспекти по ДОС и обща библиотека за целия учителски екип. Съобразено с Наредба № 5 за
              предучилищното образование и програмната система „Златно ключе“.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register" className="inline-flex items-center gap-2 rounded-xl bg-[#0a4b82] px-5 py-3 font-semibold text-white hover:bg-[#083861]">
                Регистрирайте градината <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/games" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-800 hover:bg-slate-50">
                Опитайте без регистрация
              </Link>
            </div>
            <ul className="mt-8 space-y-2 text-sm text-slate-600">
              {["Безплатно за учителите", "Код за присъединяване на колегите", "Работи на компютър, таблет и телефон"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#1ea858]" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <PlanPreview />
        </section>

        {/* Възможностите — списък, не плочки */}
        <section aria-labelledby="features" className="border-t border-slate-200 bg-slate-50/60">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <h2 id="features" className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Какво има в платформата
            </h2>
            <dl className="mt-8 grid gap-x-12 gap-y-8 md:grid-cols-2">
              {FEATURES.map((f) => (
                <div key={f.title} className="border-t border-slate-200 pt-5">
                  <dt className="text-base font-semibold text-slate-900">
                    <Link href={f.href} className="hover:text-[#0a4b82]">
                      {f.title}
                    </Link>
                  </dt>
                  <dd className="mt-1.5 leading-relaxed text-slate-600">{f.text}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Как започва екипът — последователността има значение, затова е номерирана */}
        <section aria-labelledby="start" className="border-t border-slate-200">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <h2 id="start" className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Как започва екипът
              </h2>
              <p className="mt-3 leading-relaxed text-slate-600">Една градина, един код, обща библиотека — без инсталиране.</p>
            </div>
            <ol className="space-y-6">
              {[
                ["Регистрирайте градината", "Първият учител създава профила на детската градина и получава код за колегите."],
                ["Поканете колегите", "Всеки учител се регистрира с кода и избира своята възрастова група."],
                ["Работете заедно", "Генерираното и създаденото се пази по групи и се споделя с екипа с един бутон."],
              ].map(([title, text], i) => (
                <li key={title} className="flex gap-4">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-slate-300 text-sm font-semibold text-slate-700">
                    {i + 1}
                  </span>
                  <span>
                    <span className="block font-semibold text-slate-900">{title}</span>
                    <span className="block leading-relaxed text-slate-600">{text}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Нормативна основа */}
        <section aria-labelledby="standard" className="border-t border-slate-200 bg-slate-50/60">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <h2 id="standard" className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Съобразено с държавния образователен стандарт
            </h2>
            <div className="mt-6 grid gap-8 md:grid-cols-3">
              <p className="leading-relaxed text-slate-600">
                <strong className="font-semibold text-slate-900">{NAREDBA5.title}</strong> ({NAREDBA5.lastAmended}): седемте
                образователни направления, техните ядра и продължителността на ситуациите по групи.
              </p>
              <p className="leading-relaxed text-slate-600">
                <strong className="font-semibold text-slate-900">Програмната система „Златно ключе“</strong> на издателство „Бит и
                техника“ — предучилищната линия за I–IV група и нейните познавателни книжки.
              </p>
              <p className="leading-relaxed text-slate-600">
                <strong className="font-semibold text-slate-900">Програмите на МОН по БДП</strong> за детската градина — темите за
                всяка група, интегрирани в направленията.
              </p>
            </div>
            <Link href="/naredba5" className="mt-8 inline-flex items-center gap-1.5 font-semibold text-[#0a4b82] hover:underline">
              Справочник и проверка на седмичното разпределение <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="border-t border-slate-200">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-14 sm:px-6 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">Започнете с вашия екип</h2>
              <p className="mt-2 text-slate-600">Регистрацията отнема минута. Колегите се присъединяват с кода на градината.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/register" className="rounded-xl bg-[#0a4b82] px-5 py-3 font-semibold text-white hover:bg-[#083861]">
                Регистрация
              </Link>
              <Link href="/login" className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-800 hover:bg-slate-50">
                Вход
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
