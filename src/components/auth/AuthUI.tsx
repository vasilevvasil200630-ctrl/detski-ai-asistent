"use client";

import React, { useId, useState } from "react";
import { AlertCircle, Check, Eye, EyeOff, Loader2 } from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Обвивка за вход, регистрация и нова парола — в стила на ДГ „Пролет“        */
/* -------------------------------------------------------------------------- */

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
    <main className="flex min-h-[calc(100vh-14rem)] w-full items-start justify-center px-4 py-8 sm:items-center sm:py-12">
      <div className="w-full max-w-md font-sans">
        <div className="w-full rounded-xl border-2 border-[#e6cf67] bg-[#fffef9] p-6 shadow-sm sm:p-8">
          <h1 className="font-hand text-center text-3xl font-bold leading-tight text-balance text-kg-orange-ink sm:text-4xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-center text-sm leading-relaxed text-slate-700">{subtitle}</p>
          )}
          <div className="mt-6 border-t-2 border-kg-yellow pt-6">{children}</div>
        </div>
        {footer && <div className="mt-5 text-center text-sm text-slate-700">{footer}</div>}
      </div>
    </main>
  );
}

export function OrDivider({ label = "или продължи с имейл" }: { label?: string }) {
  return (
    <div className="my-6 flex items-center gap-3" role="separator">
      <span className="h-px flex-1 bg-[#e6cf67]" />
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <span className="h-px flex-1 bg-[#e6cf67]" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Полета (четлив шрифт Geist + контрастна рамка >= 3:1)                       */
/* -------------------------------------------------------------------------- */

const INPUT_CLASS =
  "w-full rounded-xl border border-[#8b8368] bg-white px-4 py-3 font-sans text-sm text-[#2e2e2e] placeholder:text-slate-400 transition-colors duration-150 ease-in-out hover:border-[#6b634b] focus-visible:border-[#4d7a0a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4d7a0a]/25 disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-rose-500";

type FieldProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "id"> & { label: string; error?: string | null };

export function TextField({ label, error, ...input }: FieldProps) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block font-sans text-sm font-semibold text-[#2e2e2e]">
        {label}
      </label>
      <input id={id} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-err` : undefined} className={INPUT_CLASS} {...input} />
      {error && (
        <p id={`${id}-err`} className="mt-1.5 font-sans text-xs text-rose-700">
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
      <label htmlFor={id} className="mb-1.5 block font-sans text-sm font-semibold text-[#2e2e2e]">
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
          className="absolute inset-y-0 right-1 my-1 grid w-10 cursor-pointer place-items-center rounded-lg text-slate-600 transition-colors duration-150 ease-in-out hover:bg-[#f4f9e8] hover:text-[#4d7a0a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4d7a0a]"
        >
          {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>
      {(error || hint) && (
        <p id={`${id}-desc`} className={`mt-1.5 font-sans text-xs ${error ? "text-rose-700" : "text-slate-600"}`}>
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
      className="kg-leaf flex w-full cursor-pointer items-center justify-center gap-2 bg-[#4d7a0a] px-4 py-3.5 font-sans text-base font-bold text-white shadow-xs transition-colors duration-150 ease-in-out hover:bg-[#c43d00] active:bg-[#3d6108] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4d7a0a] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
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
      className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 font-sans text-sm leading-relaxed text-rose-800"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      {message}
    </p>
  );
}

export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="mb-6 flex items-center gap-2 font-sans" aria-label="Стъпки на регистрацията">
      {steps.map((label, i) => {
        const index = i + 1;
        const done = index < current;
        const active = index === current;
        return (
          <li key={label} className="flex flex-1 items-center gap-2" aria-current={active ? "step" : undefined}>
            <span
              className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold transition-colors duration-200 ease-in-out ${
                done
                  ? "bg-[#74a710] text-white"
                  : active
                    ? "bg-[#c43d00] text-white"
                    : "bg-[#faf4da] text-[#3d2f00]"
              }`}
            >
              {done ? <Check className="h-4 w-4" aria-hidden="true" /> : index}
            </span>
            <span className={`text-xs leading-tight ${active ? "font-bold text-[#2e2e2e]" : "text-slate-600"}`}>
              {label}
            </span>
            {index < steps.length && <span className="hidden h-px flex-1 bg-[#e6cf67] sm:block" />}
          </li>
        );
      })}
    </ol>
  );
}
