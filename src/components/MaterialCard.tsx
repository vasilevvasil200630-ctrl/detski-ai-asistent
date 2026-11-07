"use client";

import { useState } from "react";
import { Bookmark, Check, ChevronDown, Copy, Heart, Loader2, Printer, Share2, Trash2, Undo2 } from "lucide-react";
import type { SavedMaterial } from "@/types";
import { AGE_SHORT, directionLabel, holidayLabel, KIND_LABELS, materialToText } from "@/services/materialText";
import { copyMaterial, deleteMaterial, setMaterialShared, toggleMaterialLike } from "@/lib/client/materials";
import { toast } from "@/components/Toaster";

type Props = {
  material: SavedMaterial;
  /** mine — моята библиотека; shared — споделеното от колегите */
  view: "mine" | "shared";
  onChange?: (m: SavedMaterial) => void;
  onDelete?: (id: string) => void;
};

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** Карта на материал: преглед на съдържанието, копиране, печат, споделяне, харесване. */
export function MaterialCard({ material: m, view, onChange, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState(false);
  const [copiedToLibrary, setCopiedToLibrary] = useState(false);
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

  const print = () => {
    const w = window.open("", "_blank", "width=800,height=900");
    if (!w) return toast("Браузърът блокира прозореца за печат.", "error");
    w.document.write(
      `<!doctype html><html lang="bg"><head><meta charset="utf-8"><title>${escapeHtml(m.title)}</title>` +
        `<style>body{font-family:system-ui,sans-serif;margin:32px;line-height:1.5;color:#111}h1{font-size:20px}pre{white-space:pre-wrap;font:inherit}</style>` +
        `</head><body><h1>${escapeHtml(m.title)}</h1><pre>${escapeHtml(text)}</pre></body></html>`,
    );
    w.document.close();
    w.focus();
    w.print();
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
        <button type="button" onClick={print} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100">
          <Printer className="h-3.5 w-3.5" /> Принтирай
        </button>

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
    </article>
  );
}
