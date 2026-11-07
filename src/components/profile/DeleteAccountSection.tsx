"use client";

import { useId, useState } from "react";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { performSignOut } from "@/lib/session-cache";

// Копирано от МатураПлюс (src/components/settings/DeleteAccountSection.tsx).

const CONFIRM_WORD = "ИЗТРИЙ";

/** GDPR (чл. 17): учителят сам изтрива профила и материалите си. Изисква да се напише „ИЗТРИЙ“. */
export function DeleteAccountSection({ isAdmin }: { isAdmin: boolean }) {
  const inputId = useId();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmed = confirmText.trim().toLocaleUpperCase("bg-BG") === CONFIRM_WORD;

  async function handleDelete() {
    if (!confirmed || deleting) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: confirmText }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Профилът не беше изтрит. Опитайте отново.");
        setDeleting(false);
        return;
      }
      await performSignOut("/");
    } catch {
      setError("Няма връзка със сървъра. Опитайте отново.");
      setDeleting(false);
    }
  }

  return (
    <section aria-labelledby="delete-account-title" className="mt-8 rounded-2xl border border-rose-200 bg-white p-6 shadow-sm">
      <h2 id="delete-account-title" className="flex items-center gap-2 text-lg font-bold text-slate-900">
        <Trash2 className="h-5 w-5 text-rose-700" aria-hidden /> Изтриване на профила
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-slate-600">
        Изтрива завинаги профила и всичко, което сте създали: игри, план-конспекти, материали, файловете в облака (и
        споделените с колегите) и личния бележник. Копията, които колегите са си запазили, остават при тях. Действието не може да бъде отменено.
      </p>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-5 inline-flex items-center gap-2 rounded-lg border border-rose-300 bg-white px-5 py-2.5 text-sm font-semibold text-rose-700 transition-colors duration-150 hover:bg-rose-50 active:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
        >
          <Trash2 className="h-4 w-4" aria-hidden />
          Изтрий профила и материалите ми
        </button>
      ) : (
        <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50/60 p-4">
          <p className="flex items-start gap-2 text-sm font-medium leading-relaxed text-rose-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {isAdmin
              ? "Вие сте администратор на градината. Детската градина остава за колегите, а администратор става най-старият профил в нея."
              : "Сигурни ли сте? Детската градина и материалите на колегите остават."}
          </p>
          <label htmlFor={inputId} className="mt-4 block text-sm text-slate-700">
            За потвърждение напишете <strong className="font-bold">{CONFIRM_WORD}</strong>
          </label>
          <input
            id={inputId}
            type="text"
            autoComplete="off"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            disabled={deleting}
            className="mt-2 w-full max-w-xs rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 transition-colors duration-150 hover:border-slate-400 focus-visible:border-rose-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          />
          {error && (
            <p role="alert" className="mt-3 text-sm text-rose-700">
              {error}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={!confirmed || deleting}
              className="inline-flex items-center gap-2 rounded-lg bg-rose-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-rose-800 active:bg-rose-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Trash2 className="h-4 w-4" aria-hidden />}
              {deleting ? "Изтриване…" : "Изтрий завинаги"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setConfirmText("");
                setError(null);
              }}
              disabled={deleting}
              className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors duration-150 hover:bg-slate-50 active:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a4b82] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Отказ
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
