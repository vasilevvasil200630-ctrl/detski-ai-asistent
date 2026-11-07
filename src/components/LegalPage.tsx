import Link from "next/link";

/** Обща подредба на правните страници (поверителност, условия): заглавие, дата, раздели. */
export function LegalPage({
  title,
  updated,
  intro,
  sections,
}: {
  title: string;
  updated: string;
  intro: string;
  sections: { id: string; heading: string; body: React.ReactNode }[];
}) {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
      <p className="mt-2 text-sm text-slate-500">Последна промяна: {updated}</p>
      <p className="mt-6 text-base leading-relaxed text-slate-700">{intro}</p>

      <nav aria-label="Съдържание" className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-sm font-semibold text-slate-900">Съдържание</p>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-slate-600">
          {sections.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="hover:text-[#0a4b82] hover:underline">
                {s.heading}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-10 space-y-10">
        {sections.map((s, i) => (
          <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} className="scroll-mt-24">
            <h2 id={`${s.id}-h`} className="text-xl font-bold text-slate-900">
              {i + 1}. {s.heading}
            </h2>
            <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-slate-700 [&_li]:mt-1.5 [&_ul]:list-disc [&_ul]:pl-5">{s.body}</div>
          </section>
        ))}
      </div>

      <p className="mt-12 border-t border-slate-200 pt-6 text-sm text-slate-500">
        Вижте също:{" "}
        <Link href="/privacy" className="font-semibold text-[#0a4b82] hover:underline">
          Поверителност
        </Link>{" "}
        ·{" "}
        <Link href="/terms" className="font-semibold text-[#0a4b82] hover:underline">
          Условия за ползване
        </Link>
      </p>
    </main>
  );
}
