"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpenCheck, CheckCircle2, AlertTriangle, ExternalLink } from "lucide-react";
import { useMe } from "@/lib/client/useMe";
import {
  AGE_GROUP_STANDARDS,
  DIRECTION_ORDER,
  DIRECTION_STANDARDS,
  NAREDBA5,
  situationRangeLabel,
  WEEKLY_MAX_OVER_MIN,
  ZLATNO_KLYUCHE,
} from "@/services/naredba5";
import { BDP, BDP_MIN_PER_YEAR, BDP_NAREDBA5_RESULTS, BDP_THEMES } from "@/services/bdp";
import type { AgeGroup, EducationalDirection } from "@/types";

const GROUPS: AgeGroup[] = ["1", "2", "3", "4"];
const GROUP_SHORT: Record<AgeGroup, string> = { "1": "I група", "2": "II група", "3": "III ПГ", "4": "IV ПГ" };
type Organization = "fullDay" | "halfDay";

/** Минимумите по направления за групата — начална стойност на проверката. */
function minimums(group: AgeGroup): Record<EducationalDirection, number> {
  return Object.fromEntries(DIRECTION_ORDER.map((d) => [d, DIRECTION_STANDARDS[d].minWeekly[group]])) as Record<
    EducationalDirection,
    number
  >;
}

