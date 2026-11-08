import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { KG } from "@/config/kindergarten";
import { publicShowcaseWhere, SHOWCASE_INCLUDE, showcaseTeachers, toShowcaseView } from "@/lib/showcase";
import { ShowcaseCard, TeacherCard } from "@/components/showcase/ShowcaseCards";
import { AGE_SHORT, directionLabel } from "@/services/materialText";
import { DIRECTION_ORDER } from "@/services/naredba5";
import type { LessonDirection } from "@/types";

export const dynamic = "force-dynamic";

const AGES = ["1", "2", "3", "4"] as const;
const DIRS: LessonDirection[] = [...DIRECTION_ORDER, "bdp"];

/** Публичната витрина: учителите и последните одобрени дейности, с филтър по група и направление. */
export default async function ShowcasePublicPage({ searchParams }: { searchParams: Promise<{ group?: string; dir?: string }> }) {
  const { group, dir } = await searchParams;
  const ageGroup = AGES.find((a) => a === group);
  const direction = DIRS.find((d) => d === dir);
  const [teachers, rows] = await Promise.all([
    showcaseTeachers(),
    prisma.showcaseItem.findMany({
      where: publicShowcaseWhere({ ...(ageGroup ? { ageGroup } : {}), ...(direction ? { direction } : {}) }),
      include: SHOWCASE_INCLUDE,
      orderBy: { publishedAt: "desc" },
      take: 60,
    }),
  ]);
  const items = rows.map((r) => toShowcaseView(r, { forPublic: true }));
  const href = (g?: string, d?: string) => {
    const qs = new URLSearchParams({ ...(g ? { group: g } : {}), ...(d ? { dir: d } : {}) }).toString();
    return qs ? `/vitrina?${qs}` : "/vitrina";
  };
  const chip = (on: boolean) =>
    `rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${on ? "border-[#0a4b82] bg-[#0a4b82] text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="max-w-3xl">
        <p className="text-sm font-semibold text-[#0a4b82]">
          {KG.fullName}, {KG.village}
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Какво правим в „Пролет“</h1>
        <p className="mt-3 text-base leading-relaxed text-slate-600">
          Игри, работни листове и дейности, които нашите учители са правили с децата. Всяка игра може да се отпечата и да се изиграе
          вкъщи — само ако детето пожелае.
        </p>
      </header>

      {teachers.length > 0 && (
        <section aria-labelledby="teachers-title" className="mt-10">
          <h2 id="teachers-title" className="text-lg font-bold text-slate-900">
            Нашите учители
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {teachers.map((t) => (
              <TeacherCard key={t.id} teacher={t} count={t.count} />
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="items-title" className="mt-10">
        <h2 id="items-title" className="text-lg font-bold text-slate-900">
          Последни дейности
        </h2>
        <nav aria-label="Филтър" className="mt-3 space-y-2">
          <div className="flex flex-wrap gap-2">
            <Link href={href(undefined, direction)} className={chip(!ageGroup)}>
              Всички групи
            </Link>
            {AGES.map((a) => (
              <Link key={a} href={href(a, direction)} className={chip(ageGroup === a)}>
                {AGE_SHORT[a]}
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={href(ageGroup, undefined)} className={chip(!direction)}>
              Всички направления
            </Link>
            {DIRS.map((d) => (
              <Link key={d} href={href(ageGroup, d)} className={chip(direction === d)}>
                {d === "bdp" ? "БДП" : directionLabel(d)}
              </Link>
            ))}
          </div>
        </nav>
        {items.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
            {ageGroup || direction ? "Няма дейности с този филтър." : "Скоро тук ще видите какво правят децата в нашата градина."}
          </p>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <ShowcaseCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
