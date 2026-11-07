"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Printer } from "lucide-react";
import { PrintableSheet } from "@/components/print/PrintableSheet";
import { KG_SIGNATURE } from "@/config/kindergarten";
import { isPrintable } from "@/services/printables";
import { AGE_SHORT, directionLabel, materialToText } from "@/services/materialText";
import type { GeneratedGame, GeneratedLessonPlan, SavedMaterial } from "@/types";

/** Изглед за печат на всеки материал от библиотеката: игра, план-конспект или материал за печат. */
export default function PrintMaterialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [material, setMaterial] = useState<SavedMaterial | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/materials/${encodeURIComponent(id)}`)
      .then(async (r) => {
        const data = (await r.json().catch(() => ({}))) as { material?: SavedMaterial; error?: string };
        if (!r.ok || !data.material) throw new Error(data.error ?? "Материалът не е намерен.");
        setMaterial(data.material);
      })
      .catch((e: Error) => setError(e.message));
  }, [id]);

  if (error) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-slate-700">{error}</p>
        <Link href="/library" className="mt-4 inline-block font-semibold text-[#0a4b82] hover:underline">
          Към библиотеката
        </Link>
      </main>
    );
  }
  if (!material) {
    return (
      <main className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-slate-400" aria-label="Зареждане" />
      </main>
    );
  }

  const content = material.content as Record<string, unknown> | null;
  const printable = content && isPrintable(content.printable) ? content.printable : null;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
      <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link href="/library" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Библиотека
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0a4b82] px-5 py-2.5 font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-[#083861] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a4b82] focus-visible:ring-offset-2"
        >
          <Printer className="h-4 w-4" aria-hidden /> Принтирай
        </button>
      </div>

      {printable ? (
        <PrintableSheet item={printable} />
      ) : material.kind === "LESSON" && content && Array.isArray(content.stages) ? (
        <LessonPrint plan={content as unknown as GeneratedLessonPlan} />
      ) : material.kind === "GAME" && content && Array.isArray(content.steps) ? (
        <GamePrint game={content as unknown as GeneratedGame} material={material} />
      ) : (
        <article className="print-sheet mx-auto max-w-[210mm] bg-white p-8 shadow-sm ring-1 ring-slate-200 sm:p-10">
          <p className="text-xs font-semibold text-slate-500">
            {KG_SIGNATURE} · {AGE_SHORT[material.ageGroup]}
          </p>
          <h1 className="mt-1 text-2xl font-bold">{material.title}</h1>
          <div className="mt-6 whitespace-pre-wrap text-[16px] leading-relaxed">{materialToText(material.kind, material.content)}</div>
        </article>
      )}
    </main>
  );
}

function GamePrint({ game, material }: { game: GeneratedGame; material: SavedMaterial }) {
  const dir = directionLabel(material.direction);
  return (
    <article className="print-sheet mx-auto max-w-[210mm] bg-white p-8 text-slate-900 shadow-sm ring-1 ring-slate-200 sm:p-10">
      <p className="text-xs font-semibold text-slate-500">
        {KG_SIGNATURE} · {AGE_SHORT[material.ageGroup]}
        {dir ? ` · ${dir}` : ""}
      </p>
      <h1 className="mt-1 text-2xl font-bold">{game.title}</h1>
      {game.subtitle && <p className="text-slate-600">{game.subtitle}</p>}
      <section className="mt-6 rounded-xl border border-slate-300 p-4">
        <h2 className="font-bold">Стихче за начало</h2>
        <div className="mt-2 space-y-0.5 text-lg italic">
          {game.rhymeLines.map((l, i) => (
            <p key={i}>{l}</p>
          ))}
        </div>
      </section>
      <section className="mt-5">
        <h2 className="font-bold">Ход на играта</h2>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5 leading-relaxed">
          {game.steps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      </section>
      <dl className="mt-5 space-y-2 text-sm leading-relaxed">
        <div>
          <dt className="inline font-bold">Умения по Наредба № 5: </dt>
          <dd className="inline">{game.pedagogicalGoal}</dd>
        </div>
        {game.sopAdaptation && (
          <div>
            <dt className="inline font-bold">Адаптация за дете със СОП: </dt>
            <dd className="inline">{game.sopAdaptation}</dd>
          </div>
        )}
        {game.teacherTip && (
          <div>
            <dt className="inline font-bold">Съвет: </dt>
            <dd className="inline">{game.teacherTip}</dd>
          </div>
        )}
      </dl>
    </article>
  );
}

function LessonPrint({ plan }: { plan: GeneratedLessonPlan }) {
  return (
    <>
      <article className="print-sheet mx-auto max-w-[210mm] bg-white p-8 text-slate-900 shadow-sm ring-1 ring-slate-200 sm:p-10">
        <p className="text-xs font-semibold text-slate-500">{KG_SIGNATURE}</p>
        <h1 className="mt-1 text-2xl font-bold">План-конспект: „{plan.topic}“</h1>
        <dl className="mt-4 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
          <dt className="font-semibold">Група:</dt>
          <dd>
            {plan.ageGroupLabel} ({plan.totalDuration})
          </dd>
          <dt className="font-semibold">Направление:</dt>
          <dd>{plan.directionLabel}</dd>
          <dt className="font-semibold">Ядро:</dt>
          <dd>{plan.educationalCore}</dd>
          {plan.organizationForm && (
            <>
              <dt className="font-semibold">Форма:</dt>
              <dd>{plan.organizationForm}</dd>
            </>
          )}
        </dl>
        <h2 className="mt-5 font-bold">Цели</h2>
        <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm">
          {plan.goals.map((g, i) => (
            <li key={i}>{g}</li>
          ))}
        </ol>
        <h2 className="mt-4 font-bold">Очаквани резултати</h2>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
          <li>Знания: {plan.expectedResults.knowledge}</li>
          <li>Умения: {plan.expectedResults.skills}</li>
          <li>Отношения: {plan.expectedResults.attitudes}</li>
        </ul>
        <h2 className="mt-4 font-bold">Материали</h2>
        <p className="mt-1 text-sm">{plan.materials.join("; ")}</p>
        <h2 className="mt-4 font-bold">Ход на ситуацията</h2>
        <table className="mt-2 w-full border-collapse text-sm">
          <thead>
            <tr className="text-left">
              <th className="border border-slate-300 p-2">Част</th>
              <th className="border border-slate-300 p-2">Учител</th>
              <th className="border border-slate-300 p-2">Деца</th>
            </tr>
          </thead>
          <tbody>
            {plan.stages.map((s, i) => (
              <tr key={i} className="align-top">
                <td className="border border-slate-300 p-2 font-semibold">
                  {s.phase}
                  <span className="block font-normal text-slate-500">{s.duration}</span>
                </td>
                <td className="border border-slate-300 p-2">{s.teacherAction}</td>
                <td className="border border-slate-300 p-2">{s.childrenActivity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
      <article className="print-sheet mx-auto mt-6 max-w-[210mm] bg-white p-8 text-slate-900 shadow-sm ring-1 ring-slate-200 sm:p-10">
        <h2 className="text-2xl font-bold">{plan.story.title}</h2>
        <p className="text-sm text-slate-500">Главен герой: {plan.story.hero}</p>
        <div className="mt-4 space-y-3 text-[17px] leading-relaxed">
          {plan.story.paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          <p className="font-semibold">{plan.story.moral}</p>
        </div>
        <h3 className="mt-6 font-bold">Въпроси за беседа</h3>
        <ol className="mt-1 list-decimal space-y-1 pl-5">
          {plan.story.discussionQuestions.map((q, i) => (
            <li key={i}>{q}</li>
          ))}
        </ol>
      </article>
    </>
  );
}
