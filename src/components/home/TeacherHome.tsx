"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useMe } from "@/lib/client/useMe";
import { Dashboard } from "@/components/home/Dashboard";

/** Таблото на влезлия учител (началната страница с профил). */
export function TeacherHome() {
  const { user, loading } = useMe();
  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-slate-400" aria-label="Зареждане" />
      </main>
    );
  }
  if (!user) {
    return (
      <main className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="text-slate-700">Сесията ви е изтекла.</p>
        <Link href="/login" className="mt-4 inline-block font-semibold text-[#0a4b82] hover:underline">
          Влезте отново
        </Link>
      </main>
    );
  }
  return <Dashboard user={user} />;
}
