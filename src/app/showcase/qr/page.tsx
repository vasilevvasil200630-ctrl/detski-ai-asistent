"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";
import { useMe } from "@/lib/client/useMe";
import { KG } from "@/config/kindergarten";
import { QrCode, useAbsoluteUrl } from "@/components/showcase/QrCode";
import { PrintOptions } from "@/components/print/PrintOptions";

type Target = "parents" | "group" | "showcase" | "teacher" | "month";
type Group = { slug: string; label: string };

/** Адресът на групата е само латиница, цифри и тирета (от slugify). */
const SAFE_SLUG = /^[a-z0-9-]{1,48}$/;

/**
 * Плакат A4 с QR код: към страницата за родителите (по подразбиране — за входа и за официалния сайт),
 * към страницата на група, към витрината, към моята страница или към бюлетина за месеца.
 */
function QrPoster() {
  const { user } = useMe();
  const params = useSearchParams();
  const [group, setGroup] = useState<Group | null>(null);
  const [target, setTarget] = useState<Target>("parents");

  // Група: от връзката в „Групи“ (директорът) или групата на учителя
  useEffect(() => {
    const slug = params.get("grupa");
    if (slug && SAFE_SLUG.test(slug)) {
      setGroup({ slug, label: (params.get("ime") ?? "").slice(0, 80) || "Нашата група" });
      setTarget("group");
      return;
    }
    fetch("/api/parent-posts", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { group?: Group | null } | null) => d?.group && setGroup(d.group))
      .catch(() => undefined);
  }, [params]);

  const ym = new Date().toISOString().slice(0, 7);
  const monthName = new Date().toLocaleDateString("bg-BG", { month: "long" });
  const path =
    target === "group" && group
      ? `/grupi/${group.slug}`
      : target === "teacher" && user
        ? `/vitrina/uchitel/${user.id}`
        : target === "month"
          ? `/vitrina/mesec/${ym}`
          : target === "showcase"
            ? "/vitrina"
            : "/";
  const url = useAbsoluteUrl(path);

  const options: { id: Target; label: string; hint: string }[] = [
    { id: "parents", label: "Страницата за родителите", hint: "Групите, дейностите, обявите и празниците — за входа и официалния сайт" },
    ...(group ? [{ id: "group" as const, label: group.label, hint: "Темата на седмицата, обявите и стихчетата на групата" }] : []),
    { id: "showcase", label: "Витрината на градината", hint: "Всички учители и дейности" },
    { id: "teacher", label: "Моята страница", hint: "Само вашите дейности (вижда се, след като имате одобрени)" },
    { id: "month", label: `Бюлетинът за ${monthName}`, hint: "Какво правихме този месец" },
  ];
  const heading =
    target === "group" && group
      ? group.label
      : target === "teacher" && user
        ? `Какво правим в ${user.groupName || "нашата група"}`
        : target === "month"
          ? `Какво правихме през ${monthName}`
          : target === "showcase"
            ? "Какво правим в „Пролет“"
            : "За родителите";
  const subline =
    target === "group"
      ? "Насочете камерата на телефона към кода — темата на седмицата, обявите, поканите и стихчетата на групата."
      : target === "parents"
        ? "Насочете камерата на телефона към кода — групите, дейностите с децата, обявите и празниците."
        : "Насочете камерата на телефона към кода — ще видите игрите и дейностите с децата.";

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8 print:p-0">
      <div className="no-print space-y-4">
        <Link href="/za-roditelite" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" aria-hidden /> За родителите
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">QR код за таблото</h1>
        <p className="text-sm text-slate-600">
          Отпечатайте плаката и го сложете на входа или пред групата — родителите насочват камерата на телефона и отварят страницата.
        </p>
        <fieldset className="grid gap-2 sm:grid-cols-3">
          <legend className="sr-only">Към коя страница води кодът</legend>
          {options.map((o) => (
            <label
              key={o.id}
              className={`flex cursor-pointer items-start gap-2 rounded-xl border p-3 text-sm ${target === o.id ? "border-[#4d7a0a] bg-sky-50" : "border-slate-200 hover:bg-slate-50"}`}
            >
              <input type="radio" name="qr-target" checked={target === o.id} onChange={() => setTarget(o.id)} className="mt-0.5 accent-[#4d7a0a]" />
              <span>
                <span className="block font-semibold text-slate-800">{o.label}</span>
                <span className="block text-xs text-slate-500">{o.hint}</span>
              </span>
            </label>
          ))}
        </fieldset>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl bg-[#4d7a0a] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#3d6108]"
          >
            <Printer className="h-4 w-4" aria-hidden /> Отпечатай плаката
          </button>
          <PrintOptions />
        </div>
      </div>

      <article className="print-sheet mx-auto mt-6 flex w-full max-w-[210mm] flex-col items-center bg-white px-6 py-12 text-center text-slate-900 shadow-sm ring-1 ring-slate-200 print:mt-0 print:min-h-[230mm] print:justify-center">
        <p className="text-lg font-semibold text-[#4d7a0a]">
          {KG.fullName}, {KG.village}
        </p>
        <h2 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">{heading}</h2>
        <p className="mt-3 max-w-md text-lg text-slate-700">{subline}</p>
        <QrCode url={url} size={320} className="mt-8" />
        <p className="mt-6 break-all text-base font-semibold text-slate-800">{url.replace(/^https?:\/\//, "").replace(/\/$/, "")}</p>
      </article>
    </main>
  );
}

export default function QrPosterPage() {
  return (
    <Suspense>
      <QrPoster />
    </Suspense>
  );
}
