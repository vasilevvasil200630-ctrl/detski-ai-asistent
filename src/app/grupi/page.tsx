import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { KG } from "@/config/kindergarten";
import { publicGroups } from "@/lib/parents";

export const dynamic = "force-dynamic";

/** Групите на градината — за родителите: всяка води към своята страница. */
export default async function GroupsPage() {
  const groups = await publicGroups();
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <p className="text-sm font-semibold text-[#1a7f45]">
        {KG.fullName} · {KG.village}
      </p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Нашите групи</h1>
      <p className="mt-3 max-w-2xl leading-relaxed text-slate-600">
        Изберете групата на детето: темата на седмицата, обявите и поканите, стихчетата и песните, които учим.
      </p>
      {groups.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">Скоро тук ще са групите на градината.</p>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {groups.map((g) => (
            <li key={g.id}>
              <Link
                href={`/grupi/${g.slug}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-[#4d7a0a]/40 hover:bg-sky-50/40"
              >
                <span className="min-w-0">
                  <span className="block text-lg font-bold text-slate-900">{g.label}</span>
                  <span className="mt-1 block truncate text-sm text-slate-600">
                    {g.teachers.length ? g.teachers.map((t) => `${t.avatar} ${t.name}`).join(" · ") : "Учителите скоро"}
                  </span>
                </span>
                <ArrowRight className="h-5 w-5 shrink-0 text-[#4d7a0a]" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
