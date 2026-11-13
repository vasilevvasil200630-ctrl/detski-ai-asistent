"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CloudUpload,
  Download,
  Eye,
  FileArchive,
  FileImage,
  FileMusic,
  FileSpreadsheet,
  FileText,
  FileVideoCamera,
  FolderOpen,
  HardDrive,
  Loader2,
  Lock,
  Pencil,
  Presentation,
  Search,
  Trash2,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { SessionTeacher } from "@/types";
import { toast } from "@/components/Toaster";
import { AGE_SHORT } from "@/services/materialText";
import {
  CLOUD_ACCEPT,
  CLOUD_FOLDERS,
  folderLabel,
  formatBytes,
  type CloudFileItem,
  type CloudFileKind,
  type CloudFolderId,
  type CloudUsage,
} from "@/lib/cloud/folders";
import { cloudDownloadUrl, deleteCloudFile, listCloudFiles, updateCloudFile, CloudError } from "@/lib/client/cloud";
import { UploadPanel } from "./UploadPanel";
import { EditFileDialog } from "./EditFileDialog";

const KIND_ICON: Record<CloudFileKind, { icon: LucideIcon; tone: string; label: string }> = {
  pdf: { icon: FileText, tone: "bg-rose-50 text-rose-700", label: "PDF" },
  doc: { icon: FileText, tone: "bg-sky-50 text-sky-700", label: "Документ" },
  sheet: { icon: FileSpreadsheet, tone: "bg-emerald-50 text-emerald-700", label: "Таблица" },
  slides: { icon: Presentation, tone: "bg-amber-50 text-amber-700", label: "Презентация" },
  image: { icon: FileImage, tone: "bg-violet-50 text-violet-700", label: "Снимка" },
  audio: { icon: FileMusic, tone: "bg-pink-50 text-pink-700", label: "Аудио" },
  video: { icon: FileVideoCamera, tone: "bg-indigo-50 text-indigo-700", label: "Видео" },
  text: { icon: FileText, tone: "bg-slate-100 text-slate-700", label: "Текст" },
  archive: { icon: FileArchive, tone: "bg-stone-100 text-stone-700", label: "Архив" },
};

const ICON_BASE = "grid h-9 w-9 place-items-center rounded-lg border border-slate-200 transition-colors duration-150";
const ICON_BTN = `${ICON_BASE} text-slate-600 hover:bg-slate-50 hover:text-slate-900`;
const ICON_DANGER = `${ICON_BASE} text-rose-700 hover:bg-rose-50`;

const SCOPES = [
  { id: "all", label: "Всички файлове" },
  { id: "mine", label: "Качени от мен" },
  { id: "private", label: "Само за мен" },
] as const;
type Scope = (typeof SCOPES)[number]["id"];