export default function Naredba5Page() {
  const { user } = useMe();
  const [group, setGroup] = useState<AgeGroup>("3");
  const [organization, setOrganization] = useState<Organization>("fullDay");
  const [counts, setCounts] = useState<Record<EducationalDirection, number>>(() => minimums("3"));

  // Групата на влезлия учител по подразбиране
  useEffect(() => {
    if (user?.ageGroup) {
      setGroup(user.ageGroup);
      setCounts(minimums(user.ageGroup));
    }
  }, [user?.ageGroup]);

  const std = AGE_GROUP_STANDARDS[group];
  const total = DIRECTION_ORDER.reduce((sum, d) => sum + (counts[d] || 0), 0);
  const max = std.minWeeklyTotal + WEEKLY_MAX_OVER_MIN[organization];
  const belowMin = useMemo(
    () => DIRECTION_ORDER.filter((d) => (counts[d] || 0) < DIRECTION_STANDARDS[d].minWeekly[group]),
    [counts, group],
  );
  const ok = belowMin.length === 0 && total >= std.minWeeklyTotal && total <= max;

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* Заглавие */}
      <div className="border-b border-slate-200 pb-6 sm:p-8">
        <h1 className=" text-2xl font-bold sm:text-3xl">Наредба № 5 и „Златно ключе“</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-600 sm:text-base">
          Образователните направления и ядра, продължителността и минималният брой педагогически ситуации по {NAREDBA5.title}{" "}
          ({NAREDBA5.lastAmended}) и книжките от {ZLATNO_KLYUCHE.system} на {ZLATNO_KLYUCHE.publisher}. На тези данни
          работят и генераторите в сайта.
        </p>
      </div>

      {/* Възрастови групи */}
      <section aria-labelledby="groups-title" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 id="groups-title" className="text-lg font-semibold text-slate-900">Възрастови групи (чл. 24 и чл. 25)</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500">
                <th className="py-2 pr-3">Група</th>
                <th className="py-2 pr-3">Възраст</th>
                <th className="py-2 pr-3">Една ситуация</th>
                <th className="py-2 pr-3">Минимум седмично</th>
                <th className="py-2">Максимум седмично</th>
              </tr>
            </thead>
            <tbody>
              {GROUPS.map((g) => {
                const s = AGE_GROUP_STANDARDS[g];
                return (
                  <tr key={g} className="border-b border-slate-100 last:border-0">
                    <td className="py-2.5 pr-3 font-bold text-slate-900">{GROUP_SHORT[g]}</td>
                    <td className="py-2.5 pr-3 text-slate-700">{s.ageRange}</td>
                    <td className="py-2.5 pr-3 text-slate-700">{situationRangeLabel(g)}</td>
                    <td className="py-2.5 pr-3 font-bold text-slate-900">{s.minWeeklyTotal}</td>
                    <td className="py-2.5 text-slate-700">
                      {s.minWeeklyTotal + WEEKLY_MAX_OVER_MIN.fullDay} целодневна •{" "}
                      {s.minWeeklyTotal + WEEKLY_MAX_OVER_MIN.halfDay} полудневна
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          При иновативна или авторска програмна система максимумът може да е с до {WEEKLY_MAX_OVER_MIN.innovativeExtra} ситуации
          повече (чл. 24, ал. 3).
        </p>
      </section>

      {/* Проверка на седмичното разпределение */}
      <section aria-labelledby="check-title" className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm sm:p-6">
        <h2 id="check-title" className="text-lg font-semibold text-slate-900">Проверка на седмичното разпределение</h2>
        <p className="mt-1 text-sm text-slate-600">
          Въведете колко педагогически ситуации имате седмично по всяко направление. Проверката сравнява с минимумите от
          приложенията и с общия брой по чл. 24.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {GROUPS.map((g) => (
            <button
              key={g}
              type="button"
              aria-pressed={group === g}
              onClick={() => {
                setGroup(g);
                setCounts(minimums(g));
              }}
              className={`rounded-xl border px-3.5 py-2 text-sm font-bold transition-colors ${
                group === g ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
              }`}
            >
              {GROUP_SHORT[g]}
            </button>
          ))}
          <span className="mx-1 hidden w-px bg-slate-200 sm:block" aria-hidden />
          {(["fullDay", "halfDay"] as Organization[]).map((o) => (
            <button
              key={o}
              type="button"
              aria-pressed={organization === o}
              onClick={() => setOrganization(o)}
              className={`rounded-xl border px-3.5 py-2 text-sm font-bold transition-colors ${
                organization === o ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
              }`}
            >
              {o === "fullDay" ? "Целодневна" : "Полудневна"}
            </button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {DIRECTION_ORDER.map((d) => {
            const dir = DIRECTION_STANDARDS[d];
            const min = dir.minWeekly[group];
            const low = (counts[d] || 0) < min;
            return (
              <label
                key={d}
                className={`flex items-center justify-between gap-3 rounded-2xl border p-3 ${low ? "border-rose-300 bg-rose-50" : "border-slate-200 bg-slate-50"}`}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-slate-900">
                    {dir.shortLabel}
                  </span>
                  <span className={`text-xs ${low ? "font-bold text-rose-700" : "text-slate-500"}`}>минимум {min}</span>
                </span>
                <input
                  type="number"
                  min={0}
                  max={10}
                  inputMode="numeric"
                  value={counts[d]}
                  onChange={(e) => setCounts((c) => ({ ...c, [d]: Math.max(0, Math.min(10, Number(e.target.value) || 0)) }))}
                  className="w-16 shrink-0 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-center text-base font-bold text-slate-900 focus:border-indigo-600 focus:outline-none"
                  aria-label={`Ситуации седмично: ${dir.label}`}
                />
              </label>
            );
          })}
        </div>

        <div
          role="status"
          className={`mt-4 flex items-start gap-3 rounded-2xl border p-4 text-sm ${ok ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}
        >
          {ok ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /> : <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />}
          <div>
            <p className="font-semibold">
              Общо {total} ситуации седмично (допустимо: {std.minWeeklyTotal}–{max} за {std.name},{" "}
              {organization === "fullDay" ? "целодневна" : "полудневна"} организация).
            </p>
            {ok && <p>Разпределението отговаря на Наредба № 5.</p>}
            {total < std.minWeeklyTotal && <p>Под минималния общ брой по чл. 24, ал. 1.</p>}
            {total > max && <p>Над максималния общ брой по чл. 24, ал. 2.</p>}
            {belowMin.length > 0 && (
              <p>Под минимума за: {belowMin.map((d) => DIRECTION_STANDARDS[d].label).join(", ")}.</p>
            )}
          </div>
        </div>
      </section>

      {/* Направления, ядра и книжки */}
      <section aria-labelledby="dirs-title">
        <h2 id="dirs-title" className="text-lg font-semibold text-slate-900">Образователни направления и ядра (чл. 28, ал. 2)</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {DIRECTION_ORDER.map((d) => {
            const dir = DIRECTION_STANDARDS[d];
            return (
              <article key={d} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-base font-semibold text-slate-900">
                  {dir.label}
                </h3>
                <p className="text-xs font-bold text-slate-500">Приложение № {dir.appendix}</p>
                <ul className="mt-3 space-y-1 text-sm text-slate-700">
                  {dir.cores.map((c) => (
                    <li key={c} className="flex items-start gap-2">
                      <span className="text-indigo-600">•</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 grid grid-cols-4 gap-1 text-center text-xs">
                  {GROUPS.map((g) => (
                    <div key={g} className="rounded-lg bg-slate-50 px-1 py-1.5">
                      <div className="text-slate-500">{GROUP_SHORT[g]}</div>
                      <div className="font-semibold text-slate-900">мин. {dir.minWeekly[g]}</div>
                    </div>
                  ))}
                </div>
                <p className="mt-auto pt-3 text-xs text-slate-600">
                  <strong className="text-slate-800">„Златно ключе“:</strong>{" "}
                  {dir.zlatnoBook ? `познавателна книжка ${dir.zlatnoBook}` : "в книгата за учителя по всички направления"}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      {/* Безопасност на движението по пътищата */}
      <section aria-labelledby="bdp-title" className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5 shadow-sm sm:p-6">
        <h2 id="bdp-title" className="text-lg font-semibold text-slate-900">
          {BDP.label} (БДП)
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-700">
          По Наредба № 5 БДП не е отделно образователно направление. Обучението е задължително във всички групи и се
          провежда интегрирано – основно в „{BDP.host.direction}“ (ядро „{BDP.host.core}“) и в „Конструиране и технологии“
          (ядро „Техника“) – или в допълнителни форми. Основната форма е педагогическата ситуация, предимно игра (чл. 23). Темите
          са от {BDP.source}.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {GROUPS.map((g) => (
            <article key={g} className="rounded-2xl border border-amber-100 bg-white p-4">
              <h3 className="text-sm font-semibold text-slate-900">
                {GROUP_SHORT[g]} – минимум {BDP_MIN_PER_YEAR[g]} ситуации годишно
              </h3>
              <ul className="mt-2 space-y-1 text-sm text-slate-700">
                {BDP_THEMES[g].map((t) => (
                  <li key={t.theme} className="flex items-start gap-2">
                    <span className="text-amber-600">•</span>
                    <span>
                      <strong className="text-slate-900">{t.theme}</strong> – {t.expected}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs leading-relaxed text-slate-600">
                <strong className="text-slate-800">Наредба № 5:</strong> {BDP_NAREDBA5_RESULTS[g].world}{" "}
                {BDP_NAREDBA5_RESULTS[g].technika}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Основни правила */}
      <section aria-labelledby="rules-title" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 id="rules-title" className="text-lg font-semibold text-slate-900">Основни правила за деня</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          <li>• Основната форма е педагогическата ситуация и тя протича предимно като игра (чл. 23).</li>
          <li>• Игрите извън ситуациите са допълнителни форми – по преценка на учителя (чл. 26).</li>
          <li>• Игри на открито: поне 2 астрономически часа дневно при целодневна и поне 1 час при полудневна организация, когато времето позволява (чл. 21, ал. 4).</li>
          <li>• Утринната гимнастика е задължителна допълнителна форма за двигателна активност (приложение № 7).</li>
          <li>• Без домашна работа и без работа с познавателните книжки вкъщи (чл. 32).</li>
          <li>
            • „Златно ключе“ предлага теми за {ZLATNO_KLYUCHE.weeks} учебни седмици, а ситуациите в книгата за учителя са в три
            части: {ZLATNO_KLYUCHE.situationParts.join(", ").toLowerCase()}. Кукла-водач: {ZLATNO_KLYUCHE.guide}.
          </li>
        </ul>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <a
            href="https://ruo.mon.bg/sofia-grad/files/sites/2/2025/01/n_5_preduch.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-bold text-indigo-700 hover:underline"
          >
            Текстът на Наредба № 5 (PDF, РУО София-град) <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <a
            href={BDP.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-bold text-indigo-700 hover:underline"
          >
            Програми на МОН по БДП (PDF) <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <a
            href={ZLATNO_KLYUCHE.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-bold text-indigo-700 hover:underline"
          >
            „Бит и техника“ – предучилищно образование <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </section>
    </main>
  );
}
