"use client";

import { Eye, LogOut } from "lucide-react";
import { stopParentPreview } from "@/lib/parent-preview";

/** Лентата над сайта, докато учителят го гледа като родител. */
export function ParentPreviewBanner() {
  return (
    <div role="status" className="sticky top-0 z-50 border-b border-[#d9ab00] bg-kg-yellow px-4 py-2 print:hidden">
      <p className="mx-auto flex max-w-[73.125rem] flex-wrap items-center justify-between gap-x-4 gap-y-1.5 text-sm text-kg-yellow-ink">
        <span className="flex items-center gap-2">
          <Eye className="h-4 w-4 shrink-0 text-[#4d7a0a]" aria-hidden />
          <span>
            <strong className="font-semibold">Преглед като родител.</strong> Така виждат сайта родителите и гостите — само одобреното
            от директора.
          </span>
        </span>
        <button
          type="button"
          onClick={stopParentPreview}
          className="kg-leaf inline-flex items-center gap-1.5 bg-[#c43d00] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#4d7a0a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kg-yellow-ink focus-visible:ring-offset-2"
        >
          <LogOut className="h-3.5 w-3.5" aria-hidden /> Обратно към облака
        </button>
      </p>
    </div>
  );
}