function FileThumb({ file }: { file: CloudFileItem }) {
  const meta = KIND_ICON[file.kind];
  const [broken, setBroken] = useState(false);
  if (file.kind === "image" && file.inline && !broken) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- частен файл през сървъра, без оптимизация
      <img
        src={cloudDownloadUrl(file.id, true)}
        alt=""
        loading="lazy"
        onError={() => setBroken(true)}
        className="h-11 w-11 shrink-0 rounded-lg object-cover ring-1 ring-slate-200"
      />
    );
  }
  const Icon = meta.icon;
  return (
    <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg ${meta.tone}`} aria-hidden>
      <Icon className="h-5 w-5" />
    </span>
  );
}

function UsageMeter({ usage }: { usage: CloudUsage }) {
  const pct = Math.min(100, Math.round((usage.used / usage.quota) * 100));
  return (
    <div className="min-w-[220px]">
      <p className="flex items-center gap-1.5 text-sm text-slate-600">
        <HardDrive className="h-4 w-4 text-slate-400" aria-hidden />
        Заети <strong className="font-semibold text-slate-900">{formatBytes(usage.used)}</strong> от {formatBytes(usage.quota)}
      </p>
      <div
        className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100"
        role="meter"
        aria-label="Заето място в облака"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
      >
        <div className={`h-full rounded-full ${pct > 90 ? "bg-rose-500" : "bg-[#1a7f45]"}`} style={{ width: `${Math.max(pct, 1)}%` }} />
      </div>
    </div>
  );
}

/** Общият облак на градината: качване, сваляне, папки, търсене, лични файлове. */
export function CloudModule({ user }: { user: SessionTeacher }) {
  const [scope, setScope] = useState<Scope>("all");
  const [folder, setFolder] = useState<CloudFolderId | null>(null);
  const [ageGroup, setAgeGroup] = useState<string>("");
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [files, setFiles] = useState<CloudFileItem[] | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [usage, setUsage] = useState<CloudUsage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<File[]>([]);
  const [editing, setEditing] = useState<CloudFileItem | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const requestId = useRef(0);

  // Филтрите от адреса: /cloud?scope=private, /cloud?folder=documents
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get("scope");
    if (s === "mine" || s === "private") setScope(s);
    const f = params.get("folder");
    if (f && CLOUD_FOLDERS.some((x) => x.id === f)) setFolder(f as CloudFolderId);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setError(null);
    try {
      const data = await listCloudFiles({ scope, folder: folder ?? undefined, ageGroup: ageGroup || undefined, q: debounced || undefined });
      if (id !== requestId.current) return;
      setFiles(data.files);
      setCounts(data.counts);
      setUsage(data.usage);
    } catch (e) {
      if (id !== requestId.current) return;
      setError(e instanceof CloudError ? e.message : "Файловете не можаха да се заредят.");
      setFiles([]);
    }
  }, [scope, folder, ageGroup, debounced]);

  useEffect(() => {
    void load();
  }, [load]);

  const total = useMemo(() => Object.values(counts).reduce((a, b) => a + b, 0), [counts]);

  function pickFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    const key = (f: File) => `${f.name}:${f.size}:${f.lastModified}`;
    setPending((prev) => {
      const seen = new Set(prev.map(key));
      return [...prev, ...Array.from(list).filter((f) => !seen.has(key(f)))].slice(0, 20);
    });
  }

  async function toggleShared(file: CloudFileItem) {
    try {
      const next = await updateCloudFile(file.id, { shared: !file.shared });
      setFiles((prev) => prev?.map((f) => (f.id === file.id ? next : f)) ?? null);
      toast(next.shared ? "Файлът е споделен с всички учители." : "Файлът вече е само за вас.", "success");
      if (scope === "private") void load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Промяната не беше записана.", "error");
    }
  }

  async function remove(file: CloudFileItem) {
    const who = file.mine ? "" : ` (качен от ${file.uploaderName})`;
    if (!window.confirm(`Да изтрия ли „${file.title}“${who}? Файлът изчезва за всички и не може да се върне.`)) return;
    try {
      await deleteCloudFile(file.id);
      toast("Файлът е изтрит.", "success");
      void load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Файлът не беше изтрит.", "error");
    }
  }

  const kgName = user.kindergarten?.name ?? "градината";

  return (
    <main
      className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes("Files")) return;
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) setDragging(false);
      }}
      onDrop={(e) => {
        if (!e.dataTransfer.files.length) return;
        e.preventDefault();
        setDragging(false);
        pickFiles(e.dataTransfer.files);
      }}
    >
      <header className="flex flex-col gap-5 border-b border-slate-200 pb-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Общ облак на {kgName}</h1>
          <p className="mt-1.5 leading-relaxed text-slate-600">
            Учителите и директорът качват тук файлове и всеки от екипа може да ги отвори и свали. Файл „Само за мен“ виждате
            само вие.
          </p>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          {usage && <UsageMeter usage={usage} />}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#4d7a0a] px-5 py-3 font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-[#3d6108] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4d7a0a] focus-visible:ring-offset-2"
          >
            <CloudUpload className="h-5 w-5" aria-hidden /> Качи файлове
          </button>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={CLOUD_ACCEPT}
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(e) => {
              pickFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      </header>

      {pending.length > 0 && usage && (
        <UploadPanel
          files={pending}
          usage={usage}
          defaultFolder={folder ?? "other"}
          defaultAgeGroup={user.ageGroup}
          onRemove={(i) => setPending((prev) => prev.filter((_, j) => j !== i))}
          onCancel={() => setPending([])}
          onDone={(count, close) => {
            if (close) setPending([]);
            if (count > 0) {
              toast(count === 1 ? "Файлът е качен в облака." : `Качени са ${count} файла.`, "success");
              void load();
            }
          }}
        />
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[230px_1fr]">
        <nav aria-label="Папки" className="min-w-0 xl:sticky xl:top-20 xl:self-start">
          <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 xl:mx-0 xl:flex-col xl:gap-0.5 xl:overflow-visible xl:px-0">
            {[{ id: null as CloudFolderId | null, label: "Всички папки", count: total }, ...CLOUD_FOLDERS.map((f) => ({ id: f.id as CloudFolderId | null, label: f.label, count: counts[f.id] ?? 0 }))].map(
              (f) => {
                const active = folder === f.id;
                return (
                  <li key={f.id ?? "all"} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => setFolder(f.id)}
                      aria-current={active ? "true" : undefined}
                      className={`flex w-full items-center justify-between gap-3 whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm transition-colors duration-150 xl:whitespace-normal ${
                        active
                          ? "bg-[#4d7a0a] font-semibold text-white"
                          : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 xl:border-transparent xl:bg-transparent"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <FolderOpen className={`h-4 w-4 shrink-0 ${active ? "text-white" : "text-slate-400"}`} aria-hidden />
                        {f.label}
                      </span>
                      <span className={`tabular-nums text-xs ${active ? "text-white/80" : "text-slate-400"}`}>{f.count}</span>
                    </button>
                  </li>
                );
              },
            )}
          </ul>
        </nav>

        <section aria-label="Файлове" className="min-w-0">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div role="tablist" aria-label="Чии файлове" className="inline-flex max-w-full shrink-0 self-start overflow-x-auto rounded-xl border border-slate-200 bg-white p-1">
              {SCOPES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={scope === s.id}
                  onClick={() => setScope(s.id)}
                  className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-sm sm:px-3 font-medium transition-colors duration-150 ${
                    scope === s.id ? "bg-[#f4f9e8] text-[#4d7a0a]" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <div className="flex min-w-0 flex-1 gap-2 lg:max-w-md">
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">Търсене във файловете</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Търсене по име, описание, колега"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-[#4d7a0a] focus:outline-none focus:ring-2 focus:ring-[#4d7a0a]/20"
                />
              </label>
              <label>
                <span className="sr-only">Възрастова група</span>
                <select
                  value={ageGroup}
                  onChange={(e) => setAgeGroup(e.target.value)}
                  className="h-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#4d7a0a] focus:outline-none"
                >
                  <option value="">Всички групи</option>
                  {Object.entries(AGE_SHORT).map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {dragging && (
            <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#4d7a0a] bg-[#f4f9e8] py-10 text-[#4d7a0a]">
              <CloudUpload className="h-6 w-6" aria-hidden /> Пуснете файловете тук
            </div>
          )}

          {error && <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>}

          {files === null ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" aria-label="Зареждане" />
            </div>
          ) : files.length === 0 ? (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="mt-4 flex w-full flex-col items-center rounded-2xl border-2 border-dashed border-slate-200 bg-white px-6 py-14 text-center transition-colors duration-150 hover:border-[#4d7a0a]/40 hover:bg-slate-50"
            >
              <CloudUpload className="h-8 w-8 text-slate-400" aria-hidden />
              <span className="mt-3 font-semibold text-slate-900">
                {debounced || ageGroup ? "Няма файлове по това търсене" : scope === "all" ? "Тук още няма файлове" : "Още нямате качени файлове"}
              </span>
              <span className="mt-1 max-w-md text-sm text-slate-500">
                Качете първия файл — план, работен лист, сценарий, снимка от изложба. Може и да ги провлачите от компютъра.
              </span>
            </button>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {files.map((f) => (
                <li key={f.id} className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:gap-4">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <FileThumb file={f} />
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 font-semibold text-slate-900">
                        <span className="truncate">{f.title}</span>
                        {!f.shared && (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-800">
                            <Lock className="h-3 w-3" aria-hidden /> Само за мен
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {KIND_ICON[f.kind].label} · {formatBytes(f.size)} · {folderLabel(f.folder)}
                        {f.ageGroup ? ` · ${AGE_SHORT[f.ageGroup]}` : ""}
                      </p>
                      {f.description && <p className="mt-1 line-clamp-2 text-sm text-slate-600">{f.description}</p>}
                      <p className="mt-1 text-xs text-slate-500">
                        <span aria-hidden>{f.uploaderAvatar}</span> {f.mine ? "Вие" : f.uploaderName}
                        {f.uploaderJobTitle && !f.mine ? `, ${f.uploaderJobTitle.toLowerCase()}` : ""} · {f.createdAt}
                        {f.downloads > 0 ? ` · свален ${f.downloads} ${f.downloads === 1 ? "път" : "пъти"}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 pl-14 sm:justify-end sm:pl-0">
                    {f.inline && (
                      <a href={cloudDownloadUrl(f.id, true)} target="_blank" rel="noopener" title="Отвори в нов раздел" aria-label={`Отвори „${f.title}“`} className={ICON_BTN}>
                        <Eye className="h-4 w-4" aria-hidden />
                      </a>
                    )}
                    {f.mine && (
                      <>
                        <button
                          type="button"
                          onClick={() => void toggleShared(f)}
                          title={f.shared ? "Направи файла само за мен" : "Сподели с всички учители"}
                          aria-label={f.shared ? `Направи „${f.title}“ само за мен` : `Сподели „${f.title}“ с всички учители`}
                          className={ICON_BTN}
                        >
                          {f.shared ? <Lock className="h-4 w-4" aria-hidden /> : <Users className="h-4 w-4" aria-hidden />}
                        </button>
                        <button type="button" onClick={() => setEditing(f)} title="Редактирай" aria-label={`Редактирай „${f.title}“`} className={ICON_BTN}>
                          <Pencil className="h-4 w-4" aria-hidden />
                        </button>
                      </>
                    )}
                    {f.canDelete && (
                      <button
                        type="button"
                        onClick={() => void remove(f)}
                        title="Изтрий"
                        aria-label={`Изтрий „${f.title}“`}
                        className={ICON_DANGER}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    )}
                    <a
                      href={cloudDownloadUrl(f.id)}
                      download={f.fileName}
                      className="ml-1 inline-flex items-center gap-1.5 rounded-lg bg-[#4d7a0a] px-3 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#3d6108]"
                    >
                      <Download className="h-4 w-4" aria-hidden /> Свали
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {user.kgRole === "ADMIN" && files && files.length > 0 && (
            <p className="mt-3 text-xs text-slate-500">Като администратор можете да изтривате и файловете, споделени от колегите.</p>
          )}
        </section>
      </div>

      {editing && (
        <EditFileDialog
          file={editing}
          onClose={() => setEditing(null)}
          onSaved={(next) => {
            setEditing(null);
            setFiles((prev) => prev?.map((f) => (f.id === next.id ? next : f)) ?? null);
            void load();
          }}
        />
      )}
    </main>
  );
}
