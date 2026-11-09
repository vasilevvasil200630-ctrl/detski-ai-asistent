"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { BadgeCheck, CalendarRange, ChevronDown, Copy, FileDown, HeartHandshake, Loader2, Plus, Printer, Share2, Sparkles, Trash2 } from "lucide-react";
import { useMe } from "@/lib/client/useMe";
import { toast } from "@/components/Toaster";
import { KG_SIGNATURE } from "@/config/kindergarten";
import { AGE_SHORT } from "@/services/materialText";
import { DIRECTION_STANDARDS } from "@/services/naredba5";
import { schoolYearLabel, weeklySlots, type PlanSituation, type PlanSummary, type PlanView, type PlanWeekView } from "@/services/thematicPlan";
import { schoolYearOf } from "@/lib/portfolio-shared";
import type { AgeGroup } from "@/types";
import { WeekEditor } from "./WeekEditor";
import { CloudSaveButton } from "@/components/CloudSaveButton";
import { PrintOptions } from "@/components/print/PrintOptions";

async function api<T>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json" } });
    const data = (await res.json().catch(() => ({}))) as T & { error?: string };
    if (!res.ok) {
      toast(data.error ?? "Действието не успя.", "error");
      return null;
    }
    return data;
  } catch {
    toast("Няма връзка със сървъра.", "error");
    return null;
  }
}

const dm = (ymd: string) => `${ymd.slice(8, 10)}.${ymd.slice(5, 7)}`;

/**
 * Тематично разпределение (чл. 29–30 от Наредба № 5): учебните седмици от 15 септември до 31 май,
 * темата и педагогическите ситуации по направления. Утвърждава се от директора (чл. 23, ал. 4).
 */
