"use client";

import { useEffect, useState } from "react";
import { BellRing, CalendarPlus, Check, ChevronDown, Copy, Loader2, RefreshCw, Smartphone } from "lucide-react";
import { toast } from "@/components/Toaster";

type Perm = "default" | "granted" | "denied" | "unsupported";

/**
 * „Напомняния на телефона и компютъра“: таен адрес за абонамент в календара (телефонът звъни сам,
 * без писма) и известия от браузъра, докато сайтът е отворен.
 */
export function ReminderSettings() {
  const [url, setUrl] = useState<string | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [perm, setPerm] = useState<Perm>("unsupported");

  useEffect(() => {
    setPerm(typeof Notification === "undefined" ? "unsupported" : Notification.permission);
    fetch("/api/notes/calendar", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { url: null }))
      .then((d: { url: string | null }) => setUrl(d.url))
      .catch(() => setUrl(null));
  }, []);

  async function call(method: "POST" | "DELETE") {
    if (method === "POST" && url && !window.confirm("Да направя ли нов адрес? Старият спира да работи и трябва да добавите новия в календара отново.")) return;
    if (method === "DELETE" && !window.confirm("Да изключа ли календара? Задачите изчезват от календара на телефона при следващото му опресняване.")) return;
    setBusy(true);
    try {
      const res = await fetch("/api/notes/calendar", { method });
      const d = (await res.json().catch(() => ({}))) as { url?: string | null; error?: string };
      if (!res.ok) throw new Error(d.error ?? "Не успях.");
      setUrl(d.url ?? null);
      setCopied(false);
      toast(method === "DELETE" ? "Календарът е изключен." : "Адресът за календара е готов.", "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Няма връзка със сървъра.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast("Адресът е копиран.", "success");
    } catch {
      toast("Не успях да копирам — маркирайте адреса и го копирайте ръчно.", "error");
    }
  }

  async function askNotifications() {
    if (typeof Notification === "undefined") return;
    const p = await Notification.requestPermission();
    setPerm(p);
    if (p === "granted") toast("Готово — браузърът ще ви напомня, когато сайтът е отворен.", "success");
  }

  const btn = "inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60";

  return (
    <details className="group mt-6 max-w-2xl rounded-2xl border border-slate-200 bg-white">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-semibold text-slate-800 [&::-webkit-details-marker]:hidden">
        <BellRing className="h-4 w-4 text-amber-600" aria-hidden />
        Напомняния на телефона и компютъра
        {url && <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-800">календарът е включен</span>}
        <ChevronDown className="ml-auto h-4 w-4 text-slate-400 transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="space-y-5 border-t border-slate-100 px-4 py-4 text-sm text-slate-700">
        <p>
          Задачите със срок напомнят в сайта (прозорец „Напомняния“ и червено число до „Моят бележник“) в деня, който сте избрали.
          За да звъни и телефонът, добавете бележника в календара му.
        </p>

        <section aria-labelledby="cal-sync">
          <h3 id="cal-sync" className="flex items-center gap-1.5 font-semibold text-slate-900">
            <Smartphone className="h-4 w-4" aria-hidden /> Календарът на телефона
          </h3>
          {url === undefined ? (
            <Loader2 className="mt-2 h-4 w-4 animate-spin text-slate-400" aria-label="Зареждане" />
          ) : url === null ? (
            <div className="mt-2 space-y-2">
              <p>Календарът (Google, iPhone, Samsung) показва задачите ви и звъни с напомнянето. Обновява се сам, щом добавите или отметнете задача.</p>
              <button type="button" onClick={() => void call("POST")} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg bg-[#4d7a0a] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#3d6108] disabled:opacity-60">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <CalendarPlus className="h-4 w-4" aria-hidden />} Включи календара
              </button>
            </div>
          ) : (
            <div className="mt-2 space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="sr-only" htmlFor="cal-url">Адрес за календара</label>
                <input id="cal-url" readOnly value={url} onFocus={(e) => e.currentTarget.select()} className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-xs text-slate-700" />
                <button type="button" onClick={() => void copy()} className={btn}>
                  {copied ? <Check className="h-4 w-4 text-emerald-600" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />} Копирай
                </button>
              </div>
              <a href={url.replace(/^https?:/, "webcal:")} className="inline-flex items-center gap-1.5 rounded-lg border border-[#4d7a0a] bg-white px-3 py-1.5 text-sm font-semibold text-[#4d7a0a] hover:bg-[#f4f9e8]">
                <CalendarPlus className="h-4 w-4" aria-hidden /> Добави в календара на това устройство
              </a>
              <ul className="list-disc space-y-1 pl-5 text-slate-600">
                <li><strong>iPhone:</strong> натиснете бутона по-горе от телефона и потвърдете „Абонирай се“.</li>
                <li>
                  <strong>Android (Google Календар):</strong> на компютър отворете calendar.google.com → „Други календари“ → „+“ → „От URL“ и
                  поставете адреса. Телефонът го показва след синхронизация. Google обновява такъв календар през няколко часа и
                  може да не звъни за него. За важна задача натиснете „В календара“ на самата задача: тя се добавя като отделно събитие с напомняне.
                </li>
              </ul>
              <p className="text-xs text-slate-500">
                Адресът е таен — който го има, вижда заглавията и сроковете на задачите ви. Не го споделяйте. Ако сте го дали по
                погрешка или сте сменили телефона, направете нов.
              </p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => void call("POST")} disabled={busy} className={btn}>
                  <RefreshCw className="h-4 w-4" aria-hidden /> Нов адрес
                </button>
                <button type="button" onClick={() => void call("DELETE")} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60">
                  Изключи
                </button>
              </div>
            </div>
          )}
        </section>

        <section aria-labelledby="browser-notif">
          <h3 id="browser-notif" className="flex items-center gap-1.5 font-semibold text-slate-900">
            <BellRing className="h-4 w-4" aria-hidden /> Известия от браузъра
          </h3>
          {perm === "granted" ? (
            <p className="mt-1 flex items-center gap-1.5 text-emerald-800">
              <Check className="h-4 w-4" aria-hidden /> Включени — при отваряне на сайта браузърът показва известие за задачите за днес.
            </p>
          ) : perm === "denied" ? (
            <p className="mt-1">Известията са забранени в браузъра. Разрешете ги от катинарчето до адреса на сайта.</p>
          ) : perm === "unsupported" ? (
            <p className="mt-1">Този браузър не поддържа известия. Напомнянията се виждат в сайта и в календара.</p>
          ) : (
            <div className="mt-1 space-y-2">
              <p>Браузърът може да показва и системно известие, когато сайтът е отворен.</p>
              <button type="button" onClick={() => void askNotifications()} className={btn}>
                <BellRing className="h-4 w-4" aria-hidden /> Разреши известия
              </button>
            </div>
          )}
        </section>
      </div>
    </details>
  );
}
