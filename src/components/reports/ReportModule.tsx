"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Loader2, Printer } from "lucide-react";
import { toast } from "@/components/Toaster";
import { PrintOptions } from "@/components/print/PrintOptions";
import { recentMonths, type MonthlyReport, type ReportCounts, type TeacherReport } from "@/lib/reports-shared";

const monthName = (ym: string) =>
  new Date(`${ym}-01T12:00:00Z`).toLocaleDateString("bg-BG", { month: "long", year: "numeric", timeZone: "UTC" }).replace(/\s*г\.?$/, "");
const shortDate = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("bg-BG", { day: "numeric", month: "short", timeZone: "UTC" });

/** Показателите в реда на отчета: етикет и ключ. */
const METRICS: { key: keyof ReportCounts; label: string }[] = [
  { key: "games", label: "Игри" },
  { key: "lessons", label: "План-конспекти" },
  { key: "printables", label: "Материали за печат" },
  { key: "tried", label: "Изпитано с деца" },
  { key: "showcaseApproved", label: "Одобрени на витрината" },
  { key: "parentApproved", label: "Публикувано за родителите" },
  { key: "files", label: "Файлове в облака" },
];

function TeacherCard({ t, max, open, onToggle }: { t: TeacherReport; max: number; open: boolean; onToggle: () => void }) {
  const pct = max > 0 ? Math.max(t.total > 0 ? 4 : 0, Math.round((t.total / max) * 100)) : 0;
  return (
    <li className="break-inside-avoid rounded-2xl border border-slate-200 bg-white p-4 print:border-slate-300">
      <div className="flex flex-wrap items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-sky-50 text-2xl" aria-hidden>
          {t.avatar}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-slate-900">
            {t.name} {t.isAdmin && <span className="text-xs font-semibold text-slate-500">(директор)</span>}
          </p>
          <p className="truncate text-sm text-slate-600">{[t.jobTitle, t.group].filter(Boolean).join(" · ")}</p>
        </div>
        <p className="text-right">
          <span className="block text-2xl font-bold tabular-nums text-slate-900">{t.total}</span>
          <span className="block text-xs text-slate-500">дейности</span>
        </p>
      </div>
      {/* Активността спрямо най-активния колега този месец — една лента, без цветово значение */}
      <div className="mt-3 h-2 w-full rounded-full bg-slate-100" title={`${t.total} дейности през месеца`}>
        <div className="h-2 rounded-full bg-[#4d7a0a]" style={{ width: `${pct}%` }} />
      </div>
      <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {METRICS.map((m) => (
          <div key={m.key} className={t.counts[m.key] ? "text-slate-800" : "text-slate-400"}>
            <dt className="inline">{m.label}: </dt>
            <dd className="inline font-semibold tabular-nums">{t.counts[m.key]}</dd>
          </div>
        ))}
      </dl>
      {t.items.length > 0 && (
        <>
          <button type="button" onClick={onToggle} aria-expanded={open} className="no-print mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#4d7a0a] hover:underline">
            <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden /> {open ? "Скрий подробностите" : "Подробно"}
          </button>
          <table className={`mt-3 w-full text-left text-sm ${open ? "" : "hidden print:table"}`}>
            <thead className="text-xs text-slate-500">
              <tr>
                <th className="py-1 pr-3 font-medium">Дата</th>
                <th className="py-1 pr-3 font-medium">Вид</th>
                <th className="py-1 font-medium">Какво</th>
              </tr>
            </thead>
            <tbody>
              {t.items.map((it, i) => (
                <tr key={i} className="border-t border-slate-100 align-top">
                  <td className="whitespace-nowrap py-1.5 pr-3 tabular-nums text-slate-600">{shortDate(it.date)}</td>
                  <td className="whitespace-nowrap py-1.5 pr-3 text-slate-600">{it.type}</td>
                  <td className="py-1.5 text-slate-800">
                    {it.title}
                    {it.note && <span className="text-slate-500"> — {it.note}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </li>
  );
}

/**
 * „Отчети“ за директора: кой какво е направил през месеца — създадени материали, изпитани с деца,
 * дейности на витрината, публикации за родителите и файлове в облака. Печата се за папката на градината.
 */
export function ReportModule() {
  const months = recentMonths(12);
  const [ym, setYm] = useState(months[0]!);
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<Set<string>>(new Set());

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch(`/api/admin/report?ym=${ym}`, { cache: "no-store" })
      .then(async (r) => {
        const d = (await r.json().catch(() => ({}))) as { report?: MonthlyReport; error?: string };
        if (!r.ok || !d.report) throw new Error(d.error ?? "Отчетът не можа да се зареди.");
        if (alive) setReport(d.report);
      })
      .catch((e: unknown) => toast(e instanceof Error ? e.message : "Отчетът не можа да се зареди.", "error"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [ym]);

  const max = report ? Math.max(0, ...report.teachers.map((t) => t.total)) : 0;
  const toggle = (id: string) => setOpen((s) => (s.has(id) ? new Set([...s].filter((x) => x !== id)) : new Set([...s, id])));

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8 print:p-0">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Отчет за {monthName(ym)}</h1>
          <p className="mt-1.5 max-w-2xl leading-relaxed text-slate-600 print:hidden">
            Какво е направил всеки учител през месеца: създадени материали, изпитано с децата, витрината, публикации за родителите и
            файлове в облака. Вижда го само директорът.
          </p>
        </div>
        <div className="no-print flex flex-wrap items-center gap-2">
          <label className="text-sm text-slate-600">
            <span className="sr-only">Месец</span>
            <select value={ym} onChange={(e) => setYm(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800">
              {months.map((m) => (
                <option key={m} value={m}>
                  {monthName(m)}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={() => window.print()} disabled={!report} className="inline-flex items-center gap-2 rounded-xl bg-[#4d7a0a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3d6108] disabled:opacity-50">
            <Printer className="h-4 w-4" aria-hidden /> Отпечатай
          </button>
          <PrintOptions className="basis-full justify-end" />
        </div>
      </header>

      {loading || !report ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" aria-label="Зареждане" />
        </div>
      ) : (
        <>
          <section aria-labelledby="totals-title" className="mt-6">
            <h2 id="totals-title" className="sr-only">
              Общо за екипа
            </h2>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
              {METRICS.map((m) => (
                <div key={m.key} className="rounded-2xl border border-slate-200 bg-white p-3">
                  <dt className="text-xs leading-snug text-slate-500">{m.label}</dt>
                  <dd className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{report.totals[m.key]}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-labelledby="teachers-title" className="mt-8">
            <h2 id="teachers-title" className="text-lg font-bold text-slate-900">
              По учители
            </h2>
            {report.teachers.length === 0 ? (
              <p className="mt-4 text-slate-600">В екипа още няма учители.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {[...report.teachers]
                  .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name, "bg"))
                  .map((t) => (
                    <TeacherCard key={t.id} t={t} max={max} open={open.has(t.id)} onToggle={() => toggle(t.id)} />
                  ))}
              </ul>
            )}
            {max === 0 && report.teachers.length > 0 && <p className="mt-4 text-sm text-slate-500">През този месец още няма записана активност.</p>}
          </section>
        </>
      )}
    </main>
  );
}
