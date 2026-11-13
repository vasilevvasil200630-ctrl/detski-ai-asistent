"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useMe } from "@/lib/client/useMe";
import { invalidateMe } from "@/lib/client/me";
import { toast } from "@/components/Toaster";
import { FormError, PrimaryButton, TextField } from "@/components/auth/AuthUI";
import type { AgeGroup } from "@/types";
import { ChangePasswordSection } from "@/components/profile/ChangePasswordSection";
import { DeleteAccountSection } from "@/components/profile/DeleteAccountSection";
import { ExportDataSection } from "@/components/profile/ExportDataSection";

const AVATARS = ["👩‍🏫", "👨‍🏫", "👩‍🎨", "🦸‍♀️", "🧚‍♀️", "👩‍🔬", "🌟", "🦉"];
const AGE_GROUPS: { id: AgeGroup; label: string }[] = [
  { id: "1", label: "I група (3–4 г.)" },
  { id: "2", label: "II група (4–5 г.)" },
  { id: "3", label: "III ПГ (5–6 г.)" },
  { id: "4", label: "IV ПГ (6–7 г.)" },
];

const chip = (active: boolean) =>
  `rounded-lg border px-3 py-2 text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4d7a0a] ${
    active ? "border-[#4d7a0a] bg-[#f4f9e8] text-[#3d6108]" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
  }`;

export default function ProfilePage() {
  const { user, loading } = useMe();
  const [name, setName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0]!);
  const [ageGroup, setAgeGroup] = useState<AgeGroup>("2");
  const [groupName, setGroupName] = useState("");
  const [showcaseBio, setShowcaseBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setJobTitle(user.jobTitle);
    setAvatar(user.avatar);
    setAgeGroup(user.ageGroup);
    setGroupName(user.groupName);
    setShowcaseBio(user.showcaseBio ?? "");
  }, [user]);

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, jobTitle, avatar, ageGroup, groupName, showcaseBio }),
      });
      const data: { error?: string } = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Промените не бяха записани.");
        return;
      }
      invalidateMe();
      window.dispatchEvent(new Event("detski-auth-changed"));
      toast("Профилът е обновен.", "success");
    } catch {
      setError("Проблем с връзката. Опитайте отново.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#4d7a0a]" aria-label="Зареждане" />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto w-full max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Моят профил</h1>
        <p className="mt-3 leading-relaxed text-slate-600">Влезте, за да редактирате профила си и групата, за която генераторът се настройва.</p>
        <Link
          href="/login?callbackUrl=/profile"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#4d7a0a] px-6 py-3 font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-[#3d6108] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4d7a0a] focus-visible:ring-offset-2"
        >
          Вход
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Моят профил</h1>
      <p className="mt-1 text-sm leading-relaxed text-slate-600">
        {user.email} • {user.kindergarten?.name ?? "без детска градина"}
      </p>

      <form onSubmit={save} className="mt-6 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <TextField label="Име" value={name} onChange={(e) => setName(e.target.value)} required />
        <TextField label="Длъжност" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="Старши учител" />
        <fieldset>
          <legend className="mb-1.5 block text-sm font-medium text-slate-800">Аватар</legend>
          <div className="flex flex-wrap gap-2">
            {AVATARS.map((a) => (
              <button key={a} type="button" onClick={() => setAvatar(a)} aria-pressed={avatar === a} className={`${chip(avatar === a)} text-xl leading-none`}>
                {a}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-1.5 block text-sm font-medium text-slate-800">Група (генераторът се настройва за нея)</legend>
          <div className="grid grid-cols-2 gap-2">
            {AGE_GROUPS.map((g) => (
              <button key={g.id} type="button" onClick={() => setAgeGroup(g.id)} aria-pressed={ageGroup === g.id} className={chip(ageGroup === g.id)}>
                {g.label}
              </button>
            ))}
          </div>
        </fieldset>
        <TextField label="Име на групата" value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="II група „Пчелички“" />
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-800">Кратко представяне за витрината (по желание)</span>
          <textarea
            value={showcaseBio}
            onChange={(e) => setShowcaseBio(e.target.value)}
            maxLength={400}
            rows={3}
            placeholder="Напр. „Работя с децата от 15 години. Обичам игрите навън и музиката.“"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm leading-relaxed"
          />
          <span className="mt-1 block text-xs text-slate-500">Вижда се публично на витрината за родители, ако имате одобрени дейности. Без лични данни.</span>
        </label>
        <FormError message={error} />
        <PrimaryButton type="submit" loading={saving}>
          Запази промените
        </PrimaryButton>
      </form>

      <ChangePasswordSection />
      <ExportDataSection />
      <DeleteAccountSection isAdmin={user.kgRole === "ADMIN"} />
    </main>
  );
}
