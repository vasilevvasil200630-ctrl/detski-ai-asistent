"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Loader2, X } from "lucide-react";
import type { CloudFileItem } from "@/lib/cloud/folders";
import { updateCloudFile } from "@/lib/client/cloud";
import { MetaFields, type MetaState } from "./MetaFields";

/** Редакция на файл от качилия го: заглавие, папка, група, направление, описание, видимост. */
export function EditFileDialog({ file, onClose, onSaved }: { file: CloudFileItem; onClose: () => void; onSaved: (f: CloudFileItem) => void }) {
  const titleId = useId();
  const [title, setTitle] = useState(file.title);
  const [meta, setMeta] = useState<MetaState>({
    folder: file.folder,
    ageGroup: file.ageGroup ?? "",
    direction: file.direction ?? "",
    shared: file.shared,
    description: file.description,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firstRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const next = await updateCloudFile(file.id, {
        title: title.trim(),
        description: meta.description,
        folder: meta.folder,
        ageGroup: meta.ageGroup || null,
        direction: meta.direction || null,
        shared: meta.shared,
      });
      onSaved(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Промяната не беше записана.");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} aria-hidden />
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onSubmit={save}
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-lg"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-lg font-bold text-slate-900">
            Редакция на файла
          </h2>
          <button type="button" onClick={onClose} aria-label="Затвори" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <p className="mt-0.5 truncate text-sm text-slate-500">{file.fileName}</p>

        <label htmlFor="edit-title" className="mt-5 block text-sm font-medium text-slate-700">
          Заглавие
        </label>
        <input
          id="edit-title"
          ref={firstRef}
          value={title}
          maxLength={140}
          required
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-[#0a4b82] focus:outline-none focus:ring-2 focus:ring-[#0a4b82]/20"
        />
        <div className="mt-4">
          <MetaFields value={meta} onChange={setMeta} idPrefix="edit" />
        </div>
        {error && <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50">
            Откажи
          </button>
          <button
            type="submit"
            disabled={saving || !title.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0a4b82] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#083861] disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Запази
          </button>
        </div>
      </form>
    </div>
  );
}
