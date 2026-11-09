import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpenText, CalendarHeart, Images, Megaphone, Mail, Sparkles } from "lucide-react";
import { groupPageData } from "@/lib/parents";
import { ParentPostCard } from "@/components/parents/ParentPostCard";
import { upcomingHolidayDates } from "@/services/thematicPlan";
import { directionLabel } from "@/services/materialText";
import type { LessonDirection } from "@/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const data = await groupPageData((await params).slug);
  return data
    ? { title: data.group.label, description: `${data.group.label} в ДГ „Пролет“: темата на седмицата, обяви, покани и стихчета за родителите.` }
    : { title: "Групата не е намерена" };
}

const range = (a: string, b: string) => {
  const f = (iso: string, withMonth: boolean) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("bg-BG", { day: "numeric", ...(withMonth ? { month: "long" } : {}), timeZone: "UTC" });
  return a.slice(5, 7) === b.slice(5, 7) ? `${f(a, false)}–${f(b, true)}` : `${f(a, true)} – ${f(b, true)}`;
};
const dayLabel = (iso: string, plusDays = 0) => {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + plusDays);
  return d.toLocaleDateString("bg-BG", { day: "numeric", month: "long", weekday: "long", timeZone: "UTC" });
};

/**
 * Страницата на групата за родителите: темата на седмицата (от утвърденото разпределение),
 * обявите и поканите, стихчетата и песните — само одобреното от директора — и предстоящите празници.
 */
export default async function GroupPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await groupPageData(slug);
  if (!data) notFound();
  const { group, posts, theme } = data;
  const notices = posts.filter((p) => p.kind === "NOTICE");
  const letters = posts.filter((p) => p.kind === "LETTER");
  const verses = posts.filter((p) => p.kind === "VERSES");
  const holidays = upcomingHolidayDates(3);
  const printHref = (id: string) => `/grupi/${group.slug}/p/${id}`;
  const empty = !theme && posts.length === 0;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <Link href="/grupi" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Всички групи
      </Link>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{group.label}</h1>
      {group.teachers.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-3">
          {group.teachers.map((t) => (
            <li key={t.id}>
              <Link href={`/vitrina/uchitel/${t.id}`} className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1.5 pl-1.5 pr-4 text-sm hover:bg-slate-50">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-sky-50 text-lg" aria-hidden>
                  {t.avatar}
                </span>
                <span>
                  <span className="font-semibold text-slate-900">{t.name}</span> <span className="text-slate-500">· {t.jobTitle}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_18rem]">
        <div className="min-w-0 space-y-10">
          {theme && (
            <section aria-labelledby="theme-title" className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
              <h2 id="theme-title" className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
                <Sparkles className="h-4 w-4" aria-hidden /> {theme.current ? "Темата на седмицата" : "Следващата седмица"} · {range(theme.startDate, theme.endDate)}
              </h2>
              <p className="mt-2 text-2xl font-bold text-slate-900">{theme.theme}</p>
              {theme.topics.length > 0 && (
                <ul className="mt-3 space-y-1 text-sm text-slate-700">
                  {theme.topics.map((t, i) => (
                    <li key={i}>
                      <span className="font-semibold">{directionLabel(t.direction as LessonDirection) ?? t.direction}:</span> {t.topic}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {notices.length > 0 && (
            <section aria-labelledby="notices-title">
              <h2 id="notices-title" className="flex items-center gap-2 text-xl font-bold text-slate-900">
                <Megaphone className="h-5 w-5 text-slate-500" aria-hidden /> Обяви
              </h2>
              <div className="mt-4 space-y-4">
                {notices.map((p) => (
                  <ParentPostCard key={p.id} post={p} />
                ))}
              </div>
            </section>
          )}

          {letters.length > 0 && (
            <section aria-labelledby="letters-title">
              <h2 id="letters-title" className="flex items-center gap-2 text-xl font-bold text-slate-900">
                <Mail className="h-5 w-5 text-slate-500" aria-hidden /> Покани и писма
              </h2>
              <div className="mt-4 space-y-4">
                {letters.map((p) => (
                  <ParentPostCard key={p.id} post={p} printHref={printHref(p.id)} />
                ))}
              </div>
            </section>
          )}

          {verses.length > 0 && (
            <section aria-labelledby="verses-title">
              <h2 id="verses-title" className="flex items-center gap-2 text-xl font-bold text-slate-900">
                <BookOpenText className="h-5 w-5 text-slate-500" aria-hidden /> Стихчета и песни, които учим
              </h2>
              <p className="mt-1 text-sm text-slate-500">За вкъщи — само ако детето пожелае. Няма домашна работа.</p>
              <div className="mt-4 space-y-4">
                {verses.map((p) => (
                  <ParentPostCard key={p.id} post={p} printHref={printHref(p.id)} />
                ))}
              </div>
            </section>
          )}

          {empty && (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center leading-relaxed text-slate-600">
              Скоро тук учителите ще публикуват темата на седмицата, обяви, покани и стихчета за групата.
            </p>
          )}
        </div>

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
                  <span>
                    <span className="block font-semibold text-slate-900">{holiday.name}</span>
                    <span className="block text-sm text-slate-600">{holiday.id === "velikden" ? `Великден — ${dayLabel(date, 3)}` : dayLabel(date)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
          <Link href="/vitrina" className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-5 font-semibold text-[#0a4b82] hover:bg-sky-50/40">
            <Images className="h-5 w-5" aria-hidden /> Дейностите с децата
          </Link>
        </aside>
      </div>
    </main>
  );
}
