"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Bookmark, Check, Loader2, Share2 } from "lucide-react";
import { useMe } from "@/lib/client/useMe";
import { saveMaterial, type NewMaterial } from "@/lib/client/materials";
import type { SavedMaterial } from "@/types";

type Props = {
  /** Материалът без полето shared — бутонът решава. */
  material: Omit<NewMaterial, "shared">;
  className?: string;
  compact?: boolean;
  /** След успешно запазване (напр. за опресняване на списък). */
  onSaved?: (m: SavedMaterial) => void;
};

/**
 * „Запази в моята библиотека“ и „Запази и сподели с колегите“ — под всеки генериран или създаден материал.
 * Гост → пренасочване към вход. Без детска градина → само запазване.
 */
export function SaveMaterialBar({ material, className = "", compact = false, onSaved }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useMe();
  const [busy, setBusy] = useState<"save" | "share" | null>(null);
  const [saved, setSaved] = useState<"saved" | "shared" | null>(null);

  const run = async (shared: boolean) => {
    if (!user) {
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname || "/library")}`);
      return;
    }
    setBusy(shared ? "share" : "save");
    const result = await saveMaterial({ ...material, shared });
    setBusy(null);
    if (result && "authRequired" in result) {
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname || "/library")}`);
      return;
    }
    if (result) {
      setSaved(shared ? "shared" : "saved");
      onSaved?.(result.material);
    }
  };

  if (saved) {
    return (
      <div className={`flex flex-wrap items-center gap-2 text-sm font-bold text-emerald-800 ${className}`} role="status">
        <Check className="h-4 w-4" />
        <span>{saved === "shared" ? "Запазено и споделено с колегите" : "Запазено в библиотеката"}</span>
        <Link href="/library" className="text-indigo-700 underline-offset-2 hover:underline">
          Отвори библиотеката
        </Link>
      </div>
    );
  }

  const canShare = !user || Boolean(user.kindergarten);
  const size = compact ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm";
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={() => run(false)}
        disabled={busy !== null}
        className={`inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-white font-bold text-indigo-800 transition-colors hover:bg-indigo-50 disabled:opacity-60 ${size}`}
      >
        {busy === "save" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bookmark className="h-4 w-4" />}
        Запази в моята библиотека
      </button>
      {canShare && (
        <button
          type="button"
          onClick={() => run(true)}
          disabled={busy !== null}
          className={`inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 font-bold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60 ${size}`}
        >
          {busy === "share" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
          Запази и сподели с колегите
        </button>
      )}
    </div>
  );
}
