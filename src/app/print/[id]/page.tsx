"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Printer } from "lucide-react";
import { PrintableSheet } from "@/components/print/PrintableSheet";
import { KG_SIGNATURE } from "@/config/kindergarten";
import { isPrintable } from "@/services/printables";
import { AGE_SHORT, directionLabel, materialToText } from "@/services/materialText";
import { GameKitSheets } from "@/components/print/GameKitSheets";
import { LessonPrint } from "@/components/print/LessonSheet";
import { WordButton } from "@/components/WordButton";
import { CloudSaveButton } from "@/components/CloudSaveButton";
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
        <div className="flex flex-wrap gap-2">
        <WordButton
          source={{ kind: material.kind, title: material.title, ageGroup: material.ageGroup, direction: material.direction, content: material.content }}
          label="Свали във Word"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 font-semibold text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-60"
        />
        <CloudSaveButton
          source={{ source: "material", kind: material.kind, title: material.title, ageGroup: material.ageGroup, direction: material.direction, content: material.content }}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 font-semibold text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-60"
        />
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0a4b82] px-5 py-2.5 font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-[#083861] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a4b82] focus-visible:ring-offset-2"
        >
          <Printer className="h-4 w-4" aria-hidden /> {material.kind === "GAME" && content?.kit ? "Печат на всичко" : "Принтирай"}
        </button>
        </div>
      </div>

      {printable ? (
        <PrintableSheet item={printable} />
      ) : material.kind === "LESSON" && content && Array.isArray(content.stages) ? (
        <LessonPrint plan={content as unknown as GeneratedLessonPlan} />
      ) : material.kind === "GAME" && content && Array.isArray(content.steps) ? (
        <GameKitSheets game={content as unknown as GeneratedGame} ageGroup={material.ageGroup} direction={material.direction} />
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
