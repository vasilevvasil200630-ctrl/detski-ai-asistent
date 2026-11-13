"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Camera, Check, ImageIcon, Loader2, Store, X } from "lucide-react";
import { VoiceMic } from "@/components/VoiceMic";
import { cloudDownloadUrl, listCloudFiles } from "@/lib/client/cloud";
import type { CloudFileItem } from "@/lib/cloud/folders";
import { STORY_MAX, STORY_MIN, type ShowcaseItemView } from "@/lib/showcase-shared";
import { toast } from "@/components/Toaster";
import { uploadActivityPhoto } from "@/lib/client/photos";
import { AGE_SHORT } from "@/services/materialText";
import type { AgeGroup, LessonDirection } from "@/types";

const DIRECTIONS: { id: LessonDirection; label: string }[] = [
  { id: "bel", label: "БЕЛ" },
  { id: "math", label: "Математика" },
  { id: "world", label: "Околен свят" },
  { id: "art", label: "Изобразително изкуство" },
  { id: "music", label: "Музика" },
  { id: "construct", label: "Конструиране" },
  { id: "pe", label: "Физическа култура" },
  { id: "bdp", label: "БДП" },
];

const MAX_IMAGES = 4;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

/**
 * Предложение за публичната витрина: заглавие, разказ какво направихме с децата, снимки без деца
 * от моя облак и дали родителите могат да отпечатат. Директорът одобрява, преди да се покаже.
 * С `item` — промяна на вече предложена дейност (връща се за ново одобрение).
 */
