"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, CloudUpload, Loader2, Lock, Users } from "lucide-react";
import { toast } from "@/components/Toaster";
import type { WordSource } from "@/components/WordButton";

type Source = ({ source: "material" } & WordSource) | { source: "plan"; planId: string };

/**
 * „В облака“: записва материала като Word файл в общия облак — за колегите или само за мен.
 * Изборът се показва като малко меню под бутона.
 */
export function CloudSaveButton({
  source,
  className,
  label = "В облака",
  wrapperClassName = "relative inline-flex",
}: {
  source: Source;
  className: string;
  label?: string;
  wrapperClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const save = async (shared: boolean) => {
    setBusy(true);
    try {
      const res = await fetch("/api/cloud/from-material", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(source.source === "material" ? { ...source, direction: source.direction ?? null, shared } : { ...source, shared }),
      });
      const data = (await res.json().catch(() => ({}))) as { folderLabel?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Не успях да запиша в облака.");
      setSaved(data.folderLabel ?? "облака");
      setOpen(false);
      toast(`Записано в облака, папка „${data.folderLabel}“${shared ? " — колегите го виждат" : " — само за вас"}.`, "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Няма връзка със сървъра.", "error");
    } finally {
      setBusy(false);
    }
  };

  if (saved) {
    return (
      <Link href="/cloud" className={className} title={`В облака, папка „${saved}“`}>
        <Check className="h-3.5 w-3.5" aria-hidden /> В облака ✓
      </Link>
    );
  }

  return (
    <div ref={box} className={wrapperClassName}>
      <button type="button" onClick={() => setOpen((v) => !v)} disabled={busy} aria-expanded={open} aria-haspopup="menu" className={className} title="Запиши като Word файл в общия облак">
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <CloudUpload className="h-3.5 w-3.5" aria-hidden />} {label}
      </button>
      {open && (
        <div role="menu" className="absolute bottom-full left-0 z-30 mb-2 w-60 rounded-xl border border-slate-200 bg-white p-1.5 text-left shadow-lg">
          <button
            type="button"
            role="menuitem"
            onClick={() => save(true)}
            className="flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50"
          >
            <Users className="mt-0.5 h-4 w-4 shrink-0 text-[#0a4b82]" aria-hidden />
            <span>
              <span className="block font-semibold text-slate-800">Сподели с колегите</span>
              <span className="block text-xs text-slate-500">Вижда се в общия облак</span>
            </span>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => save(false)}
            className="flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50"
          >
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" aria-hidden />
            <span>
              <span className="block font-semibold text-slate-800">Само за мен</span>
              <span className="block text-xs text-slate-500">В „Моите файлове“</span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
