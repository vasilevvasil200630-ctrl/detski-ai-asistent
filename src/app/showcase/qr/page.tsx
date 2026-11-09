"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { useMe } from "@/lib/client/useMe";
import { KG } from "@/config/kindergarten";
import { QrCode, useAbsoluteUrl } from "@/components/showcase/QrCode";

type Target = "showcase" | "teacher" | "month";

/** Плакат A4 с QR код за таблото пред групата: към витрината, към моята страница или към бюлетина за месеца. */
export default function QrPosterPage() {
  const { user } = useMe();
  const [target, setTarget] = useState<Target>("showcase");
  const ym = new Date().toISOString().slice(0, 7);
  const monthName = new Date().toLocaleDateString("bg-BG", { month: "long" });
  const path = target === "teacher" && user ? `/vitrina/uchitel/${user.id}` : target === "month" ? `/vitrina/mesec/${ym}` : "/vitrina";
  const url = useAbsoluteUrl(path);

  const options: { id: Target; label: string; hint: string }[] = [
    { id: "showcase", label: "Витрината на градината", hint: "Всички учители и дейности" },
    { id: "teacher", label: "Моята страница", hint: "Само вашите дейности (вижда се, след като имате одобрени)" },
    { id: "month", label: `Бюлетинът за ${monthName}`, hint: "Какво правихме този месец" },
  ];
  const heading =
    target === "teacher" && user
      ? `Какво правим в ${user.groupName || "нашата група"}`
      : target === "month"
        ? `Какво правихме през ${monthName}`
        : `Какво правим в „Пролет“`;

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="no-print space-y-4">
        <Link href="/showcase" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Витрина за родители
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">QR код за таблото</h1>
        <p className="text-sm text-slate-600">Отпечатайте плаката и го сложете пред групата — родителите насочват камерата на телефона и отварят витрината.</p>
        <fieldset className="grid gap-2 sm:grid-cols-3">
          <legend className="sr-only">Към коя страница води кодът</legend>
          {options.map((o) => (
            <label
              key={o.id}
              className={`flex cursor-pointer items-start gap-2 rounded-xl border p-3 text-sm ${target === o.id ? "border-[#0a4b82] bg-sky-50" : "border-slate-200 hover:bg-slate-50"}`}
            >
              <input type="radio" name="qr-target" checked={target === o.id} onChange={() => setTarget(o.id)} className="mt-0.5 accent-[#0a4b82]" />
              <span>
                <span className="block font-semibold text-slate-800">{o.label}</span>
                <span className="block text-xs text-slate-500">{o.hint}</span>
              </span>
            </label>
          ))}
        </fieldset>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0a4b82] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#083861]"
        >
          <Printer className="h-4 w-4" aria-hidden /> Отпечатай плаката
        </button>
      </div>

      <article className="print-sheet mx-auto mt-6 flex w-full max-w-[210mm] flex-col items-center bg-white px-6 py-12 text-center text-slate-900 shadow-sm ring-1 ring-slate-200 print:mt-0 print:min-h-[230mm] print:justify-center">
        <p className="text-lg font-semibold text-[#0a4b82]">
          {KG.fullName}, {KG.village}
        </p>
        <h2 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">{heading}</h2>
        <p className="mt-3 max-w-md text-lg text-slate-700">Насочете камерата на телефона към кода — ще видите игрите и дейностите с децата.</p>
        <QrCode url={url} size={320} className="mt-8" />
        <p className="mt-6 break-all text-base font-semibold text-slate-800">{url.replace(/^https?:\/\//, "")}</p>
      </article>
    </main>
  );
}
