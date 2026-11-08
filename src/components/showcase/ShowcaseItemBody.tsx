"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Printer } from "lucide-react";
import { GameKitSheets } from "@/components/print/GameKitSheets";
import { LessonPrint } from "@/components/print/LessonSheet";
import { PrintableSheet } from "@/components/print/PrintableSheet";
import { printKit } from "@/components/games/GameKitDialog";
import { isPrintable } from "@/services/printables";
import { taskLine } from "@/services/gameTasks";
import type { ShowcaseItemView } from "@/lib/showcase-shared";
import type { GeneratedGame, GeneratedLessonPlan } from "@/types";

/** Съдържанието на дейност от витрината: разказ, снимки, самата игра/ситуация и печат за вкъщи. */
export function ShowcaseItemBody({
  item,
  printLabel = "Отпечатай за вкъщи",
  showPrint = true,
}: {
  item: ShowcaseItemView;
  printLabel?: string;
  /** false в списъците (преглед на директора) — там няма печат */
  showPrint?: boolean;
}) {
  const content = item.content as Record<string, unknown> | null;
  const game = item.kind === "GAME" && content && Array.isArray(content.steps) ? (content as unknown as GeneratedGame) : null;
  const lesson = item.kind === "LESSON" && content && Array.isArray(content.stages) ? (content as unknown as GeneratedLessonPlan) : null;
  const printable = content && isPrintable(content.printable) ? content.printable : null;
  const text = content && typeof content.text === "string" ? content.text : null;

  return (
    <div className="space-y-6">
      <p className="whitespace-pre-wrap text-[16px] leading-relaxed text-slate-800">{item.story}</p>

      {item.images.length > 0 && (
        <div className={`grid gap-3 ${item.images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
          {item.images.map((img) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={img.id} src={img.url} alt={`Снимка от „${item.title}“`} className="w-full rounded-2xl border border-slate-200 object-cover" loading="lazy" />
          ))}
        </div>
      )}

      {game && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold text-slate-900">Играта: „{game.title}“</h2>
          {game.rhymeLines.length > 0 && (
            <div className="mt-3 rounded-xl border border-dashed border-amber-300 bg-amber-50/70 p-4 italic">
              {game.rhymeLines.map((l, i) => (
                <p key={i}>{l}</p>
              ))}
            </div>
          )}
          <ol className="mt-4 list-decimal space-y-1.5 pl-5 leading-relaxed text-slate-700">
            {game.steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
          {game.tasks && game.tasks.length > 0 && (
            <div className="mt-4 rounded-xl bg-sky-50 p-4 text-sm">
              <p className="font-semibold text-[#0a4b82]">Какво упражнявахме (по Наредба № 5)</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-slate-700">
                {game.tasks.map((t) => (
                  <li key={`${t.core}|${t.result}`}>{taskLine(t)}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {lesson && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold text-slate-900">Педагогическа ситуация: „{lesson.topic}“</h2>
          <p className="mt-1 text-sm text-slate-500">
            {lesson.directionLabel} · {lesson.educationalCore}
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-slate-700">
            {lesson.goals.map((g, i) => (
              <li key={i}>{g}</li>
            ))}
          </ul>
        </section>
      )}

      {printable && (
        <div className="overflow-x-auto rounded-2xl bg-slate-100 p-3">
          <PrintableSheet item={printable} />
        </div>
      )}

      {text && !printable && <p className="whitespace-pre-wrap rounded-2xl border border-slate-200 bg-white p-5 leading-relaxed text-slate-700">{text}</p>}

      {showPrint && item.allowPrint && (game || lesson || printable) && (
        <>
          <button
            type="button"
            onClick={printKit}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0a4b82] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#083861]"
          >
            <Printer className="h-4 w-4" aria-hidden /> {printLabel}
          </button>
          <PrintOnly>
            {game ? (
              <GameKitSheets game={game} ageGroup={item.ageGroup} direction={item.direction} />
            ) : lesson ? (
              <LessonPrint plan={lesson} />
            ) : printable ? (
              <PrintableSheet item={printable} />
            ) : null}
          </PrintOnly>
        </>
      )}
    </div>
  );
}

/** Скритото копие за печат (виж .printing-kit в globals.css). */
function PrintOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? createPortal(<div id="kit-print-root">{children}</div>, document.body) : null;
}
