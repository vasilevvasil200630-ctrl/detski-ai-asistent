import { KG } from "@/config/kindergarten";

export type CertificateKind = "gramota" | "diploma" | "pohvala";

export const CERTIFICATE_LABELS: Record<CertificateKind, { title: string; lead: string }> = {
  gramota: { title: "Грамота", lead: "се връчва на" },
  diploma: { title: "Диплома", lead: "се връчва на" },
  pohvala: { title: "Похвала", lead: "за" },
};

/** Готови формулировки за повода — учителят може да напише и свой. */
export const CERTIFICATE_REASONS: Record<CertificateKind, string[]> = {
  gramota: [
    "за отлично представяне на празника",
    "за участие в конкурса за рисунка",
    "за старание и любознателност през учебната година",
    "за смелост и артистичност на сцената",
    "за спортен дух и добра игра в екип",
    "за отлично познаване на правилата за движение по пътищата",
  ],
  diploma: [
    "за завършена подготвителна група и готовност за първи клас",
    "за успешно завършена учебна година",
  ],
  pohvala: ["добро сърце и помощ към приятелите", "голямо старание в рисуването", "най-подредено кътче в групата", "весело настроение всеки ден"],
};

/**
 * Една грамота/диплома на страница A4. Името на детето се въвежда в браузъра и не се
 * изпраща към сървъра (виж „Поверителност“).
 */
export function CertificateSheet({
  kind,
  childName,
  reason,
  date,
  teacher,
  director,
}: {
  kind: CertificateKind;
  childName: string;
  reason: string;
  date: string;
  teacher: string;
  director: string;
}) {
  const label = CERTIFICATE_LABELS[kind];
  return (
    <article className="print-sheet certificate-sheet mx-auto flex aspect-[210/297] w-full max-w-[210mm] flex-col bg-white p-5 text-slate-900 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-1 flex-col items-center rounded-[18px] border-[6px] border-double border-[#0a4b82] px-6 py-10 text-center sm:px-12">
        <p className="text-sm font-semibold text-[#1a7f45]">
          {KG.fullName} · {KG.village}
        </p>
        <svg viewBox="0 0 100 40" className="mt-6 h-10 w-28" aria-hidden>
          <path d="M5 20 Q25 2 50 20 Q75 38 95 20" fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
          <circle cx="50" cy="20" r="5" fill="#f59e0b" />
        </svg>
        <h2 className="mt-4 text-5xl font-bold tracking-wide text-[#0a4b82] sm:text-6xl">{label.title}</h2>
        <p className="mt-10 text-lg text-slate-600">{label.lead}</p>
        <p className="mt-4 min-h-[3.5rem] w-full border-b-2 border-slate-400 pb-2 text-4xl font-bold">{childName || " "}</p>
        <p className="mt-8 max-w-md text-xl leading-relaxed">{reason}</p>
        <div className="mt-auto grid w-full grid-cols-2 gap-10 pt-16 text-sm">
          <div>
            <div className="border-b border-slate-500 pb-1 text-base">{teacher || " "}</div>
            <p className="mt-1 text-slate-500">Учител</p>
          </div>
          <div>
            <div className="border-b border-slate-500 pb-1 text-base">{director || " "}</div>
            <p className="mt-1 text-slate-500">Директор</p>
          </div>
        </div>
        <p className="mt-8 text-sm text-slate-500">{date}</p>
      </div>
    </article>
  );
}
