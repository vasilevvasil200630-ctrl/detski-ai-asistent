"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BadgeCheck, BookOpenCheck, Heart, Loader2, Printer, Store } from "lucide-react";
import { KG_SIGNATURE } from "@/config/kindergarten";
import { AGE_SHORT, directionLabel, KIND_LABELS } from "@/services/materialText";
import { schoolYearLabel, schoolYearOf, type PortfolioData } from "@/lib/portfolio-shared";
import type { LessonDirection } from "@/types";

const dateBg = (iso: string) => new Date(iso).toLocaleDateString("bg-BG", { day: "numeric", month: "long", year: "numeric" });

/**
 * „Моето портфолио“: какво е създал, споделил, изпитал с децата и показал на витрината учителят
 * през учебната година. Отпечатва се като документ за атестацията.
 */
export function PortfolioModule() {
  const current = schoolYearOf(new Date());
  const [year, setYear] = useState(current);
  const [data, setData] = useState<PortfolioData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setData(null);
    setError(null);
    fetch(`/api/portfolio?year=${year}`, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error("Портфолиото не можа да се зареди.");
        setData((await r.json()) as PortfolioData);
      })
      .catch((e: Error) => setError(e.message));
  }, [year]);

  const years = [current, current - 1, current - 2];

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="no-print flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            <BookOpenCheck className="h-7 w-7 text-[#0a4b82]" aria-hidden /> Моето портфолио
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Всичко, което сте създали, споделили, изпитали с децата и показали на родителите през учебната година. Отпечатайте го за
            атестацията или за папката на групата.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="portfolio-year">
            Учебна година
          </label>
          <select
            id="portfolio-year"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                Учебна {schoolYearLabel(y)}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => window.print()}
            disabled={!data}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0a4b82] px-4 py-2 text-sm font-semibold text-white hover:bg-[#083861] disabled:opacity-50"
          >
            <Printer className="h-4 w-4" aria-hidden /> Отпечатай
          </button>
        </div>
      </div>

      {error && <p className="mt-6 text-rose-700">{error}</p>}
      {!data && !error && <Loader2 className="mx-auto mt-10 h-7 w-7 animate-spin text-slate-400" aria-label="Зареждане" />}
      {data && <PortfolioSheet data={data} />}
    </main>
  );
}

