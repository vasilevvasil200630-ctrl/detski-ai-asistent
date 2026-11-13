"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { KG } from "@/config/kindergarten";
import { useSignupOpen } from "@/lib/client/signup";

/** Заключена страница за гост: облакът е само за учителите на градината. */
export function SignInGate({ path }: { path: string }) {
  const callback = encodeURIComponent(path || "/");
  const signupOpen = useSignupOpen();
  return (
    <main className="mx-auto flex w-full max-w-lg flex-col items-center px-4 py-20 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#f4f9e8] text-[#4d7a0a]">
        <Lock className="h-6 w-6" aria-hidden />
      </span>
      <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">Тази страница е за учителите на {KG.name}</h1>
      <p className="mt-3 leading-relaxed text-slate-600">
        Влезте в профила си, за да генерирате, запазвате и принтирате материали.
        {signupOpen ? " Нов колега се регистрира с кода на градината." : ""}
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link
          href={`/login?callbackUrl=${callback}`}
          className="rounded-xl bg-[#4d7a0a] px-6 py-3 font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-[#3d6108] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4d7a0a] focus-visible:ring-offset-2"
        >
          Вход
        </Link>
        {signupOpen && (
          <Link
            href="/register"
            className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-800 transition-colors duration-150 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4d7a0a]"
          >
            Регистрация с код
          </Link>
        )}
      </div>
    </main>
  );
}
