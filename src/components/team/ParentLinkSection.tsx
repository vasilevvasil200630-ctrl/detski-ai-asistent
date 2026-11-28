"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy, ExternalLink, Globe, QrCode as QrIcon } from "lucide-react";
import { toast } from "@/components/Toaster";
import { KG } from "@/config/kindergarten";
import { QrCode, useAbsoluteUrl } from "@/components/showcase/QrCode";

/**
 * „Връзка за официалния сайт“: адресът на страницата за родителите, готов код за бутон на сайта на
 * градината и QR плакат за входа. Адресът следва домейна, на който е отворен сайтът.
 */
export function ParentLinkSection() {
  const url = useAbsoluteUrl("/");
  const [copied, setCopied] = useState<"url" | "html" | null>(null);
  const html = `<a href="${url}" target="_blank" rel="noopener" style="display:inline-block;padding:12px 20px;border-radius:12px;background:#4d7a0a;color:#fff;font-weight:600;text-decoration:none">${KG.name} — за родителите: групите, дейностите и обявите</a>`;

  async function copy(text: string, what: "url" | "html") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      toast(what === "url" ? "Адресът е копиран." : "Кодът е копиран — поставете го в сайта на градината.", "success");
    } catch {
      toast("Не успях да копирам — маркирайте текста и го копирайте ръчно.", "error");
    }
  }

  const btn = "inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50";
  return (
    <section aria-labelledby="link-title" className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">
          <h2 id="link-title" className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Globe className="h-5 w-5 text-slate-500" aria-hidden /> Връзка за официалния сайт
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">
            Сложете тази връзка на сайта на градината (напр. „За родителите“). Тя води към страницата за родителите — групите, дейностите,
            обявите и празниците, само одобреното от вас.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <label className="sr-only" htmlFor="parent-url">Адрес</label>
            <input id="parent-url" readOnly value={url} onFocus={(e) => e.currentTarget.select()} className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-sm text-slate-700" />
            <button type="button" onClick={() => void copy(url, "url")} className={btn}>
              {copied === "url" ? <Check className="h-4 w-4 text-emerald-600" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />} Копирай адреса
            </button>
          </div>
          <details className="mt-3">
            <summary className="cursor-pointer text-sm font-semibold text-[#4d7a0a]">Код за бутон на сайта (за човека, който поддържа сайта)</summary>
            <textarea readOnly value={html} rows={4} onFocus={(e) => e.currentTarget.select()} className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 p-2 font-mono text-xs text-slate-700" />
            <button type="button" onClick={() => void copy(html, "html")} className={`${btn} mt-2`}>
              {copied === "html" ? <Check className="h-4 w-4 text-emerald-600" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />} Копирай кода
            </button>
          </details>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/showcase/qr" className={btn}>
              <QrIcon className="h-4 w-4" aria-hidden /> QR плакат за входа
            </Link>
            <Link href="/" target="_blank" className={btn}>
              <ExternalLink className="h-4 w-4" aria-hidden /> Вижте страницата като родител
            </Link>
          </div>
          <p className="mt-3 text-xs text-slate-500">Ако по-късно смените адреса на сайта (нов домейн), тук ще се покаже новият.</p>
        </div>
        <QrCode url={url} size={132} className="shrink-0 self-center rounded-lg border border-slate-200 p-1" />
      </div>
    </section>
  );
}
