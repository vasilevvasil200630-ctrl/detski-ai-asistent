import Link from "next/link";
import { ArrowRight, CalendarHeart, Images, Newspaper, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { KG } from "@/config/kindergarten";
import { monthLabel, publicShowcaseWhere, SHOWCASE_INCLUDE, showcaseMonths, showcaseTeachers, toShowcaseView } from "@/lib/showcase";
import { ShowcaseCard, TeacherCard } from "@/components/showcase/ShowcaseCards";
import { upcomingHolidayDates } from "@/services/thematicPlan";

/** Дата като „3 март, вторник“. */
function dayLabel(iso: string, plusDays = 0): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + plusDays);
  return d.toLocaleDateString("bg-BG", { day: "numeric", month: "long", weekday: "long", timeZone: "UTC" });
}

/**
 * Началната страница за родителите и гостите (идват от линка в официалния сайт на градината):
 * какво правим с децата — одобрените дейности, учителите, бюлетинът и празниците. Без инструменти,
 * без регистрация и без лични данни на посетителя; входът за учители е малка връзка.
 */
export async function ParentHome() {
  const [teachers, months, rows] = await Promise.all([
    showcaseTeachers(),
    showcaseMonths(),
    prisma.showcaseItem.findMany({ where: publicShowcaseWhere(), include: SHOWCASE_INCLUDE, orderBy: { publishedAt: "desc" }, take: 6 }),
  ]);
  const items = rows.map((r) => toShowcaseView(r, { forPublic: true }));
  const holidays = upcomingHolidayDates(4);
  const latestMonth = months[0];

  return (
    <main>
      <section className="border-b border-slate-200 bg-gradient-to-b from-sky-50/70 to-white">
        <div className="mx-auto max-w-6xl px-4 pb-12 pt-10 sm:px-6 sm:pt-14">
          <p className="text-sm font-semibold text-[#1a7f45]">
            {KG.fullName} · {KG.village}
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl">
            Какво правим с децата в „Пролет“
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-600">
            Игри, дейности и празници от нашите групи — така, както ги показват учителите. Всяка игра може да се отпечата и да се
            изиграе вкъщи, ако детето пожелае.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/vitrina"
              className="inline-flex items-center gap-2 rounded-xl bg-[#0a4b82] px-6 py-3.5 text-base font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-[#083861] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a4b82] focus-visible:ring-offset-2"
            >
              <Images className="h-5 w-5" aria-hidden /> Всички дейности
            </Link>
            {latestMonth && (
              <Link
                href={`/vitrina/mesec/${latestMonth.ym}`}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-base font-semibold text-slate-800 transition-colors duration-150 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a4b82]"
              >
                <Newspaper className="h-5 w-5" aria-hidden /> Бюлетин за {monthLabel(latestMonth.ym)}
              </Link>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_20rem]">
        <section aria-labelledby="latest-title" className="min-w-0">
          <div className="flex items-end justify-between gap-3">
            <h2 id="latest-title" className="text-2xl font-bold tracking-tight text-slate-900">
              Последни дейности
            </h2>
            {items.length > 0 && (
              <Link href="/vitrina" className="inline-flex items-center gap-1 text-sm font-semibold text-[#0a4b82] hover:underline">
                Всички <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            )}
          </div>
          {items.length === 0 ? (
            <p className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center leading-relaxed text-slate-600">
              Скоро тук ще видите какво правят децата в нашата градина — игри, рисунки, табла и празници.
            </p>
          ) : (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {items.map((item) => (
                <ShowcaseCard key={item.id} item={item} />
              ))}
            </div>
          )}

          {teachers.length > 0 && (
            <section aria-labelledby="teachers-title" className="mt-12">
              <h2 id="teachers-title" className="text-2xl font-bold tracking-tight text-slate-900">
                Нашите учители
              </h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {teachers.map((t) => (
                  <TeacherCard key={t.id} teacher={t} count={t.count} />
                ))}
              </div>
            </section>
          )}
        </section>

        <aside className="space-y-6">
          <section aria-labelledby="holidays-title" className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 id="holidays-title" className="flex items-center gap-2 text-sm font-semibold text-slate-500">
              <CalendarHeart className="h-4 w-4" aria-hidden /> Предстоящи празници
            </h2>
            <ul className="mt-3 space-y-3">
              {holidays.map(({ holiday, date }) => (
                <li key={`${holiday.id}-${date}`} className="flex gap-3">
                  <span className="text-2xl leading-none" aria-hidden>
                    {holiday.emoji}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold text-slate-900">{holiday.name}</span>
                    <span className="block text-sm text-slate-600">
                      {holiday.id === "velikden" ? `Великден — ${dayLabel(date, 3)}` : dayLabel(date)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {months.length > 1 && (
            <section aria-labelledby="months-title" className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 id="months-title" className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                <Newspaper className="h-4 w-4" aria-hidden /> Бюлетин по месеци
              </h2>
              <ul className="mt-3 space-y-1.5 text-sm">
                {months.slice(0, 6).map((m) => (
                  <li key={m.ym}>
                    <Link href={`/vitrina/mesec/${m.ym}`} className="font-medium text-[#0a4b82] hover:underline">
                      {monthLabel(m.ym)}
                    </Link>{" "}
                    <span className="text-slate-500">· {m.count}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="privacy-title" className="rounded-2xl bg-slate-50 p-5 text-sm leading-relaxed text-slate-600">
            <h2 id="privacy-title" className="flex items-center gap-2 font-semibold text-slate-800">
              <ShieldCheck className="h-4 w-4 text-[#1a7f45]" aria-hidden /> Грижим се за децата
            </h2>
            <p className="mt-2">
              Тук няма снимки на деца — само рисунки, табла и материали. Всичко минава през одобрение от директора. Сайтът не
              събира лични данни на посетителите.{" "}
              <Link href="/privacy" className="font-semibold text-[#0a4b82] hover:underline">
                Поверителност
              </Link>
            </p>
          </section>
        </aside>
      </div>
    </main>
  );
}
