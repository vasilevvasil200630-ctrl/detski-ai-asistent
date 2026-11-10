import { KG_SIGNATURE } from "@/config/kindergarten";
import type { GeneratedLessonPlan } from "@/types";
import { planBlocksAfter, planBlocksBefore, type PlanBlock } from "@/services/lessonSections";

function Block({ b }: { b: PlanBlock }) {
  return (
    <>
      <h2 className="mt-4 font-bold">{b.title}</h2>
      {b.note && <p className="text-xs italic text-slate-500">{b.note}</p>}
      {b.items.length === 1 && !b.numbered ? (
        <p className="mt-1 text-sm">{b.items[0]}</p>
      ) : b.numbered ? (
        <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm">
          {b.items.map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ol>
      ) : (
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
          {b.items.map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ul>
      )}
    </>
  );
}

/** План-конспектът за печат — в библиотеката и на витрината. */
export function LessonPrint({ plan }: { plan: GeneratedLessonPlan }) {
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
          {plan.situationType && (
            <>
              <dt className="font-semibold">Вид:</dt>
              <dd>{plan.situationType}</dd>
            </>
          )}
          {plan.organizationForm && (
            <>
              <dt className="font-semibold">Форма:</dt>
              <dd>{plan.organizationForm}</dd>
            </>
          )}
        </dl>
        {planBlocksBefore(plan).map((b) => (
          <Block key={b.title} b={b} />
        ))}
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
        {planBlocksAfter(plan).map((b) => (
          <Block key={b.title} b={b} />
        ))}
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
