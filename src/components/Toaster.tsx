"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

/**
 * Ultra-lightweight toast система без нова dependency.
 * Слуша window CustomEvent "detski-toast" — компоненти го dispatch-ват
 * или ползват helper-a toast() от helpers.ts.
 */

export type ToastKind = "success" | "error" | "info";

type Toast = {
  id: number;
  kind: ToastKind;
  message: string;
};

export const TOAST_EVENT = "detski-toast";

export function toast(message: string, kind: ToastKind = "info") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<Omit<Toast, "id">>(TOAST_EVENT, {
      detail: { message, kind },
    }),
  );
}

const DURATION_MS = 3500;

export function Toaster() {
  const [items, setItems] = useState<Toast[]>([]);

  useEffect(() => {
    let counter = 1;
    const onToast = (e: Event) => {
      const detail = (e as CustomEvent<Omit<Toast, "id">>).detail;
      if (!detail || typeof detail.message !== "string") return;
      const id = counter++;
      const item: Toast = { id, kind: detail.kind ?? "info", message: detail.message };
      setItems((prev) => [...prev, item]);
      setTimeout(() => {
        setItems((prev) => prev.filter((t) => t.id !== id));
      }, DURATION_MS);
    };
    window.addEventListener(TOAST_EVENT, onToast);
    return () => window.removeEventListener(TOAST_EVENT, onToast);
  }, []);

  const dismiss = (id: number) => setItems((prev) => prev.filter((t) => t.id !== id));

  if (items.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`pointer-events-auto flex items-start gap-2 rounded-xl border p-3 text-sm shadow-sm ${
            t.kind === "success"
              ? "border-emerald-300 bg-emerald-50/95 text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-500/20 dark:text-emerald-100"
              : t.kind === "error"
                ? "border-rose-300 bg-rose-50/95 text-rose-900 dark:border-rose-500/40 dark:bg-rose-500/20 dark:text-rose-100"
                : "border-slate-300 bg-white/95 text-slate-900 dark:border-slate-600 dark:bg-slate-800/95 dark:text-slate-100"
          }`}
        >
          {t.kind === "success" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600 dark:text-emerald-300" />
          ) : t.kind === "error" ? (
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-600 dark:text-rose-300" />
          ) : (
            <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-500 dark:text-slate-300" />
          )}
          <span className="flex-1 leading-snug">{t.message}</span>
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            className="text-current opacity-60 hover:opacity-100"
            aria-label="Затвори"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
