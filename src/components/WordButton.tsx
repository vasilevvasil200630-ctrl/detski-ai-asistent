"use client";

import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { toast } from "@/components/Toaster";
import type { AgeGroup, LessonDirection, MaterialKind } from "@/types";

export interface WordSource {
  kind: MaterialKind;
  title: string;
  ageGroup: AgeGroup;
  direction?: LessonDirection | null;
  content: unknown;
}

/** Сваля Word (.docx) файл от игра, план-конспект или материал — за редакция и предаване. */
export async function downloadWord(src: WordSource): Promise<boolean> {
  try {
    const res = await fetch("/api/export/docx", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...src, direction: src.direction ?? null }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      toast(data.error ?? "Word файлът не можа да се създаде.", "error");
      return false;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${src.title.replace(/[\\/:*?"<>|]+/g, " ").trim().slice(0, 80) || "material"}.docx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return true;
  } catch {
    toast("Няма връзка със сървъра.", "error");
    return false;
  }
}

/** Бутон „Word“ — същият вид като съседните бутони (подава се className). */
export function WordButton({ source, className, label = "Word" }: { source: WordSource; className: string; label?: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await downloadWord(source);
        setBusy(false);
      }}
      className={className}
      title="Свали като Word документ за редакция"
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <FileDown className="h-3.5 w-3.5" aria-hidden />} {label}
    </button>
  );
}
