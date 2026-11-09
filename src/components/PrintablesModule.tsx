"use client";

import { useEffect, useMemo, useState } from "react";
import { Award, FileText, Loader2, Mail, Music, Printer, RefreshCw, Sparkles } from "lucide-react";
import { SaveMaterialBar } from "./SaveMaterialBar";
import { CloudSaveButton } from "./CloudSaveButton";
import { VoiceMic } from "./VoiceMic";
import { PrintableSheet } from "./print/PrintableSheet";
import { PrintOptions } from "./print/PrintOptions";
import { CERTIFICATE_LABELS, CERTIFICATE_REASONS, CertificateSheet, type CertificateKind } from "./print/CertificateSheet";
import {
  LETTER_LABELS,
  VERSES_LABELS,
  WORKSHEET_STYLE_LABELS,
  buildDemoPrintable,
  printableToText,
  type LetterKind,
  type Printable,
  type PrintableRequest,
  type VersesKind,
  type WorksheetStyle,
} from "@/services/printables";
import type { AgeGroup, LessonDirection, SessionTeacher } from "@/types";

type Tab = "worksheet" | "verses" | "letter" | "certificate";

const TABS: { id: Tab; label: string; icon: typeof FileText }[] = [
  { id: "worksheet", label: "Работни листове", icon: FileText },
  { id: "verses", label: "Стихчета, гатанки, броилки", icon: Music },
  { id: "letter", label: "Писма до родителите", icon: Mail },
  { id: "certificate", label: "Грамоти и дипломи", icon: Award },
];

const AGES: { id: AgeGroup; label: string }[] = [
  { id: "1", label: "I група" },
  { id: "2", label: "II група" },
  { id: "3", label: "III ПГ" },
  { id: "4", label: "IV ПГ" },
];

const DIRECTIONS: { id: LessonDirection; label: string }[] = [
  { id: "math", label: "Математика" },
  { id: "bel", label: "БЕЛ" },
  { id: "world", label: "Околен свят" },
  { id: "art", label: "Изобразително изкуство" },
  { id: "music", label: "Музика" },
  { id: "construct", label: "Конструиране и технологии" },
  { id: "pe", label: "Физическа култура" },
  { id: "bdp", label: "БДП" },
];

const chip = (active: boolean) =>
  `rounded-xl border px-3.5 py-2 text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a4b82] ${
    active ? "border-[#0a4b82] bg-[#0a4b82] text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
  }`;
const LABEL = "mb-2 block text-sm font-semibold text-slate-800";

/** Подсказка под избора „Вид лист“. */
const STYLE_HINTS: Record<WorksheetStyle, string> = {
  mixed: "3–4 различни задачи по направлението и темата.",
  maze: "Два лабиринта с картинки от темата — по-големи за по-големите деца.",
  differences: "Две двойки картинки с 2–5 разлики според групата. Отговорите са за учителя.",
  half: "Симетрични рисунки: по пунктира за I–II група, по точките в мрежа за III–IV група.",
};
const INPUT = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-[#0a4b82] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a4b82]/20";

/** Сървърът (Gemini с проверка), а без връзка — вграденият двигател в браузъра. */
async function generatePrintable(req: PrintableRequest): Promise<{ item: Printable; source: "ai" | "demo" }> {
  const minWait = new Promise((r) => setTimeout(r, 700));
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 40000);
    const res = await fetch("/api/ai/printable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as { item: Printable; source: "ai" | "demo" };
    await minWait;
    return data;
  } catch {
    await minWait;
    return { item: buildDemoPrintable(req), source: "demo" };
  }
}

function todayBg(): string {
  return new Date().toLocaleDateString("bg-BG", { day: "numeric", month: "long", year: "numeric" });
}