export function ProposeShowcaseDialog({
  materialId,
  defaultTitle,
  item,
  activityAgeGroup,
  onClose,
  onDone,
}: {
  materialId?: string;
  defaultTitle?: string;
  item?: ShowcaseItemView;
  /** „Днес в групата“: нова дейност от деня без материал (групата по подразбиране е на учителя) */
  activityAgeGroup?: AgeGroup;
  onClose: () => void;
  onDone: (item: ShowcaseItemView) => void;
}) {
  const titleId = useId();
  const [title, setTitle] = useState(item?.title ?? defaultTitle ?? "");
  const [story, setStory] = useState(item?.story ?? "");
  const [imageIds, setImageIds] = useState<string[]>(item?.images.map((i) => i.id) ?? []);
  const [noChildren, setNoChildren] = useState(Boolean(item?.images.length));
  const [allowPrint, setAllowPrint] = useState(item?.allowPrint ?? true);
  const isActivity = Boolean(activityAgeGroup) || Boolean(item?.activity);
  const isNewActivity = Boolean(activityAgeGroup) && !item;
  const [ageGroup, setAgeGroup] = useState<AgeGroup>(activityAgeGroup ?? "2");
  const [direction, setDirection] = useState<LessonDirection | null>(null);
  const [uploading, setUploading] = useState<number | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<CloudFileItem[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listCloudFiles({ scope: "mine" })
      .then((r) => setImages(r.files.filter((f) => IMAGE_TYPES.includes(f.mimeType))))
      .catch(() => setImages([]));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  /** Снимки направо от телефона: намаляват се, качват се в моя облак и се отбелязват за дейността. */
  const addPhotos = async (files: FileList | null) => {
    const list = [...(files ?? [])].slice(0, Math.max(0, MAX_IMAGES - imageIds.length));
    if (!list.length) return;
    setError(null);
    for (const file of list) {
      setUploading(0);
      try {
        const uploaded = await uploadActivityPhoto(file, title || "Снимка от дейност", setUploading);
        setImages((prev) => [uploaded, ...(prev ?? [])]);
        setImageIds((prev) => (prev.length >= MAX_IMAGES ? prev : [...prev, uploaded.id]));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Снимката не беше качена.");
        break;
      }
    }
    setUploading(null);
    if (fileInput.current) fileInput.current.value = "";
  };

  const toggleImage = (id: string) =>
    setImageIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= MAX_IMAGES ? prev : [...prev, id]));

  const storyLen = story.trim().length;
  const problem =
    title.trim().length < 3
      ? "Напишете заглавие."
      : storyLen < STORY_MIN
        ? `Разкажете с поне ${STORY_MIN} знака какво направихте с децата.`
        : imageIds.length > 0 && !noChildren
          ? "Потвърдете, че на снимките няма деца."
          : uploading !== null
            ? "Изчакайте снимката да се качи."
            : null;

  const submit = async () => {
    if (problem || busy) return;
    setBusy(true);
    setError(null);
    try {
      const url = item ? `/api/showcase/${item.id}` : isNewActivity ? "/api/showcase/activity" : "/api/showcase";
      const res = await fetch(url, {
        method: item ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(item || isNewActivity ? {} : { materialId }),
          ...(isNewActivity ? { ageGroup, direction } : {}),
          title,
          story,
          imageIds,
          noChildren,
          allowPrint: isActivity ? false : allowPrint,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { item?: ShowcaseItemView; error?: string };
      if (!res.ok || !data.item) throw new Error(data.error ?? "Предложението не беше изпратено.");
      toast(item ? "Промените са изпратени за ново одобрение." : "Изпратено на директора за одобрение.", "success");
      onDone(data.item);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Няма връзка със сървъра.");
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="flex max-h-[92vh] w-full max-w-2xl flex-col rounded-t-2xl bg-white shadow-xl sm:rounded-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 id={titleId} className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <Store className="h-5 w-5 text-[#4d7a0a]" aria-hidden /> {item ? "Промени дейността" : isNewActivity ? "Днес в групата" : "Предложи за витрината"}
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">Родителите ще я видят, след като директорът я одобри.</p>
          </div>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Затвори" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4">
          {isNewActivity && (
            <div className="space-y-3">
              <fieldset>
                <legend className="mb-1.5 text-sm font-semibold text-slate-800">Група</legend>
                <div className="flex flex-wrap gap-2">
                  {(["1", "2", "3", "4"] as AgeGroup[]).map((g) => (
                    <button key={g} type="button" aria-pressed={ageGroup === g} onClick={() => setAgeGroup(g)} className={chip(ageGroup === g)}>
                      {AGE_SHORT[g]}
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="mb-1.5 text-sm font-semibold text-slate-800">
                  Направление <span className="font-normal text-slate-500">(по желание)</span>
                </legend>
                <div className="flex flex-wrap gap-2">
                  {DIRECTIONS.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      aria-pressed={direction === d.id}
                      onClick={() => setDirection((cur) => (cur === d.id ? null : d.id))}
                      className={chip(direction === d.id)}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>
          )}

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-800">Заглавие</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={140} className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm" />
          </label>

          <div>
            <label htmlFor={`${titleId}-story`} className="mb-1.5 block text-sm font-semibold text-slate-800">
              Какво направихме с децата
            </label>
            <div className="flex items-start gap-2">
              <textarea
                id={`${titleId}-story`}
                value={story}
                onChange={(e) => setStory(e.target.value)}
                maxLength={STORY_MAX}
                rows={5}
                placeholder="Напр. „Играхме в двора с есенни листа: децата броиха листата, подреждаха ги по големина и накрая направиха обща картина…“"
                className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm leading-relaxed"
              />
              <VoiceMic onTranscript={(t) => setStory((s) => (s ? `${s} ${t}` : t))} />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Без имена на деца. {storyLen}/{STORY_MAX}
            </p>
          </div>

          <fieldset>
            <legend className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-800">
              <ImageIcon className="h-4 w-4 text-[#4d7a0a]" aria-hidden /> Снимки без деца <span className="font-normal text-slate-500">(по желание, до {MAX_IMAGES})</span>
            </legend>
            <p className="mb-2 text-xs text-slate-500">
              Рисунки, изработени предмети, украсата на групата. Снимайте сега или изберете от снимките, които сте качили в облака.
            </p>
            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/*"
              capture="environment"
              multiple
              className="sr-only"
              onChange={(e) => void addPhotos(e.target.files)}
              aria-label="Снимай или качи снимка"
            />
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={uploading !== null || imageIds.length >= MAX_IMAGES}
              className="mb-3 inline-flex items-center gap-2 rounded-xl border border-[#4d7a0a] bg-white px-4 py-2.5 text-sm font-semibold text-[#4d7a0a] hover:bg-sky-50 disabled:opacity-50"
            >
              {uploading !== null ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Camera className="h-4 w-4" aria-hidden />}
              {uploading !== null ? `Качване… ${uploading}%` : "Снимай или качи снимка"}
            </button>
            {images === null ? (
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" aria-label="Зареждане" />
            ) : images.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600">Още нямате снимки в облака — снимайте с бутона по-горе.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {images.map((f) => {
                  const on = imageIds.includes(f.id);
                  const disabled = !on && imageIds.length >= MAX_IMAGES;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      aria-pressed={on}
                      disabled={disabled}
                      onClick={() => toggleImage(f.id)}
                      className={`relative aspect-square overflow-hidden rounded-xl border-2 disabled:opacity-40 ${on ? "border-[#4d7a0a]" : "border-transparent"}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={cloudDownloadUrl(f.id, true)} alt={f.title} className="h-full w-full object-cover" loading="lazy" />
                      {on && (
                        <span className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-[#4d7a0a] text-white">
                          <Check className="h-4 w-4" aria-hidden />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            {imageIds.length > 0 && (
              <label className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
                <input type="checkbox" checked={noChildren} onChange={(e) => setNoChildren(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#4d7a0a]" />
                На избраните снимки няма деца, нито техни имена или лица.
              </label>
            )}
          </fieldset>

          {!isActivity && (
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={allowPrint} onChange={(e) => setAllowPrint(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#4d7a0a]" />
            Родителите могат да отпечатат играта и листовете за игра вкъщи (по желание на семейството)
          </label>
          )}

          {error && (
            <p role="alert" className="text-sm text-rose-700">
              {error}
            </p>
          )}
        </div>

        <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 px-5 py-3">
          {problem && <p className="mr-auto text-sm font-semibold text-amber-700">{problem}</p>}
          <button type="button" onClick={onClose} disabled={busy} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Отказ
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={busy || Boolean(problem)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#4d7a0a] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#3d6108] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Изпрати на директора
          </button>
        </footer>
      </div>
    </div>
  );
}

const chip = (on: boolean) =>
  `rounded-xl border px-3 py-1.5 text-sm font-semibold transition-colors ${on ? "border-[#4d7a0a] bg-[#4d7a0a] text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`;
