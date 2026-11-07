"use client";

import { useState, type FormEvent } from "react";
import { KeyRound } from "lucide-react";
import { FormError, PasswordField, PrimaryButton } from "@/components/auth/AuthUI";
import { toast } from "@/components/Toaster";

/** Смяна на паролата от профила. Входовете на други устройства спират да важат. */
export function ChangePasswordSection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mismatch = confirm.length > 0 && newPassword !== confirm;

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 8) return setError("Новата парола трябва да е поне 8 символа.");
    if (newPassword !== confirm) return setError("Двете нови пароли не съвпадат.");
    setSaving(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data: { error?: string } = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Паролата не беше сменена.");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
      toast("Паролата е сменена.", "success");
    } catch {
      setError("Проблем с връзката. Опитайте отново.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section aria-labelledby="change-password-title" className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 id="change-password-title" className="flex items-center gap-2 text-lg font-bold text-slate-900">
        <KeyRound className="h-5 w-5 text-[#0a4b82]" aria-hidden /> Смяна на паролата
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-slate-600">След смяната входовете на други устройства спират да важат.</p>
      <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
        <PasswordField
          label="Сегашна парола"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          disabled={saving}
        />
        <PasswordField
          label="Нова парола"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          hint="Поне 8 символа."
          disabled={saving}
        />
        <PasswordField
          label="Повторете новата парола"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={mismatch ? "Паролите не съвпадат." : null}
          disabled={saving}
        />
        <FormError message={error} />
        <PrimaryButton type="submit" loading={saving} disabled={!currentPassword || !newPassword || !confirm}>
          Смени паролата
        </PrimaryButton>
      </form>
    </section>
  );
}
