"use client";

import { useState } from "react";
import Link from "next/link";
import { BadgeCheck, Bookmark, Check, ChevronDown, Copy, Heart, Loader2, Printer, Share2, Store, Trash2, Undo2 } from "lucide-react";
import { ProposeShowcaseDialog } from "@/components/showcase/ProposeShowcaseDialog";
import { WordButton } from "@/components/WordButton";
import type { SavedMaterial } from "@/types";
import { AGE_SHORT, directionLabel, holidayLabel, KIND_LABELS, materialToText } from "@/services/materialText";
import { copyMaterial, deleteMaterial, setMaterialShared, setMaterialTried, toggleMaterialLike } from "@/lib/client/materials";
import { toast } from "@/components/Toaster";

type Props = {
  material: SavedMaterial;
  /** mine — моята библиотека; shared — споделеното от колегите */
  view: "mine" | "shared";
  onChange?: (m: SavedMaterial) => void;
  onDelete?: (id: string) => void;
};

/** Карта на материал: преглед на съдържанието, копиране, печат, споделяне, харесване. */
export function MaterialCard({ material: m, view, onChange, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState(false);
  const [copiedToLibrary, setCopiedToLibrary] = useState(false);
  const [proposing, setProposing] = useState(false);
  const [proposed, setProposed] = useState(false);
  const [triedOpen, setTriedOpen] = useState(false);
  const [triedNote, setTriedNote] = useState(m.tried?.note ?? "");

  const saveTried = async (value: { note: string } | null) => {
    setBusy("tried");
    const res = await setMaterialTried(m.id, value);
    setBusy(null);
    if (res) {
      onChange?.({ ...m, tried: res.material.tried });
      setTriedOpen(false);
      toast(value ? "Отбелязано: изпитано с деца." : "Отметката е махната.", "success");
    }
  };
  const kind = KIND_LABELS[m.kind];
  const text = materialToText(m.kind, m.content);
  const dir = directionLabel(m.direction);
  const holiday = holidayLabel(m.holiday);

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(`${m.title}\n\n${text}`);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    } catch {
      toast("Текстът не можа да се копира.", "error");
    }
  };

  const toggleShare = async () => {
    setBusy("share");
    const res = await setMaterialShared(m.id, !m.shared);
    setBusy(null);
    if (res) {
      onChange?.({ ...m, shared: res.material.shared });
      toast(res.material.shared ? "Материалът е споделен с колегите." : "Материалът вече не е споделен.", "success");
    }
  };

  const remove = async () => {
    if (!window.confirm(`Да изтрия ли „${m.title}“ от библиотеката? Това не може да се върне.`)) return;
    setBusy("delete");
    const res = await deleteMaterial(m.id);
    setBusy(null);
    if (res) {
      onDelete?.(m.id);
      toast("Материалът е изтрит.", "success");
    }
  };

  const like = async () => {
    onChange?.({ ...m, likedByMe: !m.likedByMe, likes: m.likes + (m.likedByMe ? -1 : 1) });
    const res = await toggleMaterialLike(m.id);
    if (res) onChange?.({ ...m, ...res });
    else onChange?.(m);
  };

  const saveCopy = async () => {
    setBusy("copy");
    const res = await copyMaterial(m.id);
    setBusy(null);
    if (res) {
      setCopiedToLibrary(true);
      toast("Запазено в твоята библиотека! 📚", "success");
    }
  };

  return (
    <article className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="space-y-2 p-4">
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
          <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-indigo-800">
            {kind.label}
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-700">{AGE_SHORT[m.ageGroup]}</span>
          {holiday && <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-amber-800">{holiday}</span>}
          {view === "mine" && m.shared && (
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-emerald-800">Споделено</span>
          )}
          {m.tried && (
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-0.5 text-[#0a4b82]">
              <BadgeCheck className="h-3.5 w-3.5" aria-hidden /> Изпитано с деца
            </span>
          )}
        </div>
        <h3 className="text-base font-semibold leading-snug text-slate-900">{m.title}</h3>
        {(dir || m.core) && (
          <p className="text-xs text-slate-600">
            {dir}
            {dir && m.core ? " • " : ""}
            {m.core}
          </p>
        )}
        <p className="text-xs text-slate-500">
          {view === "shared" ? `${m.authorAvatar} ${m.authorName}${m.authorGroupName ? ` (${m.authorGroupName})` : ""} • ` : ""}
          {m.createdAt}
          {m.copiedFromId ? " • копие от колега" : ""}
        </p>
        {m.tried?.note && (
          <p className="rounded-xl bg-sky-50/70 px-3 py-2 text-sm leading-relaxed text-slate-700">
            <strong className="font-semibold text-[#0a4b82]">Как мина:</strong> {m.tried.note}
          </p>
        )}
        {triedOpen && (
          <div className="space-y-2 rounded-xl border border-sky-200 bg-sky-50/50 p-3">
            <label className="block text-sm font-semibold text-slate-800" htmlFor={`tried-${m.id}`}>
              Как мина с децата? <span className="font-normal text-slate-500">(по желание — помага на колегите)</span>
            </label>
            <textarea
              id={`tried-${m.id}`}
              value={triedNote}
              onChange={(e) => setTriedNote(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Напр. „Хареса им много; за II група съкратих стиха. Добре е навън.“"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void saveTried({ note: triedNote })}
                disabled={busy !== null}
                className="inline-flex items-center gap-1 rounded-lg bg-[#0a4b82] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#083861] disabled:opacity-60"
              >
                {busy === "tried" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Запази
              </button>
              {m.tried && (
                <button type="button" onClick={() => void saveTried(null)} disabled={busy !== null} className="rounded-lg px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-50">
                  Махни отметката
                </button>
              )}
              <button type="button" onClick={() => setTriedOpen(false)} className="rounded-lg px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100">
                Отказ
              </button>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1 text-sm font-bold text-indigo-700 hover:underline"
        >
          {open ? "Скрий съдържанието" : "Виж съдържанието"}
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-3 font-sans text-sm leading-relaxed text-slate-800">
            {text || "Няма съдържание."}
          </pre>
        )}
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-slate-100 bg-slate-50/60 px-4 py-3">
        <button type="button" onClick={copyText} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100">
          {copiedText ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copiedText ? "Копирано" : "Копирай"}
        </button>
        <Link href={`/print/${m.id}`} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100">
          <Printer className="h-3.5 w-3.5" /> Принтирай
        </Link>
        <WordButton
          source={{ kind: m.kind, title: m.title, ageGroup: m.ageGroup, direction: m.direction, content: m.content }}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
        />

        {view === "mine" && (
          <>
            <button
              type="button"
              onClick={toggleShare}
              disabled={busy !== null}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold disabled:opacity-60 ${
                m.shared ? "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100" : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              {busy === "share" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : m.shared ? <Undo2 className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
              {m.shared ? "Спри споделянето" : "Сподели с колегите"}
            </button>
            <button
              type="button"
              onClick={() => setTriedOpen((v) => !v)}
              disabled={busy !== null}
              aria-expanded={triedOpen}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold disabled:opacity-60 ${
                m.tried ? "border border-sky-200 bg-sky-50 text-[#0a4b82]" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
              }`}
            >
              <BadgeCheck className="h-3.5 w-3.5" /> {m.tried ? "Изпитано ✓" : "Изпитах го"}
            </button>
            <button
              type="button"
              onClick={() => setProposing(true)}
              disabled={busy !== null || proposed}
              className="inline-flex items-center gap-1 rounded-lg border border-[#0a4b82]/30 bg-white px-2.5 py-1.5 text-xs font-bold text-[#0a4b82] hover:bg-sky-50 disabled:opacity-60"
            >
              {proposed ? <Check className="h-3.5 w-3.5" /> : <Store className="h-3.5 w-3.5" />} {proposed ? "Чака одобрение" : "За витрината"}
            </button>
            <button
              type="button"
              onClick={remove}
              disabled={busy !== null}
              aria-label={`Изтрий ${m.title}`}
              className="ml-auto inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
            >
              <Trash2 className="h-3.5 w-3.5" /> Изтрий
            </button>
          </>
        )}

        {view === "shared" && (
          <>
            <button
              type="button"
              onClick={like}
              aria-pressed={m.likedByMe}
              className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-bold ${
                m.likedByMe ? "border-rose-200 bg-rose-50 text-rose-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
              }`}
            >
              <Heart className={`h-3.5 w-3.5 ${m.likedByMe ? "fill-rose-500 text-rose-500" : ""}`} /> {m.likes}
            </button>
            {m.mine ? (
              <span className="ml-auto text-xs font-bold text-slate-500">Твой материал</span>
            ) : (
              <button
                type="button"
                onClick={saveCopy}
                disabled={busy !== null || copiedToLibrary}
                className="ml-auto inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {busy === "copy" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : copiedToLibrary ? <Check className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
                {copiedToLibrary ? "В библиотеката" : "Запази в моята библиотека"}
              </button>
            )}
          </>
        )}
      </div>
      {proposing && (
        <ProposeShowcaseDialog
          materialId={m.id}
          defaultTitle={m.title}
          onClose={() => setProposing(false)}
          onDone={() => {
            setProposing(false);
            setProposed(true);
          }}
        />
      )}
    </article>
  );
}
