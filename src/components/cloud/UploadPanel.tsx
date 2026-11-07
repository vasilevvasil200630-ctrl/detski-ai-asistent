"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle, CloudUpload, Loader2, X } from "lucide-react";
import { fileTypeFor, formatBytes, titleFromFileName, type CloudFolderId, type CloudUsage } from "@/lib/cloud/folders";
import { uploadCloudFile } from "@/lib/client/cloud";
import { MetaFields, type MetaState } from "./MetaFields";

/** Ключ на избран файл — индексите се местят, когато махнете файл от списъка. */
const fileKey = (f: File) => `${f.name}:${f.size}:${f.lastModified}`;

type Row = { title: string; progress: number; status: "waiting" | "uploading" | "done" | "error"; error?: string };

/** Избраните файлове: заглавие за всеки, общи настройки, качване едно по едно с напредък. */
export function UploadPanel({
  files,
  usage,
  defaultFolder,
  defaultAgeGroup,
  onRemove,
  onCancel,
  onDone,
}: {
  files: File[];
  usage: CloudUsage;
  defaultFolder: CloudFolderId;
  defaultAgeGroup: string;
  onRemove: (index: number) => void;
  onCancel: () => void;
  /** close = false: някои файлове не минаха — панелът остава, за да се видят грешките */
  onDone: (uploaded: number, close: boolean) => void;
}) {
  const [rows, setRows] = useState<Record<string, Row>>({});
  const [meta, setMeta] = useState<MetaState>({
    folder: defaultFolder,
    ageGroup: defaultFolder === "documents" || defaultFolder === "parents" ? "" : defaultAgeGroup,
    direction: "",
    shared: true,
    description: "",
  });
  const [busy, setBusy] = useState(false);

  const row = (i: number): Row => rows[fileKey(files[i])] ?? { title: titleFromFileName(files[i].name), progress: 0, status: "waiting" };
  const patch = (i: number, p: Partial<Row>) => {
    const k = fileKey(files[i]);
    const fallback = row(i);
    setRows((prev) => ({ ...prev, [k]: { ...fallback, ...prev[k], ...p } }));
  };

  /** Проверка в браузъра, преди да тръгне качването (сървърът проверява пак). */
  function problem(file: File): string | null {
    if (!fileTypeFor(file.name)) return "Този вид файл не се приема.";
    if (file.size === 0) return "Файлът е празен.";
    if (file.size > usage.maxFileSize) return `По-голям от ${formatBytes(usage.maxFileSize)}.`;
    return null;
  }

  const remaining = files.filter((_, i) => row(i).status !== "done").length;

  async function start() {
    setBusy(true);
    let uploaded = 0;
    const failed: number[] = [];
    for (let i = 0; i < files.length; i++) {
      const r = row(i);
      if (r.status === "done") continue;
      const p = problem(files[i]);
      if (p) {
        patch(i, { status: "error", error: p });
        failed.push(i);
        continue;
      }
      patch(i, { status: "uploading", progress: 0, error: undefined });
      try {
        await uploadCloudFile(
          files[i],
          {
            title: r.title.trim() || titleFromFileName(files[i].name),
            description: meta.description,
            folder: meta.folder,
            ageGroup: meta.ageGroup || null,
            direction: meta.direction || null,
            shared: meta.shared,
          },
          (progress) => patch(i, { progress }),
        );
        patch(i, { status: "done", progress: 100 });
        uploaded++;
      } catch (e) {
        patch(i, { status: "error", error: e instanceof Error ? e.message : "Неуспешно качване." });
        failed.push(i);
      }
    }
    setBusy(false);
    // Всичко мина — затваряме; иначе остават редовете с грешки, за да се види защо
    onDone(uploaded, failed.length === 0);
  }

  return (
    <section aria-labelledby="upload-title" className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="upload-title" className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <CloudUpload className="h-5 w-5 text-[#0a4b82]" aria-hidden /> Качване в облака
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            До {formatBytes(usage.maxFileSize)} на файл · PDF, Word, Excel, PowerPoint, снимки, аудио, видео, ZIP
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          aria-label="Затвори качването"
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-40"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <ul className="mt-4 space-y-2">
        {files.map((file, i) => {
          const r = row(i);
          const pre = r.status === "waiting" ? problem(file) : null;
          return (
            <li key={fileKey(file)} className="rounded-xl border border-slate-200 p-3">
              <div className="flex items-center gap-3">
                <span className="shrink-0" aria-hidden>
                  {r.status === "done" ? (
                    <CheckCircle className="h-5 w-5 text-[#1a7f45]" />
                  ) : r.status === "error" || pre ? (
                    <AlertCircle className="h-5 w-5 text-rose-600" />
                  ) : r.status === "uploading" ? (
                    <Loader2 className="h-5 w-5 animate-spin text-[#0a4b82]" />
                  ) : (
                    <CloudUpload className="h-5 w-5 text-slate-400" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <label className="sr-only" htmlFor={`up-title-${i}`}>
                    Заглавие на {file.name}
                  </label>
                  <input
                    id={`up-title-${i}`}
                    value={r.title}
                    disabled={busy || r.status === "done"}
                    maxLength={140}
                    onChange={(e) => patch(i, { title: e.target.value })}
                    className="w-full rounded-md border border-transparent px-1.5 py-0.5 font-semibold text-slate-900 hover:border-slate-200 focus:border-[#0a4b82] focus:outline-none disabled:bg-transparent"
                  />
                  <p className="truncate px-1.5 text-xs text-slate-500">
                    {file.name} · {formatBytes(file.size)}
                  </p>
                </div>
                {!busy && r.status !== "done" && (
                  <button
                    type="button"
                    onClick={() => onRemove(i)}
                    aria-label={`Махни ${file.name}`}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                )}
              </div>
              {r.status === "uploading" && (
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={r.progress} aria-valuemin={0} aria-valuemax={100} aria-label={`Качване на ${file.name}`}>
                  <div className="h-full rounded-full bg-[#0a4b82] transition-[width] duration-200" style={{ width: `${Math.max(r.progress, 3)}%` }} />
                </div>
              )}
              {(r.error || pre) && <p className="mt-1.5 px-1.5 text-sm text-rose-700">{r.error ?? pre}</p>}
            </li>
          );
        })}
      </ul>

      <div className="mt-5">
        <MetaFields value={meta} onChange={setMeta} idPrefix="upload" />
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
        >
          Откажи
        </button>
        <button
          type="button"
          onClick={() => void start()}
          disabled={busy || remaining === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0a4b82] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#083861] disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <CloudUpload className="h-4 w-4" aria-hidden />}
          {busy ? "Качване…" : remaining === 1 ? "Качи файла" : `Качи ${remaining} файла`}
        </button>
      </div>
    </section>
  );
}