function PortfolioSheet({ data }: { data: PortfolioData }) {
  const t = data.totals;
  const dirs = Object.entries(t.byDirection).sort((a, b) => b[1] - a[1]);
  const empty = t.materials === 0 && t.tried === 0 && t.showcase === 0 && t.files === 0;
  return (
    <article className="print-sheet mx-auto mt-6 w-full max-w-[210mm] bg-white p-6 text-slate-900 shadow-sm ring-1 ring-slate-200 sm:p-10">
      <header className="border-b-2 border-slate-900 pb-4">
        <p className="text-xs font-semibold text-slate-500">{data.teacher.kindergarten || KG_SIGNATURE}</p>
        <h2 className="mt-1 text-2xl font-bold">Портфолио на учителя · учебна {schoolYearLabel(data.year)} г.</h2>
        <p className="mt-1 text-slate-700">
          <strong>{data.teacher.name}</strong>, {data.teacher.jobTitle}
          {data.teacher.groupName ? ` · ${data.teacher.groupName}` : ` · ${AGE_SHORT[data.teacher.ageGroup]}`}
        </p>
      </header>

      {empty ? (
        <p className="mt-6 text-slate-600">
          За тази учебна година още няма записи. Запазвайте игрите и материалите си в библиотеката, отбелязвайте „Изпитах го“ и
          предлагайте най-хубавото за витрината — всичко ще се събира тук.
        </p>
      ) : (
        <>
          <section className="mt-6">
            <h3 className="text-lg font-bold">Накратко</h3>
            <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Създадени материали" value={t.materials} />
              <Stat label="Изпитани с децата" value={t.tried} />
              <Stat label="На витрината за родители" value={t.showcase} />
              <Stat label="Споделени с колегите" value={t.shared} />
            </dl>
            <ul className="mt-4 space-y-1 text-sm leading-relaxed text-slate-700">
              <li>
                Игри: {t.byKind.GAME} (от тях {t.gamesWithTasks} с образователни задачи по Наредба № 5) · Педагогически ситуации:{" "}
                {t.byKind.LESSON} · Помощни материали: {t.byKind.MATERIAL}
              </li>
              <li>
                Харесвания от колегите: {t.likes} · Колегите са си запазили копие {t.copies} {t.copies === 1 ? "път" : "пъти"}
              </li>
              <li>
                Качени файлове в общия облак: {t.files} (споделени с екипа: {t.filesShared})
              </li>
            </ul>
          </section>

          {dirs.length > 0 && (
            <section className="mt-6 break-inside-avoid">
              <h3 className="text-lg font-bold">По образователни направления</h3>
              <ul className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
                {dirs.map(([d, n]) => (
                  <li key={d} className="flex justify-between gap-3 border-b border-dashed border-slate-200 py-1">
                    <span>{d === "bdp" ? "БДП" : directionLabel(d as LessonDirection)}</span>
                    <span className="font-semibold">{n}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {data.tried.length > 0 && (
            <section className="mt-6">
              <h3 className="flex items-center gap-2 text-lg font-bold">
                <BadgeCheck className="h-5 w-5 text-[#0a4b82]" aria-hidden /> Изпитано с децата
              </h3>
              <ol className="mt-2 space-y-2 text-sm leading-relaxed">
                {data.tried.map((m) => (
                  <li key={m.id} className="break-inside-avoid rounded-lg border border-slate-200 p-3">
                    <p>
                      <strong>{m.title}</strong> · {KIND_LABELS[m.kind].label} · {AGE_SHORT[m.ageGroup]}
                      {m.direction ? ` · ${directionLabel(m.direction)}` : ""} · {dateBg(m.at)}
                    </p>
                    {m.note && <p className="mt-1 text-slate-700">Как мина: {m.note}</p>}
                  </li>
                ))}
              </ol>
            </section>
          )}

          {data.showcase.length > 0 && (
            <section className="mt-6">
              <h3 className="flex items-center gap-2 text-lg font-bold">
                <Store className="h-5 w-5 text-[#0a4b82]" aria-hidden /> Показано на родителите
              </h3>
              <ul className="mt-2 space-y-1 text-sm">
                {data.showcase.map((s) => (
                  <li key={s.id} className="flex flex-wrap justify-between gap-2 border-b border-dashed border-slate-200 py-1">
                    <Link href={`/vitrina/${s.id}`} className="font-semibold text-[#0a4b82] hover:underline print:text-slate-900">
                      {s.title}
                    </Link>
                    <span className="text-slate-600">
                      {s.activity ? "Днес в групата" : KIND_LABELS[s.kind].label} · {dateBg(s.at)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {data.topLiked.length > 0 && (
            <section className="mt-6 break-inside-avoid">
              <h3 className="flex items-center gap-2 text-lg font-bold">
                <Heart className="h-5 w-5 text-rose-600" aria-hidden /> Най-харесвани от колегите
              </h3>
              <ul className="mt-2 space-y-1 text-sm">
                {data.topLiked.map((m) => (
                  <li key={m.id} className="flex justify-between gap-3 border-b border-dashed border-slate-200 py-1">
                    <span>
                      {m.title} <span className="text-slate-500">({KIND_LABELS[m.kind].label})</span>
                    </span>
                    <span className="font-semibold">♥ {m.likes}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      <p className="mt-8 border-t border-slate-200 pt-3 text-xs text-slate-500">
        Събрано автоматично от учителския облак на {KG_SIGNATURE} на {dateBg(new Date().toISOString())}.
      </p>
    </article>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 p-3 text-center">
      <dd className="text-2xl font-bold text-[#0a4b82]">{value}</dd>
      <dt className="mt-0.5 text-xs text-slate-600">{label}</dt>
    </div>
  );
}
