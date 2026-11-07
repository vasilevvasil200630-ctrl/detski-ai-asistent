"use client";

import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from "react";
import { usePathname } from "next/navigation";
import { Bug, CheckCircle2, Lightbulb, Loader2, Star, ThumbsUp, X } from "lucide-react";
import { getMe } from "@/lib/client/me";

// По модела на МатураПлюс (src/components/FeedbackWidget.tsx). Без плаващ бутон: формата се
// отваря от „Обратна връзка“ в долната част на страницата и в менюто на профила.

/** Отваря формата от всяко място (линк във футъра, меню на профила). */
export const OPEN_FEEDBACK_EVENT = "detski-open-feedback";
export function openFeedback() {
  window.dispatchEvent(new Event(OPEN_FEEDBACK_EVENT));
}

type FeedbackType = "praise" | "idea" | "bug";
const TYPES = [
  { value: "praise", label: "Харесва ми", icon: ThumbsUp },
  { value: "idea", label: "Идея или предложение", icon: Lightbulb },
  { value: "bug", label: "Грешка или проблем", icon: Bug },
] as const;

export function FeedbackWidget() {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_FEEDBACK_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_FEEDBACK_EVENT, onOpen);
  }, []);

  return open ? <FeedbackModal page={pathname} onClose={() => setOpen(false)} /> : null;
}

const LABEL = "mb-2 block text-sm font-semibold text-slate-800";
const FIELD =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors duration-150 hover:border-slate-400 focus-visible:border-[#0a4b82] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a4b82]/20 disabled:cursor-not-allowed disabled:opacity-60";

function FeedbackModal({ page, onClose }: { page: string; onClose: () => void }) {
  const titleId = useId();
  const messageId = useId();
  const emailId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [type, setType] = useState<FeedbackType | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);

  const close = useCallback(() => {
    if (!sending) onClose();
  }, [sending, onClose]);

  // Escape затваря; фокусът влиза в модала
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    dialogRef.current?.querySelector<HTMLElement>("fieldset button")?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [close]);

  // Влязъл учител → имейлът се попълва от профила
  useEffect(() => {
    let cancelled = false;
    getMe()
      .then((data) => {
        const profileEmail = data?.user?.email;
        if (!cancelled && profileEmail) setEmail((current) => current || profileEmail);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const trimmed = message.trim();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!type) return setError("Изберете за какво пишете.");
    if (rating < 1) return setError("Изберете оценка от 1 до 5 звезди.");
    if (trimmed.length < 5) return setError("Съобщението трябва да е поне 5 символа.");
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, rating, message: trimmed, email: email.trim(), page, website }),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Съобщението не беше изпратено. Опитайте отново.");
        return;
      }
      setSent(data.message ?? "Благодарим!");
    } catch {
      setError("Няма връзка със сървъра. Опитайте отново.");
    } finally {
      setSending(false);
    }
  }

  const shownRating = hoverRating || rating;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center">
      <div className="absolute inset-0 bg-slate-900/40" onClick={close} aria-hidden />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-lg"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-lg font-bold text-slate-900">
            {sent ? "Благодарим!" : "Обратна връзка"}
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label="Затвори"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-500 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a4b82]"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        {sent ? (
          <div className="mt-6 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" aria-hidden />
            <p className="mt-4 text-sm leading-relaxed text-slate-700">{sent}</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 inline-flex items-center justify-center rounded-lg bg-[#0a4b82] px-6 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#083861] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a4b82] focus-visible:ring-offset-2"
            >
              Затвори
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-5" noValidate>
            <p className="text-sm leading-relaxed text-slate-600">
              Кажете ни какво работи добре в градината ви, какво липсва или къде нещо се счупи.
            </p>
            <fieldset>
              <legend className={LABEL}>За какво пишете?</legend>
              <div className="flex flex-wrap gap-2">
                {TYPES.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={type === value}
                    onClick={() => setType(value)}
                    className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a4b82] ${
                      type === value
                        ? "border-[#0a4b82] bg-[#eef5fb] text-[#083861]"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="h-4 w-4" aria-hidden /> {label}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className={LABEL}>Оценка</legend>
              <div className="flex items-center gap-1" onMouseLeave={() => setHoverRating(0)}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-label={`${n} от 5 звезди`}
                    aria-pressed={rating === n}
                    onClick={() => setRating(n)}
                    onMouseEnter={() => setHoverRating(n)}
                    className="grid h-10 w-10 place-items-center rounded-lg transition-colors duration-150 hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                  >
                    <Star className={`h-6 w-6 ${n <= shownRating ? "fill-amber-400 text-amber-500" : "text-slate-300"}`} aria-hidden />
                  </button>
                ))}
              </div>
            </fieldset>

            <div>
              <label htmlFor={messageId} className={LABEL}>
                Съобщение
              </label>
              <textarea
                id={messageId}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                maxLength={2000}
                disabled={sending}
                placeholder="Например: искам игри за двора през зимата, или: бутонът „Запази“ не работи на таблета."
                className={`${FIELD} resize-y leading-relaxed`}
              />
            </div>

            <div>
              <label htmlFor={emailId} className={LABEL}>
                Имейл за отговор <span className="font-normal text-slate-500">(по желание)</span>
              </label>
              <input
                id={emailId}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={sending}
                placeholder="petrova@abv.bg"
                className={FIELD}
              />
            </div>

            {/* Honeypot: невидимо за хора, ботовете го попълват */}
            <div className="sr-only" aria-hidden>
              <label>
                Уебсайт
                <input type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
              </label>
            </div>

            {error && (
              <p role="alert" className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={sending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0a4b82] px-6 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#083861] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a4b82] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              {sending ? "Изпращане…" : "Изпрати"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
