"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarHeart, Loader2, Sparkles } from "lucide-react";
import { useMe } from "@/lib/client/useMe";
import { useAppStore } from "@/store/appStore";
import { HOLIDAYS, HOLIDAY_CORE, upcomingHoliday, type Holiday } from "@/services/holidays";
import { AGE_SHORT, formatGameText, materialToText } from "@/services/materialText";
import { AGE_GROUP_LABELS, generateKindergartenGames, generateLessonPreparation, type AiSource } from "@/services/aiEngine";
import { DIRECTION_STANDARDS } from "@/services/naredba5";
import { MaterialBrowser } from "@/components/MaterialBrowser";
import { AddMaterialForm } from "@/components/AddMaterialForm";
import { SaveMaterialBar } from "@/components/SaveMaterialBar";
import type { AgeGroup, GeneratedGame, GeneratedLessonPlan } from "@/types";

const chip = (active: boolean) =>
  `rounded-xl border px-3 py-1.5 text-sm font-bold transition-colors ${
    active ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-indigo-50"
  }`;

/** Секция „Празници“: игри и материали за празниците в детската градина. */
export default function HolidaysPage() {
  const { user } = useMe();
  const addSavedMinutes = useAppStore((s) => s.addSavedMinutes);
  const [holiday, setHoliday] = useState<Holiday>(() => upcomingHoliday());
  const [ageGroup, setAgeGroup] = useState<AgeGroup>("3");
  const [games, setGames] = useState<GeneratedGame[] | null>(null);
  const [plan, setPlan] = useState<GeneratedLessonPlan | null>(null);
  const [source, setSource] = useState<AiSource | null>(null);
  const [busy, setBusy] = useState<"games" | "plan" | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (user?.ageGroup) setAgeGroup(user.ageGroup);
  }, [user?.ageGroup]);

  const selectHoliday = (h: Holiday) => {
    setHoliday(h);
    setGames(null);
    setPlan(null);
    setShowForm(false);
  };

  const generateGames = async () => {
    setBusy("games");
    setPlan(null);
    const res = await generateKindergartenGames({
      ageGroup,
      mood: "distracted",
      location: "classroom",
      duration: "15",
      resources: "none",
      customTheme: holiday.name,
    });
    setGames(res.games);
    setSource(res.source);
    setBusy(null);
    addSavedMinutes(30);
  };

  const generatePlan = async () => {
    setBusy("plan");
    setGames(null);
    const res = await generateLessonPreparation({
      ageGroup,
      direction: HOLIDAY_CORE.direction,
      topic: holiday.name,
      core: HOLIDAY_CORE.core,
    });
    setPlan(res.plan);
    setSource(res.source);
    setBusy(null);
    addSavedMinutes(45);
  };

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="rounded-3xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 p-6 text-white shadow-lg sm:p-8">
        <h1 className="flex items-center gap-2 text-2xl font-extrabold sm:text-3xl">
          <CalendarHeart className="h-7 w-7" /> Празници
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-indigo-100 sm:text-base">
          Игри и материали за празниците в детската градина – генерирани, ваши и споделени от колегите. По Наредба № 5
          празниците, обичаите и традициите са в направление „{DIRECTION_STANDARDS.world.label}“, ядро „{HOLIDAY_CORE.core}“.
        </p>
      </div>

      {/* Празниците в учебната година */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Празник">
        {HOLIDAYS.map((h) => (
          <button key={h.id} type="button" aria-pressed={holiday.id === h.id} onClick={() => selectHoliday(h)} className={chip(holiday.id === h.id)}>
            {h.emoji} {h.name}
          </button>
        ))}
      </div>

      <section aria-labelledby="holiday-title" className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div>
          <h2 id="holiday-title" className="text-xl font-extrabold text-slate-900">
            {holiday.emoji} {holiday.name} <span className="text-base font-bold text-slate-500">• {holiday.when}</span>
          </h2>
          <p className="mt-1 text-sm text-slate-700">{holiday.about}</p>
          <p className="mt-1 text-xs text-slate-500">
            Наредба № 5: „{DIRECTION_STANDARDS.world.label}“ – ядро „{HOLIDAY_CORE.core}“. Подходящи връзки: {holiday.links.join(", ")}.
          </p>
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Възрастова група">
          {(["1", "2", "3", "4"] as AgeGroup[]).map((g) => (
            <button key={g} type="button" aria-pressed={ageGroup === g} onClick={() => setAgeGroup(g)} className={chip(ageGroup === g)}>
              {AGE_SHORT[g]}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={generateGames}
            disabled={busy !== null}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {busy === "games" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} 3 игри за празника
          </button>
          <button
            type="button"
            onClick={generatePlan}
            disabled={busy !== null}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {busy === "plan" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} ДОС план за празника
          </button>
        </div>

        {source && (games || plan) && (
          <p className="text-xs font-bold text-slate-500">
            {source === "ai" ? "✨ Генерирано от Gemini AI" : "🛡️ Генерирано от вградения демо двигател"} • {AGE_GROUP_LABELS[ageGroup].full}
          </p>
        )}

        {games && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {games.map((g) => (
              <article key={g.id} className="flex flex-col rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-800">{formatGameText(g)}</pre>
                <SaveMaterialBar
                  compact
                  className="mt-auto pt-3"
                  onSaved={() => setRefreshKey((k) => k + 1)}
                  material={{ kind: "GAME", title: g.title, ageGroup, holiday: holiday.id, direction: HOLIDAY_CORE.direction, core: HOLIDAY_CORE.core, content: g }}
                />
              </article>
            ))}
          </div>
        )}

        {plan && (
          <article className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <SaveMaterialBar
              onSaved={() => setRefreshKey((k) => k + 1)}
              material={{ kind: "LESSON", title: plan.topic, ageGroup, holiday: holiday.id, direction: HOLIDAY_CORE.direction, core: plan.educationalCore, content: plan }}
            />
            <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-800">
              {materialToText("LESSON", plan)}
            </pre>
          </article>
        )}
      </section>

      {/* Споделеното от колегите и моите материали за празника */}
      {user ? (
        <>
          <section aria-labelledby="holiday-shared" className="space-y-3">
            <h2 id="holiday-shared" className="text-lg font-extrabold text-slate-900">
              🤝 От колегите за „{holiday.name}“
            </h2>
            <MaterialBrowser
              key={`shared-${holiday.id}`}
              scope="shared"
              refreshKey={refreshKey}
              holiday={holiday.id}
              emptyText="Колегите още не са споделили материали за този празник."
            />
          </section>
          <section aria-labelledby="holiday-mine" className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="holiday-mine" className="text-lg font-extrabold text-slate-900">
                📚 Моите материали за „{holiday.name}“
              </h2>
              <button type="button" onClick={() => setShowForm((v) => !v)} className="rounded-xl border border-indigo-200 bg-white px-3 py-1.5 text-sm font-bold text-indigo-800 hover:bg-indigo-50">
                {showForm ? "Скрий формата" : "➕ Добави материал за празника"}
              </button>
            </div>
            {showForm && (
              <AddMaterialForm
                key={holiday.id}
                defaultAgeGroup={ageGroup}
                defaultHoliday={holiday.id}
                canShare={Boolean(user.kindergarten)}
                onCreated={() => {
                  setRefreshKey((k) => k + 1);
                  setShowForm(false);
                }}
              />
            )}
            <MaterialBrowser
              key={`mine-${holiday.id}`}
              scope="mine"
              holiday={holiday.id}
              refreshKey={refreshKey}
              emptyText="Още нямате материали за този празник. Генерирайте игри или ДОС план и ги запазете."
            />
          </section>
        </>
      ) : (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-600">
          <Link href="/login?callbackUrl=/holidays" className="font-bold text-indigo-700 hover:underline">
            Влезте
          </Link>
          , за да запазвате материалите за празниците и да виждате споделеното от колегите.
        </p>
      )}
    </main>
  );
}
