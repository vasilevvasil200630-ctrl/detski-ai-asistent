"use client";

import { useEffect, useState } from "react";
import { AnnouncementsCard } from "@/components/announcements/AnnouncementsCard";
import Link from "next/link";
import { ArrowRight, CalendarClock, CalendarHeart, Camera, Cloud, CloudUpload, Dices, Download, FileText, KeyRound, Loader2, NotebookPen, Printer } from "lucide-react";
import type { SavedMaterial, SessionTeacher } from "@/types";
import { fetchMaterials } from "@/lib/client/materials";
import { cloudDownloadUrl, listCloudFiles } from "@/lib/client/cloud";
import { listNotes } from "@/lib/client/notes";
import { folderLabel, formatBytes, type CloudFileItem } from "@/lib/cloud/folders";
import type { NoteItem } from "@/lib/notes-shared";
import { dueInfo, upcomingTasks } from "@/components/notebook/noteDates";
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
  const [cloud, setCloud] = useState<CloudFileItem[] | null>(null);
  const [tasks, setTasks] = useState<NoteItem[] | null>(null);
  const holiday = upcomingHoliday();
  const group = user.ageGroup;
  const std = AGE_GROUP_STANDARDS[group];
  const firstName = user.name.split(" ").slice(-1)[0];

  useEffect(() => {
    void fetchMaterials({ scope: "mine" }).then((r) => setMine((r?.materials ?? []).slice(0, 5)));
    if (user.kindergarten) {
      void fetchMaterials({ scope: "shared" }).then((r) => setShared((r?.materials ?? []).filter((m) => !m.mine).slice(0, 5)));
    } else setShared([]);
    if (user.kindergarten) {
      listCloudFiles({ scope: "all" })
        .then((r) => setCloud(r.files.filter((f) => f.shared).slice(0, 5)))
        .catch(() => setCloud([]));
    } else setCloud([]);
    void listNotes().then((n) => setTasks(upcomingTasks(n ?? []).slice(0, 4)));
  }, [user.kindergarten]);

  const actions = [
    { href: "/games", label: "Нови игри", icon: Dices },
    { href: "/cloud", label: "Общ облак", icon: Cloud },
    { href: "/showcase?new=1", label: "Днес в групата", icon: Camera },
    { href: "/materials", label: "Материали за печат", icon: Printer },
    { href: "/dos", label: "План-конспект", icon: FileText },
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
                i === 0 ? "bg-[#4d7a0a] text-white hover:bg-[#3d6108]" : "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
              }`}
            >
              <Icon className="h-4 w-4" /> {label}
            </Link>
          ))}
        </nav>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="min-w-0 space-y-6">
          <section aria-labelledby="dash-cloud" className="rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 id="dash-cloud" className="font-semibold text-slate-900">Ново в общия облак</h2>
              <Link href="/cloud" className="inline-flex items-center gap-1 text-sm font-semibold text-[#4d7a0a] hover:underline">
                Всички файлове <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {cloud === null ? (
              <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-slate-400" aria-label="Зареждане" /></div>
            ) : cloud.length === 0 ? (
              <div className="flex flex-col items-start gap-3 px-5 py-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">В облака още няма файлове. Качете план, табло или сценарий за колегите.</p>
                <Link href="/cloud" className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-800 hover:bg-slate-50">
                  <CloudUpload className="h-4 w-4" aria-hidden /> Качи файл
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {cloud.map((f) => (
                  <li key={f.id} className="flex items-center justify-between gap-4 px-5 py-3">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-slate-900">{f.title}</span>
                      <span className="block truncate text-xs text-slate-500">
                        {folderLabel(f.folder)} · {formatBytes(f.size)} · {f.mine ? "Вие" : f.uploaderName} · {f.createdAt}
                      </span>
                    </span>
                    <a
                      href={cloudDownloadUrl(f.id)}
                      download={f.fileName}
                      aria-label={`Свали „${f.title}“`}
                      className="shrink-0 rounded-lg border border-slate-200 p-2 text-[#4d7a0a] hover:bg-slate-50"
                    >
                      <Download className="h-4 w-4" aria-hidden />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="dash-mine" className="rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 id="dash-mine" className="font-semibold text-slate-900">Последно в моята библиотека</h2>
              <Link href="/library" className="inline-flex items-center gap-1 text-sm font-semibold text-[#4d7a0a] hover:underline">
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
              <Link href="/hub" className="inline-flex items-center gap-1 text-sm font-semibold text-[#4d7a0a] hover:underline">
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

        <aside className="min-w-0 space-y-6">
          {user.kindergarten && <AnnouncementsCard isAdmin={user.kgRole === "ADMIN"} />}
          <section aria-labelledby="dash-notes" className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 id="dash-notes" className="flex items-center gap-2 text-sm font-semibold text-slate-500">
              <NotebookPen className="h-4 w-4" aria-hidden /> Моят бележник
            </h2>
            {tasks === null ? (
              <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-slate-400" aria-label="Зареждане" /></div>
            ) : tasks.length === 0 ? (
              <p className="mt-2 text-sm text-slate-600">Няма задачи за следващите 7 дни.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {tasks.map((t) => {
                  const due = dueInfo(t.dueDate!, false);
                  return (
                    <li key={t.id} className="flex items-start justify-between gap-3 text-sm">
                      <span className="min-w-0 truncate text-slate-800">{t.title || t.body.split(/\r?\n/)[0]}</span>
                      <span className={`inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium ${due.tone.replace("bg-white/70", "bg-slate-100")}`}>
                        <CalendarClock className="h-3 w-3" aria-hidden /> {due.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
            <Link href="/notebook" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#4d7a0a] hover:underline">
              Отвори бележника <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </section>
          {user.kindergarten && (
            <section aria-labelledby="dash-code" className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 id="dash-code" className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                <KeyRound className="h-4 w-4" aria-hidden /> Код за нови колеги
              </h2>
              <p className="mt-2 font-mono text-2xl font-bold tracking-wide text-slate-900">{user.kindergarten.joinCode}</p>
              <p className="mt-1 text-sm text-slate-600">Дайте го на колега от {user.kindergarten.name}, за да се регистрира в облака.</p>
              {user.kgRole === "ADMIN" && (
                <Link href="/team" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#4d7a0a] hover:underline">
                  Управление на екипа <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </section>
          )}
          <section aria-labelledby="dash-holiday" className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 id="dash-holiday" className="text-sm font-semibold text-slate-500">Предстоящ празник</h2>
            <p className="mt-2 text-lg font-bold text-slate-900">{holiday.name}</p>
            <p className="text-sm text-slate-600">{holiday.when} · {holiday.about}</p>
            <Link href="/holidays" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#4d7a0a] hover:underline">
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
            <Link href="/naredba5" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#4d7a0a] hover:underline">
              Проверка на разпределението <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </section>
        </aside>
      </div>
    </main>
  );
}
