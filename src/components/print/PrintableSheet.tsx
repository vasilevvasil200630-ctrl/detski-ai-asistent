import { KG, KG_SIGNATURE } from "@/config/kindergarten";
import type { ParentLetter, Pic, Printable, VersesSheet, Worksheet, WorksheetTask } from "@/services/printables";
import { AGE_SHORT } from "@/services/materialText";
import { DifferencesView, HalfView, MazeView } from "./DrawnTasks";

/**
 * Листът за печат (A4): работен лист, стихчета/гатанки или писмо до родителите.
 * Същият компонент се ползва в прегледа на „Материали за печат“ и в /print/[id].
 */
export function PrintableSheet({ item }: { item: Printable }) {
  return (
    <article className="print-sheet mx-auto w-full max-w-[210mm] bg-white p-6 text-slate-900 shadow-sm ring-1 ring-slate-200 sm:p-10">
      {item.type === "worksheet" && <WorksheetSheet ws={item} />}
      {item.type === "verses" && <VersesView v={item} />}
      {item.type === "letter" && <LetterView l={item} />}
    </article>
  );
}

/* ─────────────────────────── Работен лист ─────────────────────────── */

const Emoji = ({ pic, size = "text-4xl" }: { pic: Pic; size?: string }) => (
  <span role="img" aria-label={pic.w} className={`print-emoji ${size} leading-none`}>
    {pic.e}
  </span>
);

