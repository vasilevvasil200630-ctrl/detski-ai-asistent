"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { CheckCircle2, Info } from "lucide-react";
import { AuthShell, FormError, PrimaryButton, TextField } from "@/components/auth/AuthUI";

// Копирано от МатураПлюс (src/app/forgot-password/ForgotPasswordClient.tsx).

const LINK_CLASS =
  "font-semibold text-[#0a4b82] underline-offset-4 transition-colors duration-150 hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a4b82]";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentMessage, setSentMessage] = useState<string | null>(null);
  const [emailReady, setEmailReady] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/auth/forgot-password")
      .then((r) => r.json())
      .then((d: { emailReady?: boolean }) => setEmailReady(Boolean(d.emailReady)))
      .catch(() => setEmailReady(null));
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data: { error?: string; message?: string } = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Нещо се обърка. Опитайте отново.");
        return;
      }
      setSentMessage(data.message ?? "Ако има профил с този имейл, ще получите писмо с линк за нова парола.");
    } catch {
      setError("Проблем с връзката. Опитайте отново.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Забравена парола"
      subtitle="Въведете имейла на профила си и ще ви изпратим линк за нова парола."
      footer={
        <>
          Сетихте се?{" "}
          <Link href="/login" className={LINK_CLASS}>
            Обратно към входа
          </Link>
        </>
      }
    >
      {sentMessage ? (
        <div role="status" className="space-y-4">
          <p className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm leading-relaxed text-emerald-900">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {sentMessage}
          </p>
          <p className="text-sm leading-relaxed text-slate-600">
            Линкът важи 1 час. Не дойде писмо?{" "}
            <button type="button" onClick={() => setSentMessage(null)} className={`cursor-pointer ${LINK_CLASS}`}>
              Опитайте отново
            </button>
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {emailReady === false && (
            <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-relaxed text-amber-900">
              <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              Изпращането на писма още не е включено. Помолете администратора на вашата градина или ни пишете чрез „Обратна връзка“.
            </p>
          )}
          <TextField
            label="Имейл"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="petrova@abv.bg"
            disabled={loading}
          />
          <FormError message={error} />
          <PrimaryButton type="submit" loading={loading} disabled={!email.trim()}>
            Изпрати линк
          </PrimaryButton>
        </form>
      )}
    </AuthShell>
  );
}
