"use client";

import Link from "next/link";
import { Loader2, ShieldCheck } from "lucide-react";
import { useMe } from "@/lib/client/useMe";
import { TeamAdminModule } from "@/components/team/TeamAdminModule";

export default function TeamPage() {
  const { user, loading } = useMe();
  if (loading || !user) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-slate-400" aria-label="Зареждане" />
      </main>
    );
  }
  if (user.kgRole !== "ADMIN") {
    return (
      <main className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center">
        <ShieldCheck className="h-10 w-10 text-slate-400" aria-hidden />
        <h1 className="mt-4 text-xl font-bold text-slate-900">Само за директора</h1>
        <p className="mt-2 text-slate-600">Управлението на екипа е за администратора на облака. Екипа виждате в Учителския хъб.</p>
        <Link href="/hub" className="mt-6 rounded-xl border border-slate-300 px-5 py-2.5 font-semibold text-slate-800 hover:bg-slate-50">
          Към Учителския хъб
        </Link>
      </main>
    );
  }
  return <TeamAdminModule />;
}
