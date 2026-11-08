import { KG_SIGNATURE } from "@/config/kindergarten";
import { PrintableSheet } from "@/components/print/PrintableSheet";
import { AGE_SHORT, directionLabel } from "@/services/materialText";
import { taskLine } from "@/services/gameTasks";
import type { KitParentNote, PictureCards } from "@/services/printables/types";
import type { AgeGroup, GeneratedGame, LessonDirection } from "@/types";

/**
 * „Печат на всичко“: листът за учителя и всички материали към играта — всеки на отделна страница A4.
 * Ползва се в библиотеката (/print/[id]) и направо от Магическата кутия.
 */

const SHEET = "print-sheet mx-auto w-full max-w-[210mm] bg-white p-6 text-slate-900 shadow-sm ring-1 ring-slate-200 sm:p-10";

export function GameKitSheets({
  game,
  ageGroup,
  direction,
}: {
  game: GeneratedGame;
  ageGroup: AgeGroup;
  direction: LessonDirection | null;
}) {
  const kit = game.kit;
  return (
    <div className="space-y-6 print:space-y-0">
      <GameTeacherSheet game={game} ageGroup={ageGroup} direction={direction} supplies={kit?.supplies} />
      {kit?.poster && <RhymePoster game={game} />}
      {kit?.worksheet && <PrintableSheet item={kit.worksheet} />}
      {kit?.cards && <CardsSheet cards={kit.cards} ageGroup={ageGroup} />}
      {kit?.parentNote && <ParentNoteSheet note={kit.parentNote} ageGroup={ageGroup} />}
    </div>
  );
}

export function GameTeacherSheet({
  game,
  ageGroup,
  direction,
  supplies,
}: {
  game: GeneratedGame;
  ageGroup: AgeGroup;
  direction: LessonDirection | null;
  supplies?: string[];
}) {
  const dir = directionLabel(direction);
  return (
    <article className={SHEET}>
      <p className="text-xs font-semibold text-slate-500">
        {KG_SIGNATURE} · {AGE_SHORT[ageGroup]}
        {dir ? ` · ${dir}` : ""}
      </p>
      <h1 className="mt-1 text-2xl font-bold">{game.title}</h1>
      {game.subtitle && <p className="text-slate-600">{game.subtitle}</p>}
      {supplies && supplies.length > 0 && (
        <section className="mt-5 rounded-xl border border-slate-300 p-4">
          <h2 className="font-bold">Пригответе преди играта</h2>
          <ul className="mt-2 space-y-1 text-sm leading-relaxed">
            {supplies.map((s, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-0.5 inline-block h-4 w-4 shrink-0 rounded border-2 border-slate-500" aria-hidden />
                {s}
              </li>
            ))}
          </ul>
        </section>
      )}
      <section className="mt-5 rounded-xl border border-slate-300 p-4">
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
      {game.tasks && game.tasks.length > 0 && (
        <section className="mt-5 rounded-xl border border-slate-300 p-4">
          <h2 className="font-bold">Образователни задачи (Наредба № 5)</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed">
            {game.tasks.map((t) => (
              <li key={`${t.core}|${t.result}`}>{taskLine(t)}</li>
            ))}
          </ul>
        </section>
      )}
      <dl className="mt-5 space-y-2 text-sm leading-relaxed">
        <div>
          <dt className="inline font-bold">{game.mode === "quick" ? "Полза от играта: " : "Умения по Наредба № 5: "}</dt>
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

/** Стихчето на цял лист — за стената или за дъската. */
function RhymePoster({ game }: { game: GeneratedGame }) {
  return (
    <article className={`${SHEET} flex min-h-[60vh] flex-col items-center justify-center text-center print:min-h-[250mm]`}>
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">{game.title}</p>
      <div className="mt-8 space-y-4 font-display text-3xl font-bold leading-snug sm:text-4xl print:text-5xl">
        {game.rhymeLines.map((l, i) => (
          <p key={i}>{l}</p>
        ))}
      </div>
      <p className="mt-10 text-xs text-slate-400">{KG_SIGNATURE}</p>
    </article>
  );
}

/** Карти за изрязване: по пунктира, 2 колони. */
function CardsSheet({ cards, ageGroup }: { cards: PictureCards; ageGroup: AgeGroup }) {
  return (
    <article className={SHEET}>
      <header className="flex flex-wrap items-end justify-between gap-2 border-b-2 border-slate-900 pb-3">
        <h2 className="text-xl font-bold">{cards.title}</h2>
        <p className="text-xs text-slate-500">
          {KG_SIGNATURE} · {AGE_SHORT[ageGroup]} · изрежете по пунктира
        </p>
      </header>
      <div className="mt-5 grid grid-cols-2 gap-0">
        {cards.cards.map((c, i) => (
          <div key={i} className="flex aspect-[3/2] flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-400 p-3">
            <span role="img" aria-label={c.w} className="text-6xl leading-none sm:text-7xl">
              {c.e}
            </span>
            <span className="text-lg font-bold uppercase tracking-wide">{c.w}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

function ParentNoteSheet({ note, ageGroup }: { note: KitParentNote; ageGroup: AgeGroup }) {
  return (
    <article className={SHEET}>
      <p className="text-xs font-semibold text-slate-500">
        {KG_SIGNATURE} · {AGE_SHORT[ageGroup]}
      </p>
      <h2 className="mt-1 text-2xl font-bold">{note.title}</h2>
      <div className="mt-5 space-y-3 text-[16px] leading-relaxed">
        {note.paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      {note.homeIdea && (
        <section className="mt-6 rounded-xl border border-slate-300 p-4 text-[15px] leading-relaxed">
          <h3 className="font-bold">Ако желаете — игра вкъщи</h3>
          <p className="mt-1">{note.homeIdea}</p>
        </section>
      )}
      <p className="mt-8 text-sm">
        С поздрав,
        <br />
        учителите от {AGE_SHORT[ageGroup]}, {KG_SIGNATURE}
      </p>
    </article>
  );
}