export function ThematicPlanModule() {
  const { user } = useMe();
  const isAdmin = user?.kgRole === "ADMIN";
  const [plans, setPlans] = useState<PlanSummary[] | null>(null);
  const [plan, setPlan] = useState<PlanView | null>(null);
  const [openWeek, setOpenWeek] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const current = schoolYearOf(new Date());
  const [newGroup, setNewGroup] = useState<AgeGroup>("2");
  const [newYear, setNewYear] = useState(current);

  useEffect(() => {
    if (user) setNewGroup(user.ageGroup);
  }, [user]);

  const loadPlans = useCallback(async () => {
    const data = await api<{ plans: PlanSummary[] }>("/api/plans");
    setPlans(data?.plans ?? []);
    return data?.plans ?? [];
  }, []);
  const openPlan = useCallback(async (id: string) => {
    const data = await api<{ plan: PlanView }>(`/api/plans/${id}`);
    if (data) {
      setPlan(data.plan);
      setOpenWeek(null);
    }
  }, []);

  useEffect(() => {
    void loadPlans().then((list) => {
      const mine = list.find((p) => p.mine && p.schoolYear === current) ?? list.find((p) => p.mine);
      if (mine) void openPlan(mine.id);
    });
  }, [loadPlans, openPlan, current]);

  const create = async () => {
    setBusy("create");
    const data = await api<{ plan: PlanView }>("/api/plans", {
      method: "POST",
      body: JSON.stringify({ ageGroup: newGroup, schoolYear: newYear, groupName: newGroup === user?.ageGroup ? user?.groupName ?? "" : "" }),
    });
    setBusy(null);
    if (data) {
      setPlan(data.plan);
      setCreating(false);
      void loadPlans();
      toast("Разпределението е създадено — седмиците са готови за попълване.", "success");
    }
  };

  const suggestThemes = async () => {
    if (!plan) return;
    setBusy("themes");
    const data = await api<{ plan: PlanView; source: string }>(`/api/plans/${plan.id}/suggest`, { method: "POST", body: JSON.stringify({ kind: "themes" }) });
    setBusy(null);
    if (data) {
      setPlan(data.plan);
      void loadPlans();
      toast(data.source === "none" ? "Всички седмици вече имат тема." : "Темите са попълнени — прегледайте ги и ги променете при нужда.", "success");
    }
  };

  const patchPlan = async (body: Record<string, unknown>, msg: string) => {
    if (!plan) return;
    const data = await api<{ plan: PlanView }>(`/api/plans/${plan.id}`, { method: "PATCH", body: JSON.stringify(body) });
    if (data) {
      setPlan(data.plan);
      void loadPlans();
      toast(msg, "success");
    }
  };

  const copyPlan = async () => {
    if (!plan) return;
    const data = await api<{ plan: PlanView }>(`/api/plans/${plan.id}/copy`, { method: "POST" });
    if (data) {
      setPlan(data.plan);
      void loadPlans();
      toast("Копието е ваше — може да го променяте.", "success");
    }
  };

  const removePlan = async () => {
    if (!plan || !window.confirm("Да изтрия ли цялото разпределение? Това не може да се върне.")) return;
    if (await api(`/api/plans/${plan.id}`, { method: "DELETE" })) {
      setPlan(null);
      void loadPlans();
    }
  };

  const saveWeek = async (week: PlanWeekView, draft: { theme: string; notes: string; situations: PlanSituation[] }) => {
    if (!plan) return false;
    const data = await api<{ situations: PlanSituation[]; unapproved: boolean }>(`/api/plans/${plan.id}/weeks/${week.week}`, { method: "PATCH", body: JSON.stringify(draft) });
    if (!data) return false;
    setPlan((p) =>
      p
        ? {
            ...p,
            approvedAt: data.unapproved ? null : p.approvedAt,
            weeks: p.weeks.map((w) => (w.week === week.week ? { ...w, theme: draft.theme, notes: draft.notes, situations: data.situations } : w)),
          }
        : p,
    );
    void loadPlans();
    toast(data.unapproved ? "Седмицата е записана. Разпределението трябва да се утвърди отново." : "Седмицата е записана.", "success");
    return true;
  };

  const suggestWeek = async (week: PlanWeekView, theme: string) => {
    if (!plan) return null;
    const data = await api<{ situations: PlanSituation[] }>(`/api/plans/${plan.id}/suggest`, { method: "POST", body: JSON.stringify({ kind: "week", week: week.week, theme }) });
    if (data) toast("Предложението е в седмицата — прегледайте го и натиснете „Запази седмицата“.", "success");
    return data?.situations ?? null;
  };

  const slotsTotal = plan ? weeklySlots(plan.ageGroup).reduce((n, s) => n + s.count, 0) : 0;
  const btn = "inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50";

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="no-print flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            <CalendarRange className="h-7 w-7 text-[#0a4b82]" aria-hidden /> Тематично разпределение
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Учебните седмици от 15 септември до 31 май, темата на всяка седмица и ситуациите по направления с ядрата и очакваните
            резултати по Наредба № 5. Директорът го утвърждава.
          </p>
        </div>
        <button type="button" onClick={() => setCreating((v) => !v)} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#0a4b82] px-4 py-2 text-sm font-semibold text-white hover:bg-[#083861]">
          <Plus className="h-4 w-4" aria-hidden /> Ново разпределение
        </button>
      </div>

      {creating && (
        <section className="no-print mt-5 flex flex-wrap items-end gap-3 rounded-2xl border border-[#0a4b82]/30 bg-sky-50/40 p-4">
          <label className="text-sm">
            <span className="mb-1 block font-semibold text-slate-800">Група</span>
            <select value={newGroup} onChange={(e) => setNewGroup(e.target.value as AgeGroup)} className="rounded-lg border border-slate-300 bg-white px-3 py-2">
              {(["1", "2", "3", "4"] as AgeGroup[]).map((g) => (
                <option key={g} value={g}>
                  {AGE_SHORT[g]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-semibold text-slate-800">Учебна година</span>
            <select value={newYear} onChange={(e) => setNewYear(Number(e.target.value))} className="rounded-lg border border-slate-300 bg-white px-3 py-2">
              {[current, current + 1].map((y) => (
                <option key={y} value={y}>
                  {schoolYearLabel(y)}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={create} disabled={busy === "create"} className="inline-flex items-center gap-2 rounded-xl bg-[#0a4b82] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {busy === "create" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Създай
          </button>
        </section>
      )}

      {plans && plans.length > 0 && (
        <nav aria-label="Разпределения" className="no-print mt-5 flex flex-wrap gap-2">
          {plans.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => openPlan(p.id)}
              aria-current={plan?.id === p.id}
              className={`rounded-xl border px-3 py-2 text-left text-sm ${plan?.id === p.id ? "border-[#0a4b82] bg-[#0a4b82] text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
            >
              <span className="block font-semibold">
                {p.groupName || AGE_SHORT[p.ageGroup]} · {schoolYearLabel(p.schoolYear)}
              </span>
              <span className={`block text-xs ${plan?.id === p.id ? "text-sky-100" : "text-slate-500"}`}>
                {p.mine ? "Моето" : p.authorName} · теми {p.weeksWithTheme}/{p.weeksTotal}
                {p.approvedAt ? " · утвърдено" : ""}
              </span>
            </button>
          ))}
        </nav>
      )}

      {plans === null && <Loader2 className="mx-auto mt-10 h-7 w-7 animate-spin text-slate-400" aria-label="Зареждане" />}
      {plans && plans.length === 0 && !creating && (
        <p className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
          Още нямате тематично разпределение. Натиснете „Ново разпределение“ — седмиците и празниците се подреждат сами.
        </p>
      )}

      {plan && (
        <section className="mt-6">
          <div className="no-print flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {plan.groupName || AGE_SHORT[plan.ageGroup]} · учебна {schoolYearLabel(plan.schoolYear)}
              </h2>
              <p className="text-sm text-slate-600">
                {plan.mine ? "Вашето разпределение" : `От ${plan.authorName}`} · {plan.weeks.length} учебни седмици · {slotsTotal} ситуации седмично
              </p>
              {plan.approvedAt ? (
                <p className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">
                  <BadgeCheck className="h-4 w-4" aria-hidden /> Утвърдено от {plan.approvedByName ?? "директора"} на {new Date(plan.approvedAt).toLocaleDateString("bg-BG")}
                </p>
              ) : (
                <p className="mt-1 text-sm text-amber-700">Още не е утвърдено от директора.</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {plan.mine && (
                <button type="button" onClick={suggestThemes} disabled={busy !== null} className={btn}>
                  {busy === "themes" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Sparkles className="h-4 w-4" aria-hidden />} Теми за празните седмици
                </button>
              )}
              <a href={`/api/plans/${plan.id}/docx`} className={btn}>
                <FileDown className="h-4 w-4" aria-hidden /> Word
              </a>
              <button type="button" onClick={() => window.print()} className={btn}>
                <Printer className="h-4 w-4" aria-hidden /> Отпечатай
              </button>
              <CloudSaveButton key={`plan-cloud-${plan.id}`} source={{ source: "plan", planId: plan.id }} className={btn} />
              <PrintOptions className="basis-full" />
              {plan.mine && (
                <button type="button" onClick={() => patchPlan({ shared: !plan.shared }, plan.shared ? "Вече не е споделено." : "Колегите могат да го видят и да си направят копие.")} className={btn}>
                  <Share2 className="h-4 w-4" aria-hidden /> {plan.shared ? "Спри споделянето" : "Сподели с колегите"}
                </button>
              )}
              {plan.mine && (
                <button
                  type="button"
                  onClick={() =>
                    patchPlan(
                      { showToParents: !plan.showToParents },
                      plan.showToParents
                        ? "Темата вече не се вижда на страницата на групата."
                        : plan.approvedAt
                          ? "Темата на седмицата се вижда на страницата на групата."
                          : "Готово — темата ще се вижда, след като директорът утвърди разпределението.",
                    )
                  }
                  className={btn}
                  title="Темата на седмицата и темите на ситуациите — на страницата на групата за родителите"
                >
                  <HeartHandshake className="h-4 w-4" aria-hidden /> {plan.showToParents ? "Скрий темата от родителите" : "Покажи темата на родителите"}
                </button>
              )}
              {!plan.mine && (
                <button type="button" onClick={copyPlan} className={btn}>
                  <Copy className="h-4 w-4" aria-hidden /> Направи си копие
                </button>
              )}
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => patchPlan({ approve: !plan.approvedAt }, plan.approvedAt ? "Утвърждаването е свалено." : "Разпределението е утвърдено.")}
                  className={`${btn} ${plan.approvedAt ? "" : "border-emerald-600 text-emerald-700"}`}
                >
                  <BadgeCheck className="h-4 w-4" aria-hidden /> {plan.approvedAt ? "Свали утвърждаването" : "Утвърди"}
                </button>
              )}
              {plan.mine && (
                <button type="button" onClick={removePlan} className={`${btn} text-rose-700`} aria-label="Изтрий разпределението">
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              )}
            </div>
          </div>

          <ol className="no-print mt-4 space-y-2">
            {plan.weeks.map((w) => {
              const open = openWeek === w.week;
              return (
                <li key={w.week} className="rounded-2xl border border-slate-200 bg-white">
                  <button
                    type="button"
                    onClick={() => setOpenWeek(open ? null : w.week)}
                    aria-expanded={open}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">{w.week}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-slate-900">{w.theme || <span className="font-normal text-slate-400">без тема</span>}</span>
                      <span className="block text-xs text-slate-500">
                        {dm(w.startDate)} – {dm(w.endDate)}
                        {w.holidays.length > 0 && ` · ${w.holidays.map((h) => `${h.emoji} ${h.name}`).join(", ")}`}
                      </span>
                    </span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${w.situations.length >= slotsTotal ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
                      {w.situations.length}/{slotsTotal}
                    </span>
                    <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
                  </button>
                  {open && (
                    <div className="border-t border-slate-100 p-3">
                      {plan.mine ? (
                        <WeekEditor ageGroup={plan.ageGroup} week={w} onSave={(d) => saveWeek(w, d)} onSuggest={(theme) => suggestWeek(w, theme)} />
                      ) : (
                        <WeekReadOnly week={w} />
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>

          <PlanPrint plan={plan} />
        </section>
      )}
    </main>
  );
}

function WeekReadOnly({ week }: { week: PlanWeekView }) {
  if (week.situations.length === 0) return <p className="text-sm text-slate-500">Седмицата още не е попълнена.</p>;
  return (
    <ul className="space-y-2 text-sm">
      {week.situations.map((s, i) => (
        <li key={i} className="rounded-lg bg-slate-50 p-3">
          <p className="font-semibold text-slate-800">
            {DIRECTION_STANDARDS[s.direction].label} · ядро „{s.core}“
          </p>
          <p className="text-slate-700">{s.topic}</p>
          {s.results.length > 0 && <p className="mt-1 text-xs text-slate-500">{s.results.join(" · ")}</p>}
        </li>
      ))}
    </ul>
  );
}

/** Целият документ за печат (само на хартия). */
function PlanPrint({ plan }: { plan: PlanView }) {
  return (
    <article className="hidden print:block">
      <p className="text-right text-xs text-slate-500">{KG_SIGNATURE}</p>
      <h1 className="text-center text-xl font-bold">ТЕМАТИЧНО РАЗПРЕДЕЛЕНИЕ · учебна {schoolYearLabel(plan.schoolYear)} г.</h1>
      <p className="text-center text-sm">{plan.groupName || AGE_SHORT[plan.ageGroup]} · по Наредба № 5 за предучилищното образование</p>
      <p className="mt-2 text-sm">
        {plan.approvedAt ? `Утвърдено от ${plan.approvedByName ?? "директора"} на ${new Date(plan.approvedAt).toLocaleDateString("bg-BG")}` : "Утвърдил: ................................ (директор)"}
      </p>
      <table className="mt-3 w-full border-collapse text-[11px] leading-snug">
        <thead>
          <tr>
            {["Седмица и тема", "Направление", "Ядро", "Тема на ситуацията", "Очаквани резултати"].map((h) => (
              <th key={h} className="border border-slate-400 p-1 text-left">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {plan.weeks.map((w) => (
            <Fragment key={w.week}>
              {(w.situations.length ? w.situations : [null]).map((s, i) => (
                <tr key={`${w.week}-${i}`} className="break-inside-avoid align-top">
                  {i === 0 && (
                    <td rowSpan={Math.max(1, w.situations.length)} className="border border-slate-400 p-1 font-semibold">
                      {w.week}. {dm(w.startDate)}–{dm(w.endDate)}
                      {w.theme && <span className="block font-normal">„{w.theme}“</span>}
                    </td>
                  )}
                  <td className="border border-slate-400 p-1">{s ? DIRECTION_STANDARDS[s.direction].shortLabel : ""}</td>
                  <td className="border border-slate-400 p-1">{s?.core ?? ""}</td>
                  <td className="border border-slate-400 p-1">{s?.topic ?? ""}</td>
                  <td className="border border-slate-400 p-1">{s?.results.join("; ") ?? ""}</td>
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </article>
  );
}
