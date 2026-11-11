"use client";

import { Eye, LogOut } from "lucide-react";
import { stopParentPreview } from "@/lib/parent-preview";

/** Лентата над сайта, докато учителят го гледа като родител. */
export function ParentPreviewBanner() {
  return (
    <div role="status" className="sticky top-0 z-50 border-b border-sky-200 bg-sky-50 px-4 py-2 print:hidden">
      <p className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-1.5 text-sm text-sky-950">
        <span className="flex items-center gap-2">
          <Eye className="h-4 w-4 shrink-0" aria-hidden />
          <span>
            <strong className="font-semibold">Преглед като родител.</strong> Така виждат сайта родителите и гостите — само одобреното
            от директора.
          </span>
        </span>
        <button
          type="button"
          onClick={stopParentPreview}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#0a4b82] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#083861] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a4b82] focus-visible:ring-offset-2"
        >
          <LogOut className="h-3.5 w-3.5" aria-hidden /> Обратно към облака
        </button>
      </p>
    </div>
  );
}
