"use client";

import { Printer } from "lucide-react";
import { QrCode, useAbsoluteUrl } from "./QrCode";
import { PrintOptions } from "@/components/print/PrintOptions";

/** Бутон за печат на бюлетина (само на екрана). */
export function PrintButton({ label = "Отпечатай за таблото" }: { label?: string }) {
  return (
    <div className="no-print flex flex-wrap items-center gap-x-4 gap-y-2">
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center gap-2 rounded-xl bg-[#0a4b82] px-4 py-2 text-sm font-semibold text-white hover:bg-[#083861]"
      >
        <Printer className="h-4 w-4" aria-hidden /> {label}
      </button>
      <PrintOptions />
    </div>
  );
}

/** Долната част на бюлетина: QR код към витрината, за да видят родителите всичко с телефона. */
export function BulletinQr() {
  const url = useAbsoluteUrl("/vitrina");
  return (
    <div className="mt-8 flex items-center gap-4 border-t-2 border-slate-900 pt-4">
      <QrCode url={url} size={96} className="shrink-0" />
      <p className="text-sm leading-relaxed text-slate-700">
        Още игри и дейности с децата — на витрината на градината. Насочете камерата на телефона към кода или отворете{" "}
        <strong className="break-all">{url.replace(/^https?:\/\//, "")}</strong>
      </p>
    </div>
  );
}
