"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getMe, invalidateMe } from "@/lib/client/me";
import { AuthShell, FormError, PasswordField, PrimaryButton, TextField } from "@/components/auth/AuthUI";

// Копирано от МатураПлюс (src/app/login/page.tsx): пренасочване на вече влезли, „Запомни ме“,
// само вътрешни callbackUrl (без open redirect). Без Google вход.

function safeCallback(raw: string | null): string | null {
  return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : null;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = safeCallback(searchParams.get("callbackUrl"));
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Вече влязъл учител → направо към целта
  useEffect(() => {
    getMe({ fresh: true })
      .then((d) => {
        if (d?.user) router.replace(callbackUrl ?? "/games");
        else setCheckingAuth(false);
      })
      .catch(() => setCheckingAuth(false));
  }, [router, callbackUrl]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, remember }),
      });
      const data: { error?: string; redirectUrl?: string } = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Неуспешен вход. Провери имейла и паролата.");
        return;
      }
      invalidateMe();
      window.dispatchEvent(new Event("detski-auth-changed"));
      router.push(callbackUrl ?? data.redirectUrl ?? "/games");
      router.refresh();
    } catch {
      setError("Проблем с връзката. Опитай отново.");
    } finally {
      setLoading(false);
    }
  }

  if (checkingAuth) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[#ffffff]">
        <Loader2 className="h-8 w-8 animate-spin text-[#0a4b82]" aria-label="Зареждане" />
      </main>
    );
  }

  return (
    <AuthShell
      title="Добре дошли отново!"
      subtitle="Влезте, за да споделяте игри с колегите от вашата градина."
      footer={
        <>
          Нямате профил?{" "}
          <Link
            href="/register"
            className="font-semibold text-[#0a4b82] underline-offset-4 transition-colors duration-150 hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a4b82]"
          >
            Регистрирайте се безплатно
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
        <PasswordField
          label="Парола"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />

        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 accent-[#0a4b82] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a4b82] focus-visible:ring-offset-2"
          />
          Запомни ме
        </label>

        <FormError message={error} />

        <PrimaryButton type="submit" loading={loading} disabled={!email || !password}>
          Вход
        </PrimaryButton>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
