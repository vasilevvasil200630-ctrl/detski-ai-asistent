"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AuthShell, FormError, PasswordField, PrimaryButton } from "@/components/auth/AuthUI";
import { invalidateMe } from "@/lib/client/me";

// Копирано от МатураПлюс (src/app/reset-password/ResetPasswordClient.tsx).

const LINK_CLASS =
  "font-semibold text-[#0a4b82] underline-offset-4 transition-colors duration-150 hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a4b82]";

type View = { kind: "checking" } | { kind: "invalid"; message: string } | { kind: "form" };

function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [view, setView] = useState<View>(
    token ? { kind: "checking" } : { kind: "invalid", message: "В линка липсва код. Отворете го отново от писмото." },
  );
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        const data: { error?: string } = await r.json().catch(() => ({}));
        if (!cancelled) setView(r.ok ? { kind: "form" } : { kind: "invalid", message: data.error ?? "Линкът е невалиден или е изтекъл." });
      })
      .catch(() => {
        if (!cancelled) setView({ kind: "invalid", message: "Проблем с връзката. Презаредете страницата." });
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const mismatch = confirm.length > 0 && password !== confirm;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError("Паролата трябва да е поне 8 символа.");
    if (password !== confirm) return setError("Двете пароли не съвпадат.");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data: { error?: string; redirectUrl?: string } = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Паролата не беше сменена. Опитайте отново.");
        return;
      }
      invalidateMe();
      window.dispatchEvent(new Event("detski-auth-changed"));
      router.push(data.redirectUrl ?? "/");
      router.refresh();
    } catch {
      setError("Проблем с връзката. Опитайте отново.");
    } finally {
      setLoading(false);
    }
  }

  if (view.kind === "checking") {
    return (
      <AuthShell title="Нова парола">
        <div role="status" className="flex items-center justify-center gap-2 py-6 text-sm text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          Проверяваме линка…
        </div>
      </AuthShell>
    );
  }

  if (view.kind === "invalid") {
    return (
      <AuthShell
        title="Линкът не важи"
        footer={
          <Link href="/login" className={LINK_CLASS}>
            Обратно към входа
          </Link>
        }
      >
        <div className="space-y-4">
          <FormError message={view.message} />
          <Link
            href="/forgot-password"
            className="flex w-full items-center justify-center rounded-lg bg-[#0a4b82] px-4 py-3 text-base font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-[#083861] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a4b82] focus-visible:ring-offset-2"
          >
            Заявете нов линк
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Изберете нова парола" subtitle="След смяната ще влезете автоматично, а входовете на други устройства спират да важат.">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <PasswordField
          label="Нова парола"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint="Поне 8 символа."
          disabled={loading}
        />
        <PasswordField
          label="Повторете паролата"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={mismatch ? "Паролите не съвпадат." : null}
          disabled={loading}
        />
        <FormError message={error} />
        <PrimaryButton type="submit" loading={loading} disabled={!password || !confirm}>
          Запази паролата
        </PrimaryButton>
      </form>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
