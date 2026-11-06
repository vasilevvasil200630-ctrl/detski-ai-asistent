"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, KeyRound } from "lucide-react";
import { invalidateMe } from "@/lib/client/me";
import { AuthShell, FormError, PasswordField, PrimaryButton, Stepper, TextField } from "@/components/auth/AuthUI";
import type { AgeGroup } from "@/types";

// По модела на регистрацията в МатураПлюс (AuthShell + Stepper, валидация на сървъра със Zod).
// Стъпка 1: профил на учителя. Стъпка 2: нова детска градина или присъединяване с код.

const AVATARS = ["👩‍🏫", "👨‍🏫", "👩‍🎨", "🦸‍♀️", "🧚‍♀️", "👩‍🔬", "🌟", "🦉"];
const AGE_GROUPS: { id: AgeGroup; label: string }[] = [
  { id: "1", label: "I група (3–4 г.)" },
  { id: "2", label: "II група (4–5 г.)" },
  { id: "3", label: "III ПГ (5–6 г.)" },
  { id: "4", label: "IV ПГ (6–7 г.)" },
];

const chip = (active: boolean) =>
  `rounded-lg border px-3 py-2 text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a4b82] ${
    active ? "border-[#0a4b82] bg-[#eef5fb] text-[#083861]" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
  }`;

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0]!);
  const [ageGroup, setAgeGroup] = useState<AgeGroup>("2");
  const [groupName, setGroupName] = useState("");

  const [mode, setMode] = useState<"create" | "join">("create");
  const [kgName, setKgName] = useState("");
  const [kgCity, setKgCity] = useState("");
  const [joinCode, setJoinCode] = useState("");

  function nextStep(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 2) return setError("Моля, въведете име (напр. „Г-жа Петрова“).");
    if (!email.includes("@")) return setError("Моля, въведете валиден имейл адрес.");
    if (password.length < 8) return setError("Паролата трябва да е поне 8 символа.");
    setStep(2);
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          avatar,
          ageGroup,
          groupName,
          mode,
          kgName: mode === "create" ? kgName : undefined,
          kgCity: mode === "create" ? kgCity : undefined,
          joinCode: mode === "join" ? joinCode : undefined,
        }),
      });
      const data: { error?: string; redirectUrl?: string } = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Регистрацията не успя. Опитайте отново.");
        return;
      }
      invalidateMe();
      window.dispatchEvent(new Event("detski-auth-changed"));
      router.push(data.redirectUrl ?? "/hub");
      router.refresh();
    } catch {
      setError("Проблем с връзката. Опитайте отново.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Регистрация на учител"
      subtitle="Безплатно. Вашият екип получава обща банка с игри и AI инструменти."
      footer={
        <>
          Вече имате профил?{" "}
          <Link
            href="/login"
            className="font-semibold text-[#0a4b82] underline-offset-4 transition-colors duration-150 hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a4b82]"
          >
            Вход
          </Link>
        </>
      }
    >
      <Stepper steps={["Профил", "Детска градина"]} current={step} />

      {step === 1 ? (
        <form onSubmit={nextStep} className="space-y-4" noValidate>
          <TextField label="Име, както ще ви виждат колегите" value={name} onChange={(e) => setName(e.target.value)} placeholder="Г-жа Елена Петрова" autoComplete="name" required />
          <TextField label="Имейл" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="petrova@abv.bg" autoComplete="email" required />
          <PasswordField label="Парола" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" hint="Поне 8 символа." required />
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
          <FormError message={error} />
          <PrimaryButton type="submit">Продължи</PrimaryButton>
        </form>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Детска градина">
            <button type="button" role="radio" aria-checked={mode === "create"} onClick={() => setMode("create")} className={`${chip(mode === "create")} flex items-center justify-center gap-2`}>
              <Building2 className="h-4 w-4" /> Нова градина
            </button>
            <button type="button" role="radio" aria-checked={mode === "join"} onClick={() => setMode("join")} className={`${chip(mode === "join")} flex items-center justify-center gap-2`}>
              <KeyRound className="h-4 w-4" /> Имам код
            </button>
          </div>

          {mode === "create" ? (
            <>
              <TextField label="Име на детската градина" value={kgName} onChange={(e) => setKgName(e.target.value)} placeholder="ДГ „Слънце“" required />
              <TextField label="Град" value={kgCity} onChange={(e) => setKgCity(e.target.value)} placeholder="София" />
              <p className="text-xs leading-relaxed text-slate-500">След регистрацията ще получите код, с който колегите ви се присъединяват към същата градина.</p>
            </>
          ) : (
            <TextField label="Код на градината (от колега)" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="ДГ-7K4P2M" required />
          )}

          <fieldset>
            <legend className="mb-1.5 block text-sm font-medium text-slate-800">Вашата група</legend>
            <div className="grid grid-cols-2 gap-2">
              {AGE_GROUPS.map((g) => (
                <button key={g.id} type="button" onClick={() => setAgeGroup(g.id)} aria-pressed={ageGroup === g.id} className={chip(ageGroup === g.id)}>
                  {g.label}
                </button>
              ))}
            </div>
          </fieldset>
          <TextField label="Име на групата (по желание)" value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="II група „Пчелички“" />

          <FormError message={error} />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors duration-150 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a4b82]"
            >
              Назад
            </button>
            <PrimaryButton type="submit" loading={loading}>
              Създай профил
            </PrimaryButton>
          </div>
        </form>
      )}
    </AuthShell>
  );
}
