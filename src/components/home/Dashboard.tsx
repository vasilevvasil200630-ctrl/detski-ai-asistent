"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookmarkPlus, CalendarHeart, Dices, FileText, Loader2 } from "lucide-react";
import type { SavedMaterial, SessionTeacher } from "@/types";
import { fetchMaterials } from "@/lib/client/materials";
import { AGE_SHORT, KIND_LABELS } from "@/services/materialText";
import { upcomingHoliday } from "@/services/holidays";
import { AGE_GROUP_STANDARDS, DIRECTION_ORDER, DIRECTION_STANDARDS, situationRangeLabel } from "@/services/naredba5";

function greeting(now = new Date()) {
  const h = now.getHours();
  if (h < 11) return "Добро утро";
  if (h < 18) return "Добър ден";
  return "Добър вечер";
}

function MaterialRows({ items, empty, showAuthor }: { items: SavedMaterial[]; empty: string; showAuthor?: boolean }) {
  if (items.length === 0) return <p className="px-5 py-6 text-sm text-slate-500">{empty}</p>;
  return (
    <ul className="divide-y divide-slate-100">
      {items.map((m) => (
        <li key={m.id} className="flex items-baseline justify-between gap-4 px-5 py-3">
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-slate-900">{m.title}</span>
            <span className="block text-xs text-slate-500">
              {KIND_LABELS[m.kind].label} · {AGE_SHORT[m.ageGroup]}
              {showAuthor ? ` · ${m.authorName}` : ""}
            </span>
          </span>
          <span className="shrink-0 text-xs text-slate-500">{m.createdAt}</span>
        </li>
      ))}
    </ul>
  );
}

/** Таблото на влезлия учител: бързи действия, последно запазеното, новото от колегите, празник, седмицата по Наредба № 5. */
export function Dashboard({ user }: { user: SessionTeacher }) {
  const [mine, setMine] = useState<SavedMaterial[] | null>(null);
  const [shared, setShared] = useState<SavedMaterial[] | null>(null);
  const holiday = upcomingHoliday();
  const group = user.ageGroup;
  const std = AGE_GROUP_STANDARDS[group];
  const firstName = user.name.split(" ").slice(-1)[0];

  useEffect(() => {
    void fetchMaterials({ scope: "mine" }).then((r) => setMine((r?.materials ?? []).slice(0, 5)));
    if (user.kindergarten) {
      void fetchMaterials({ scope: "shared" }).then((r) => setShared((r?.materials ?? []).filter((m) => !m.mine).slice(0, 5)));
    } else setShared([]);
  }, [user.kindergarten]);

  const actions = [
    { href: "/games", label: "Нови игри", icon: Dices },
    { href: "/dos", label: "План-конспект", icon: FileText },
    { href: "/library", label: "Добави материал", icon: BookmarkPlus },
    { href: "/holidays", label: "Празници", icon: CalendarHeart },
  ];

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <header className="flex flex-col gap-5 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {greeting()}, {firstName}
          </h1>
          <p className="mt-1 text-slate-600">
            {user.groupName || std.name.charAt(0).toUpperCase() + std.name.slice(1)} · {user.kindergarten?.name ?? "без детска градина"}
          </p>
        </div>
        <nav aria-label="Бързи действия" className="flex flex-wrap gap-2">
          {actions.map(({ href, label, icon: Icon }, i) => (
            <Link
              key={href}
              href={href}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                i === 0 ? "bg-[#0a4b82] text-white hover:bg-[#083861]" : "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
              }`}
            >
              <Icon className="h-4 w-4" /> {label}
            </Link>
          ))}
        </nav>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <section aria-labelledby="dash-mine" className="rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 id="dash-mine" className="font-semibold text-slate-900">Последно в моята библиотека</h2>
              <Link href="/library" className="inline-flex items-center gap-1 text-sm font-semibold text-[#0a4b82] hover:underline">
                Всички <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {mine === null ? (
              <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-slate-400" aria-label="Зареждане" /></div>
            ) : (
              <MaterialRows items={mine} empty="Още нямате запазени материали. Създайте игра или план-конспект и ги запазете в библиотеката." />
            )}
          </section>

          <section aria-labelledby="dash-shared" className="rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 id="dash-shared" className="font-semibold text-slate-900">Ново от колегите</h2>
              <Link href="/hub" className="inline-flex items-center gap-1 text-sm font-semibold text-[#0a4b82] hover:underline">
                Учителски хъб <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {shared === null ? (
              <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-slate-400" aria-label="Зареждане" /></div>
            ) : (
              <MaterialRows
                items={shared}
                showAuthor
                empty={user.kindergarten ? "Колегите още не са споделили материали." : "Свържете профила с детска градина, за да виждате споделеното от колегите."}
              />
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section aria-labelledby="dash-holiday" className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 id="dash-holiday" className="text-sm font-semibold text-slate-500">Предстоящ празник</h2>
            <p className="mt-2 text-lg font-bold text-slate-900">{holiday.name}</p>
            <p className="text-sm text-slate-600">{holiday.when} · {holiday.about}</p>
            <Link href="/holidays" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#0a4b82] hover:underline">
              Игри и материали за празника <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </section>

          <section aria-labelledby="dash-week" className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 id="dash-week" className="text-sm font-semibold text-slate-500">Седмицата за {AGE_SHORT[group]} по Наредба № 5</h2>
            <p className="mt-2 text-sm text-slate-700">
              Минимум <strong className="font-semibold text-slate-900">{std.minWeeklyTotal}</strong> педагогически ситуации седмично,
              всяка по <strong className="font-semibold text-slate-900">{situationRangeLabel(group)}</strong>.
            </p>
            <table className="mt-3 w-full text-sm">
              <tbody className="divide-y divide-slate-100">
                {DIRECTION_ORDER.map((d) => (
                  <tr key={d}>
                    <td className="py-1.5 text-slate-600">{DIRECTION_STANDARDS[d].shortLabel}</td>
                    <td className="py-1.5 text-right font-semibold tabular-nums text-slate-900">{DIRECTION_STANDARDS[d].minWeekly[group]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Link href="/naredba5" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#0a4b82] hover:underline">
              Проверка на разпределението <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </section>
        </aside>
      </div>
    </main>
  );
}
