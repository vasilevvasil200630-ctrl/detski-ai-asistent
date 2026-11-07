"use client";

import { Loader2 } from "lucide-react";
import { useMe } from "@/lib/client/useMe";
import { Landing } from "@/components/home/Landing";
import { Dashboard } from "@/components/home/Dashboard";

/** Начало: представяне на платформата за посетители, табло за влезлите учители. */
export default function Home() {
  const { user, loading } = useMe();

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-slate-400" aria-label="Зареждане" />
      </main>
    );
  }
  return user ? <Dashboard user={user} /> : <Landing />;
}
