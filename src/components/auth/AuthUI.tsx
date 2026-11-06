"use client";

import React, { useId, useState } from "react";
import { AlertCircle, Check, Eye, EyeOff, Loader2 } from "lucide-react";
import { LogoIcon } from "@/components/Logo";

// Копирано от МатураПлюс (src/components/auth/AuthUI.tsx): обвивка с фина мрежа, полета с
// видими фокус/грешка състояния, бутон със зареждане, грешка и стъпки. Без Google и бухала.

/* -------------------------------------------------------------------------- */
/* Обвивка: светъл фон с фина тетрадъчна мрежа + приветлив бухал над картата    */
/* -------------------------------------------------------------------------- */

const GRID_STYLE: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(to right, var(--auth-grid) 1px, transparent 1px), linear-gradient(to bottom, var(--auth-grid) 1px, transparent 1px)",
  backgroundSize: "24px 24px",
};

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main
      className="relative flex min-h-[calc(100vh-4rem)] w-full items-start justify-center bg-[#fbfbfd] px-4 py-10 [--auth-grid:rgb(10_75_130/0.06)] sm:items-center sm:py-16 dark:bg-slate-950 dark:[--auth-grid:rgb(148_163_184/0.07)]"
      style={GRID_STYLE}
    >
      <div className="w-full max-w-md">
        <div className="mb-4 flex justify-center">
          <LogoIcon className="h-20 w-20 drop-shadow-sm" />
        </div>
        <div className="w-full rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">
          <h1 className="text-center text-2xl font-bold tracking-tight text-balance text-slate-900 dark:text-slate-50">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-center text-sm leading-relaxed text-slate-600 dark:text-slate-400">{subtitle}</p>
          )}
          <div className="mt-6">{children}</div>
        </div>
        {footer && <div className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">{footer}</div>}
      </div>
    </main>
  );
}

export function OrDivider({ label = "или продължи с имейл" }: { label?: string }) {
  return (
    <div className="my-6 flex items-center gap-3" role="separator">
      <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
      <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Полета                                                                      */
/* -------------------------------------------------------------------------- */

const INPUT_CLASS =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors duration-150 ease-in-out hover:border-slate-400 focus-visible:border-[#0a4b82] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a4b82]/20 disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-rose-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-slate-600 dark:focus-visible:border-sky-500";

type FieldProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "id"> & { label: string; error?: string | null };

export function TextField({ label, error, ...input }: FieldProps) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-800 dark:text-slate-200">
        {label}
      </label>
      <input id={id} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-err` : undefined} className={INPUT_CLASS} {...input} />
      {error && (
        <p id={`${id}-err`} className="mt-1.5 text-xs text-rose-700 dark:text-rose-300">
          {error}
        </p>
      )}
    </div>
  );
}

export function PasswordField({ label, error, hint, ...input }: FieldProps & { hint?: string }) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-800 dark:text-slate-200">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? `${id}-desc` : undefined}
          className={`${INPUT_CLASS} pr-12`}
          {...input}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Скрий паролата" : "Покажи паролата"}
          aria-pressed={visible}
          className="absolute inset-y-0 right-1 my-1 grid w-10 cursor-pointer place-items-center rounded-lg text-slate-500 transition-colors duration-150 ease-in-out hover:bg-slate-100 hover:text-slate-800 active:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a4b82] dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        >
          {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>
      {(error || hint) && (
        <p id={`${id}-desc`} className={`mt-1.5 text-xs ${error ? "text-rose-700 dark:text-rose-300" : "text-slate-500 dark:text-slate-400"}`}>
          {error || hint}
        </p>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Бутон, грешка, стъпки                                                       */
/* -------------------------------------------------------------------------- */

export function PrimaryButton({
  children,
  loading,
  ...button
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      {...button}
      disabled={button.disabled || loading}
      className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-amber-400 px-4 py-3.5 text-base font-bold text-slate-900 shadow-sm transition-colors duration-150 ease-in-out hover:bg-amber-500 active:bg-amber-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-offset-slate-900"
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm leading-relaxed text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      {message}
    </p>
  );
}

export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="mb-6 flex items-center gap-2" aria-label="Стъпки на регистрацията">
      {steps.map((label, i) => {
        const index = i + 1;
        const done = index < current;
        const active = index === current;
        return (
          <li key={label} className="flex flex-1 items-center gap-2" aria-current={active ? "step" : undefined}>
            <span
              className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold transition-colors duration-200 ease-in-out ${
                done
                  ? "bg-emerald-500 text-white"
                  : active
                    ? "bg-[#0a4b82] text-white dark:bg-sky-600"
                    : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
              }`}
            >
              {done ? <Check className="h-4 w-4" aria-hidden="true" /> : index}
            </span>
            <span
              className={`text-xs leading-tight ${
                active ? "font-semibold text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400"
              }`}
            >
              {label}
            </span>
            {index < steps.length && <span className="hidden h-px flex-1 bg-slate-200 sm:block dark:bg-slate-800" />}
          </li>
        );
      })}
    </ol>
  );
}