export function PrintablesModule({ teacher }: { teacher: SessionTeacher | null }) {
  const [tab, setTab] = useState<Tab>("worksheet");
  const [ageGroup, setAgeGroup] = useState<AgeGroup>(teacher?.ageGroup ?? "2");
  const [topic, setTopic] = useState("");
  const [direction, setDirection] = useState<LessonDirection>("math");
  const [style, setStyle] = useState<WorksheetStyle>("mixed");
  const [versesKind, setVersesKind] = useState<VersesKind>("riddles");
  const [letterKind, setLetterKind] = useState<LetterKind>("invitation");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [place, setPlace] = useState("");
  const [extra, setExtra] = useState("");
  const [busy, setBusy] = useState(false);
  const [item, setItem] = useState<Printable | null>(null);
  const [hideTeacherNote, setHideTeacherNote] = useState(false);

  // Грамоти: имената остават само в браузъра
  const [certKind, setCertKind] = useState<CertificateKind>("gramota");
  const [reason, setReason] = useState(CERTIFICATE_REASONS.gramota[0]!);
  const [names, setNames] = useState("");
  const [certDate, setCertDate] = useState(todayBg());
  const [teacherName, setTeacherName] = useState(teacher?.name ?? "");
  const [director, setDirector] = useState("");

  useEffect(() => {
    if (teacher) {
      setAgeGroup(teacher.ageGroup);
      setTeacherName((n) => n || teacher.name);
    }
  }, [teacher?.id, teacher?.ageGroup, teacher?.name]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setItem(null);
  }, [tab]);

  const request = useMemo<PrintableRequest | null>(() => {
    if (tab === "worksheet") return { type: "worksheet", ageGroup, direction, topic, style };
    if (tab === "verses") return { type: "verses", ageGroup, kind: versesKind, topic };
    if (tab === "letter")
      return { type: "letter", ageGroup, kind: letterKind, topic, date, time, place, extra, groupName: teacher?.groupName || undefined };
    return null;
  }, [tab, ageGroup, direction, topic, style, versesKind, letterKind, date, time, place, extra, teacher?.groupName]);

  async function generate() {
    if (!request) return;
    setBusy(true);
    try {
      const res = await generatePrintable(request);
      setItem(res.item);
    } finally {
      setBusy(false);
    }
  }

  const certNames = names
    .split("\n")
    .map((n) => n.trim())
    .filter(Boolean);

  const saveDirection: LessonDirection | null = item?.type === "worksheet" ? item.direction : null;

  return (
    <section className="space-y-6">
      <div className="no-print border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Материали за печат</h1>
        <p className="mt-1 max-w-3xl text-slate-600">
          Работни листове, стихчета и гатанки, писма до родителите, грамоти и дипломи — за вашата група и по темата, която
          сте взели. Всеки път се създава нов вариант.
        </p>
      </div>

      <div className="no-print flex flex-wrap gap-2" role="tablist" aria-label="Вид материал">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`inline-flex items-center gap-2 ${chip(tab === id)}`}>
            <Icon className="h-4 w-4" aria-hidden /> {label}
          </button>
        ))}
      </div>

      {tab !== "certificate" ? (
        <div className="no-print space-y-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <fieldset>
            <legend className={LABEL}>Група</legend>
            <div className="flex flex-wrap gap-2">
              {AGES.map((a) => (
                <button key={a.id} type="button" aria-pressed={ageGroup === a.id} onClick={() => setAgeGroup(a.id)} className={chip(ageGroup === a.id)}>
                  {a.label}
                </button>
              ))}
            </div>
          </fieldset>

          {tab === "worksheet" && (
            <fieldset>
              <legend className={LABEL}>Вид лист</legend>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(WORKSHEET_STYLE_LABELS) as WorksheetStyle[]).map((k) => (
                  <button key={k} type="button" aria-pressed={style === k} onClick={() => setStyle(k)} className={chip(style === k)}>
                    {WORKSHEET_STYLE_LABELS[k]}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-500">{STYLE_HINTS[style]}</p>
            </fieldset>
          )}

          {tab === "worksheet" && (
            <fieldset>
              <legend className={LABEL}>Направление</legend>
              <div className="flex flex-wrap gap-2">
                {DIRECTIONS.map((d) => (
                  <button key={d.id} type="button" aria-pressed={direction === d.id} onClick={() => setDirection(d.id)} className={chip(direction === d.id)}>
                    {d.label}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {tab === "verses" && (
            <fieldset>
              <legend className={LABEL}>Какво да има</legend>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(VERSES_LABELS) as VersesKind[]).map((k) => (
                  <button key={k} type="button" aria-pressed={versesKind === k} onClick={() => setVersesKind(k)} className={chip(versesKind === k)}>
                    {VERSES_LABELS[k]}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {tab === "letter" && (
            <fieldset>
              <legend className={LABEL}>Вид писмо</legend>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(LETTER_LABELS) as LetterKind[]).map((k) => (
                  <button key={k} type="button" aria-pressed={letterKind === k} onClick={() => setLetterKind(k)} className={chip(letterKind === k)}>
                    {LETTER_LABELS[k]}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          <div>
            <label htmlFor="printable-topic" className={LABEL}>
              {tab === "letter" ? "Повод" : "Тема, която сте взели"}
            </label>
            <div className="flex items-center gap-2">
              <input
                id="printable-topic"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                maxLength={120}
                placeholder={tab === "letter" ? "напр. Коледно тържество, Родителска среща, Есенна разходка" : "напр. Есен в гората, Домашни животни, Пролет"}
                className={`${INPUT} min-w-0 flex-1`}
              />
              <VoiceMic onTranscript={setTopic} />
            </div>
          </div>

          {tab === "letter" && (
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="letter-date" className={LABEL}>Дата</label>
                <input id="letter-date" value={date} onChange={(e) => setDate(e.target.value)} placeholder="18 декември" className={INPUT} />
              </div>
              <div>
                <label htmlFor="letter-time" className={LABEL}>Час</label>
                <input id="letter-time" value={time} onChange={(e) => setTime(e.target.value)} placeholder="10:30 ч." className={INPUT} />
              </div>
              <div>
                <label htmlFor="letter-place" className={LABEL}>Място</label>
                <input id="letter-place" value={place} onChange={(e) => setPlace(e.target.value)} placeholder="Физкултурния салон" className={INPUT} />
              </div>
              <div className="sm:col-span-3">
                <label htmlFor="letter-extra" className={LABEL}>Какво още да пише (по желание)</label>
                <textarea id="letter-extra" value={extra} onChange={(e) => setExtra(e.target.value)} rows={2} maxLength={500} placeholder="напр. Моля, облечете децата в бяло; донесете по една кутия от яйца." className={INPUT} />
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={generate}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0a4b82] px-6 py-3 font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-[#083861] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a4b82] focus-visible:ring-offset-2 disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : item ? <RefreshCw className="h-4 w-4" aria-hidden /> : <Sparkles className="h-4 w-4" aria-hidden />}
              {busy ? "Създаване…" : item ? "Нов вариант" : "Създай"}
            </button>
          </div>
        </div>
      ) : (
        <div className="no-print space-y-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <fieldset>
            <legend className={LABEL}>Вид</legend>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(CERTIFICATE_LABELS) as CertificateKind[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={certKind === k}
                  onClick={() => {
                    setCertKind(k);
                    setReason(CERTIFICATE_REASONS[k][0]!);
                  }}
                  className={chip(certKind === k)}
                >
                  {CERTIFICATE_LABELS[k].title}
                </button>
              ))}
            </div>
          </fieldset>
          <div>
            <label htmlFor="cert-reason" className={LABEL}>Повод</label>
            <input id="cert-reason" list="cert-reasons" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={160} className={INPUT} />
            <datalist id="cert-reasons">
              {CERTIFICATE_REASONS[certKind].map((r) => (
                <option key={r} value={r} />
              ))}
            </datalist>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {CERTIFICATE_REASONS[certKind].map((r) => (
                <button key={r} type="button" onClick={() => setReason(r)} className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50">
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="cert-names" className={LABEL}>
              Имена на децата — по едно на ред <span className="font-normal text-slate-500">(остават само на това устройство)</span>
            </label>
            <textarea id="cert-names" value={names} onChange={(e) => setNames(e.target.value)} rows={5} placeholder={"Мария\nГеорги\nВиктория"} className={INPUT} />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="cert-date" className={LABEL}>Дата</label>
              <input id="cert-date" value={certDate} onChange={(e) => setCertDate(e.target.value)} className={INPUT} />
            </div>
            <div>
              <label htmlFor="cert-teacher" className={LABEL}>Учител</label>
              <input id="cert-teacher" value={teacherName} onChange={(e) => setTeacherName(e.target.value)} className={INPUT} />
            </div>
            <div>
              <label htmlFor="cert-director" className={LABEL}>Директор</label>
              <input id="cert-director" value={director} onChange={(e) => setDirector(e.target.value)} placeholder="Име на директора" className={INPUT} />
            </div>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0a4b82] px-6 py-3 font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-[#083861] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a4b82] focus-visible:ring-offset-2"
          >
            <Printer className="h-4 w-4" aria-hidden />
            {certNames.length > 1 ? `Принтирай всички (${certNames.length})` : "Принтирай"}
          </button>
          <PrintOptions />
          <p className="text-xs text-slate-500">Без имена се печата празна грамота — името се попълва на ръка.</p>
        </div>
      )}

      {tab === "certificate" ? (
        <div className="print-area space-y-6">
          {(certNames.length ? certNames : [""]).map((n, i) => (
            <CertificateSheet key={i} kind={certKind} childName={n} reason={reason} date={certDate} teacher={teacherName} director={director} />
          ))}
        </div>
      ) : item ? (
        <div className="space-y-4">
          <div className="no-print flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition-colors duration-150 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a4b82]"
            >
              <Printer className="h-4 w-4" aria-hidden /> Принтирай
            </button>
            {(item.type === "worksheet" || item.type === "verses") && (
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" checked={hideTeacherNote} onChange={(e) => setHideTeacherNote(e.target.checked)} className="h-4 w-4 accent-[#0a4b82]" />
                Без бележката за учителя при печат
              </label>
            )}
            <PrintOptions />
            <SaveMaterialBar
              key={item.title + item.type + JSON.stringify(item).length}
              compact
              material={{
                kind: "MATERIAL",
                title: item.title,
                ageGroup,
                direction: saveDirection,
                holiday: null,
                meta: { printable: item.type, topic: topic || undefined },
                content: { text: printableToText(item), printable: item },
              }}
            />
            <CloudSaveButton
              key={`cloud-${item.title}-${JSON.stringify(item).length}`}
              source={{ source: "material", kind: "MATERIAL", title: item.title, ageGroup, direction: saveDirection, content: { text: printableToText(item), printable: item } }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
            />
          </div>
          <div className={`print-area ${hideTeacherNote ? "print-hide-teacher" : ""}`}>
            <PrintableSheet item={item} />
          </div>
        </div>
      ) : (
        <p className="no-print rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
          Изберете група и тема и натиснете „Създай“. Всяко натискане на „Нов вариант“ дава различен материал.
        </p>
      )}
    </section>
  );
}
