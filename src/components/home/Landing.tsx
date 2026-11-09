"use client";

import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { useSignupOpen } from "@/lib/client/signup";
import { KG } from "@/config/kindergarten";
import { NAREDBA5 } from "@/services/naredba5";

/** Какво има в облака — кратко, без продажбен тон. */
const INSIDE = [
  {
    title: "Игри за всяко направление",
    text: "Ситуационни игри по възрастова група и по темата, която сте взели — БЕЛ, Математика, Околен свят, Изобразително изкуство, Музика, Конструиране и технологии, Физическа култура и БДП.",
  },
  {
    title: "Материали за печат",
    text: "Работни листове, стихчета, гатанки и броилки, писма и покани до родителите, грамоти и дипломи — готови за принтера, с името на градината.",
  },
  {
    title: "План-конспекти по ДОС",
    text: "Педагогическа ситуация с ядро, цели, очаквани резултати и ход в три части по Наредба № 5, с приказка и бележка за родителите.",
  },
  {
    title: "Общ облак и личен бележник",
    text: "Учителите и директорът качват и свалят файлове — планове, табла, сценарии, документи. Виждат ги само колегите от градината, а бележникът със задачите е само ваш.",
  },
];

/** Началната страница на облака за посетители: коя е градината и как се влиза. */
export function Landing() {
  const signupOpen = useSignupOpen();
  return (
    <main>
      <section className="mx-auto max-w-6xl px-4 pb-14 pt-12 sm:px-6 sm:pt-16 lg:pt-20">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-[#1a7f45]">
            {KG.fullName} · {KG.village}
          </p>
          <h1 className="mt-3 text-4xl font-bold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl">
            Учителският облак на {KG.name}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-600">
            Едно място, където учителите на градината създават, пазят и принтират материали за децата от своите групи —
            игри, работни листове, стихчета, писма до родителите и план-конспекти. Генерира нови материали винаги, когато
            трябват.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-[#0a4b82] px-6 py-3.5 text-base font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-[#083861] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a4b82] focus-visible:ring-offset-2"
            >
              Вход за учители <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            {signupOpen && (
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-base font-semibold text-slate-800 transition-colors duration-150 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a4b82]"
            >
              Регистрация с кода на градината
            </Link>
            )}
          </div>
          <p className="mt-5 flex items-start gap-2 text-sm leading-relaxed text-slate-500">
            <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            Облакът е само за учителите на {KG.name}.{signupOpen ? " Кодът за регистрация се дава от администратора на облака." : ""}
          </p>
        </div>
      </section>

      <section aria-labelledby="inside-title" className="border-t border-slate-200 bg-slate-50/60">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 id="inside-title" className="text-2xl font-bold tracking-tight text-slate-900">
            Какво има вътре
          </h2>
          <dl className="mt-8 grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {INSIDE.map((f) => (
              <div key={f.title}>
                <dt className="text-base font-semibold text-slate-900">{f.title}</dt>
                <dd className="mt-1.5 leading-relaxed text-slate-600">{f.text}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-10 max-w-3xl text-sm leading-relaxed text-slate-500">
            Съдържанието следва {NAREDBA5.title} ({NAREDBA5.lastAmended}), предучилищната линия на „Златно ключе“ и
            програмите на МОН по безопасност на движението по пътищата.
          </p>
        </div>
      </section>
    </main>
  );
}