function TaskBox({ n, prompt, children }: { n: number; prompt: string; children: React.ReactNode }) {
  return (
    <section className="print-task break-inside-avoid rounded-2xl border-2 border-slate-300 p-4">
      <h3 className="flex items-start gap-2 text-base font-bold">
        <span className="print-num grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-900 text-sm text-white">{n}</span>
        <span className="pt-0.5">{prompt}</span>
      </h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

const TRACE_PATHS: Record<Extract<WorksheetTask, { kind: "trace" }>["shape"], string> = {
  line: "M10 40 L490 40",
  arches: "M10 55 Q50 5 90 55 Q130 5 170 55 Q210 5 250 55 Q290 5 330 55 Q370 5 410 55 Q450 5 490 55",
  wave: "M10 40 Q40 5 70 40 T130 40 T190 40 T250 40 T310 40 T370 40 T430 40 T490 40",
  zigzag: "M10 60 L45 15 L80 60 L115 15 L150 60 L185 15 L220 60 L255 15 L290 60 L325 15 L360 60 L395 15 L430 60 L465 15 L490 45",
  loops:
    "M10 50 C30 50 40 15 55 15 C70 15 70 45 55 45 C40 45 60 50 90 50 C110 50 120 15 135 15 C150 15 150 45 135 45 C120 45 140 50 170 50 C190 50 200 15 215 15 C230 15 230 45 215 45 C200 45 220 50 250 50 C270 50 280 15 295 15 C310 15 310 45 295 45 C280 45 300 50 330 50 C350 50 360 15 375 15 C390 15 390 45 375 45 C360 45 380 50 410 50 C430 50 440 15 455 15 C470 15 470 45 455 45 C440 45 460 50 490 50",
};

function TaskBody({ task, compact }: { task: WorksheetTask; compact?: boolean }) {
  switch (task.kind) {
    case "count":
      return (
        <div className="space-y-3">
          {task.groups.map((g, i) => (
            <div key={i} className="flex flex-col gap-3 border-b border-dashed border-slate-200 pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
                {Array.from({ length: g.count }, (_, k) => (
                  <Emoji key={k} pic={g.pic} size="text-3xl" />
                ))}
              </div>
              {/* До 5 — в един ред; до 10 — блок 2×5, за да не скача под картинките */}
              <div className={`grid shrink-0 gap-1.5 ${task.max > 5 ? "grid-cols-5" : "auto-cols-max grid-flow-col"}`}>
                {Array.from({ length: task.max }, (_, k) => (
                  <span key={k} className="grid h-8 w-8 place-items-center rounded-full border-2 border-slate-400 text-base font-bold">
                    {k + 1}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    case "match":
      return (
        <div className="grid grid-cols-2 gap-x-24 gap-y-4">
          {task.pairs.map((p, i) => (
            <div key={i} className="contents">
              <div className="flex items-center justify-end gap-3">
                <span className="print-emoji break-all text-right text-3xl leading-tight">{p.left.e}</span>
                <span className="h-3 w-3 shrink-0 rounded-full bg-slate-800" aria-hidden />
              </div>
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 shrink-0 rounded-full bg-slate-800" aria-hidden />
                {/^\d+$/.test(p.right.e) ? <span className="text-3xl font-bold">{p.right.e}</span> : <Emoji pic={p.right} size="text-3xl" />}
              </div>
            </div>
          ))}
        </div>
      );
    case "odd":
      return (
        <div className="space-y-3">
          {task.rows.map((r, i) => (
            <div key={i} className="flex items-center justify-around gap-2 rounded-xl border border-slate-200 py-2">
              {r.items.map((pic, k) => (
                <Emoji key={k} pic={pic} />
              ))}
            </div>
          ))}
        </div>
      );
    case "sequence":
      return (
        <div className="flex flex-wrap items-center gap-2">
          {Array.from({ length: task.repeat }, () => task.pattern)
            .flat()
            .map((pic, i) => (
              <span key={i} className="grid h-14 w-14 place-items-center rounded-xl border border-slate-200">
                <Emoji pic={pic} size="text-3xl" />
              </span>
            ))}
          {Array.from({ length: task.pattern.length }, (_, i) => (
            <span key={`b${i}`} className="h-14 w-14 rounded-xl border-2 border-dashed border-slate-400" aria-label="празно" />
          ))}
        </div>
      );
    case "trace":
      return (
        <div className="space-y-3">
          {[0, 1].map((row) => (
            <div key={row} className="flex items-center gap-2">
              <Emoji pic={task.start} size="text-3xl" />
              <svg viewBox="0 0 500 70" className="h-14 min-w-0 flex-1" aria-hidden>
                <path d={TRACE_PATHS[task.shape]} fill="none" stroke="#64748b" strokeWidth="3" strokeDasharray="6 7" strokeLinecap="round" />
              </svg>
              <Emoji pic={task.end} size="text-3xl" />
            </div>
          ))}
        </div>
      );
    case "sound":
      return (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {task.pics.map((pic, i) => (
            <span key={i} className="grid aspect-square place-items-center rounded-full border border-slate-200">
              <Emoji pic={pic} />
            </span>
          ))}
        </div>
      );
    case "draw":
      return <div className="h-56 rounded-xl border-2 border-dashed border-slate-300" aria-label="място за рисунка" />;
    case "maze":
      return <MazeView task={task} compact={compact} />;
    case "differences":
      return <DifferencesView task={task} compact={compact} />;
    case "half":
      return <HalfView task={task} compact={compact} />;
  }
}

function WorksheetSheet({ ws }: { ws: Worksheet }) {
  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-slate-900 pb-3">
        <div>
          <p className="text-xs font-semibold text-slate-500">
            {KG_SIGNATURE} · {AGE_SHORT[ws.ageGroup]}
          </p>
          <h2 className="mt-1 text-2xl font-bold">{ws.title}</h2>
        </div>
        <div className="space-y-1 text-sm">
          <p>Име: ______________________</p>
          <p>Дата: _____________</p>
        </div>
      </header>
      <div className="mt-5 space-y-4">
        {ws.tasks.map((task, i) => (
          <TaskBox key={i} n={i + 1} prompt={task.prompt}>
            <TaskBody task={task} compact={ws.tasks.length > 2} />
          </TaskBox>
        ))}
      </div>
      <p className="print-teacher-note mt-5 border-t border-slate-200 pt-3 text-xs leading-relaxed text-slate-500">За учителя: {ws.teacherNote}</p>
    </>
  );
}

/* ─────────────────────────── Стихчета и гатанки ─────────────────────────── */

function VersesView({ v }: { v: VersesSheet }) {
  return (
    <>
      <header className="border-b-2 border-slate-900 pb-3 text-center">
        <p className="text-xs font-semibold text-slate-500">
          {KG_SIGNATURE} · {AGE_SHORT[v.ageGroup]}
        </p>
        <h2 className="mt-1 text-2xl font-bold">{v.title}</h2>
      </header>
      {v.pieces.length > 0 && (
        <div className={`mt-6 grid gap-8 ${v.pieces.length > 1 && v.kind !== "tongue" ? "sm:grid-cols-2" : ""}`}>
          {v.pieces.map((p, i) => (
            <section key={i} className="break-inside-avoid">
              {p.title && <h3 className="text-lg font-bold">{p.title}</h3>}
              <div className={`mt-2 space-y-1 ${v.kind === "tongue" ? "text-xl" : "text-lg"} leading-relaxed`}>
                {p.lines.map((l, k) => (
                  <p key={k}>{l}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
      {v.riddles.length > 0 && (
        <>
          <ol className="mt-6 space-y-6">
            {v.riddles.map((r, i) => (
              <li key={i} className="flex break-inside-avoid gap-3 text-lg leading-relaxed">
                <span className="font-bold">{i + 1}.</span>
                <span>
                  {r.lines.map((l, k) => (
                    <span key={k} className="block">
                      {l}
                    </span>
                  ))}
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-8 border-t border-dashed border-slate-300 pt-3 text-sm text-slate-500">
            Отговори: {v.riddles.map((r, i) => `${i + 1}. ${r.answer}`).join("; ")}
          </p>
        </>
      )}
      {v.note && <p className="print-teacher-note mt-6 text-xs text-slate-500">За учителя: {v.note}</p>}
    </>
  );
}

/* ─────────────────────────── Писмо до родителите ─────────────────────────── */

function LetterView({ l }: { l: ParentLetter }) {
  return (
    <>
      <header className="border-b-2 border-[#0a4b82] pb-3">
        <p className="text-lg font-bold text-[#0a4b82]">{KG.fullName}</p>
        <p className="text-sm text-slate-600">{KG.village}</p>
      </header>
      <h2 className="mt-8 text-center text-2xl font-bold">{l.title}</h2>
      <div className="mt-8 space-y-4 text-[17px] leading-relaxed">
        <p>{l.greeting}</p>
        {l.paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
        {l.details.length > 0 && (
          <dl className="my-6 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 rounded-xl border border-slate-300 p-4">
            {l.details.map((d) => (
              <div key={d.label} className="contents">
                <dt className="font-semibold">{d.label}:</dt>
                <dd>{d.value}</dd>
              </div>
            ))}
          </dl>
        )}
        <p className="pt-4">{l.closing}</p>
        <p className="font-semibold">{l.signature}</p>
      </div>
    </>
  );
}
