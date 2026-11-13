"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Info, Loader2 } from "lucide-react";
import { invalidateMe } from "@/lib/client/me";
import { AuthShell, FormError, PasswordField, PrimaryButton, Stepper, TextField } from "@/components/auth/AuthUI";
import { KG } from "@/config/kindergarten";
import type { AgeGroup } from "@/types";

// По модела на регистрацията в МатураПлюс (AuthShell + Stepper, валидация на сървъра със Zod).
// Облакът е само на ДГ „Пролет“: стъпка 1 — профил и код на градината, стъпка 2 — групата.
// Първият профил не въвежда код и става администратор.

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

const LINK = "font-semibold text-[#4d7a0a] underline-offset-4 transition-colors duration-150 hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4d7a0a]";

export default function RegisterPage() {
  const router = useRouter();
  const [needsCode, setNeedsCode] = useState<boolean | null>(null);
  const [open, setOpen] = useState(true);
  // Директорът ползва списък с разрешени имейли — код не е нужен, но имейлът трябва да е в списъка
  const [byEmail, setByEmail] = useState(false);
  // Още няма профили: първият е директорът и въвежда първоначалния код от настройките на сайта
  const [setup, setSetup] = useState(false);
  // Всички места (директор и 8 учители) са заети
  const [full, setFull] = useState(false);
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [joinCode, setJoinCode] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0]!);
  const [ageGroup, setAgeGroup] = useState<AgeGroup>("2");
  const [groupName, setGroupName] = useState("");

  useEffect(() => {
    fetch("/api/auth/register")
      .then((r) => r.json())
      .then((d: { needsCode?: boolean; open?: boolean; byEmail?: boolean; setup?: boolean; full?: boolean }) => {
        setSetup(d.setup === true);
        setFull(d.full === true);
        setNeedsCode(d.needsCode !== false);
        setOpen(d.open !== false);
        setByEmail(d.byEmail === true);
      })
      .catch(() => setNeedsCode(true));
  }, []);

  function nextStep(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (needsCode && joinCode.trim().length < 6) return setError(setup ? "Въведете първоначалния код." : `Въведете кода на ${KG.name}.`);
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
        body: JSON.stringify({ name, email, password, avatar, ageGroup, groupName, joinCode: needsCode ? joinCode : undefined }),
      });
      const data: { error?: string; redirectUrl?: string } = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Регистрацията не успя. Опитайте отново.");
        // Грешният код е на първата стъпка
        if (res.status === 403) setStep(1);
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

  return (
    <AuthShell
      title={`Регистрация в ${KG.name}`}
      subtitle={`Учителският облак на ${KG.fullName}, ${KG.village}. Само за учителите на градината.`}
      footer={
        <>
          Вече имате профил?{" "}
          <Link href="/login" className={LINK}>
            Вход
          </Link>
        </>
      }
    >
      {needsCode === null ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-[#4d7a0a]" aria-label="Зареждане" />
        </div>
      ) : !open ? (
        <div className="space-y-4">
          <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {full
              ? `Всички места за учители в облака на ${KG.name} са заети. Ако сте нов колега, обърнете се към директора — може да освободи място.`
              : setup
              ? `Облакът на ${KG.name} още не е отворен. Директорът го отваря с първоначалния код от настройките на сайта.`
              : `Регистрацията на нови учители в ${KG.name} е затворена — екипът вече е в облака. Ако сте нов колега, обърнете се към директора — ще я отвори за вас.`}
          </p>
          <p className="text-sm leading-relaxed text-slate-600">
            Родител или гост? Не ви трябва профил —{" "}
            <Link href="/vitrina" className={LINK}>
              вижте какво правим в градината
            </Link>
            .
          </p>
        </div>
      ) : (
        <>
          <Stepper steps={["Профил", "Група"]} current={step} />

          {step === 1 ? (
            <form onSubmit={nextStep} className="space-y-4" noValidate>
              {needsCode ? (
                <TextField
                  label={setup ? "Първоначален код (за първия профил — директора)" : `Код на ${KG.name}`}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder={setup ? "" : "ДГ-7K4P2M"}
                  autoComplete="off"
                  required
                />
              ) : byEmail ? (
                <p className="flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm leading-relaxed text-sky-900">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  Регистрацията е само с имейл, който директорът е добавил в списъка на {KG.name}. Използвайте същия имейл, който сте дали
                  на директора.
                </p>
              ) : (
                <p className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm leading-relaxed text-emerald-900">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  Вие сте първият профил в облака и ставате негов администратор. След регистрацията ще видите кода, с който
                  колегите ви се присъединяват.
                </p>
              )}
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
              {needsCode && (
                <p className="text-xs leading-relaxed text-slate-500">
                  {setup
                    ? "Първият профил става администратор на облака. Първоначалният код е в настройките на сайта и го знае само директорът."
                    : "Кодът се дава от администратора на облака — директора или колегата, която го е създала."}
                </p>
              )}
            </form>
          ) : (
            <form onSubmit={submit} className="space-y-4" noValidate>
              <fieldset>
                <legend className="mb-1.5 block text-sm font-medium text-slate-800">Вашата група (материалите се настройват за нея)</legend>
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
                  className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors duration-150 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4d7a0a]"
                >
                  Назад
                </button>
                <PrimaryButton type="submit" loading={loading}>
                  Създай профил
                </PrimaryButton>
              </div>
              <p className="text-xs leading-relaxed text-slate-500">
                Със създаването на профила приемате{" "}
                <Link href="/terms" target="_blank" className="font-semibold text-[#4d7a0a] hover:underline">
                  условията за ползване
                </Link>
                . Как обработваме данните ви, включително имейл адреса, е описано в{" "}
                <Link href="/privacy" target="_blank" className="font-semibold text-[#4d7a0a] hover:underline">
                  политиката за поверителност
                </Link>
                .
              </p>
            </form>
          )}
        </>
      )}
    </AuthShell>
  );
}
