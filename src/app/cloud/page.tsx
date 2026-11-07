"use client";

import { Loader2 } from "lucide-react";
import { useMe } from "@/lib/client/useMe";
import { CloudModule } from "@/components/cloud/CloudModule";

export default function CloudPage() {
  const { user, loading } = useMe();
  if (loading || !user) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-slate-400" aria-label="Зареждане" />
      </main>
    );
  }
  if (!user.kindergarten) {
    return (
      <main className="mx-auto max-w-lg px-4 py-20 text-center text-slate-600">
        Профилът ви не е свързан с детската градина, затова облакът не е достъпен.
      </main>
    );
  }
  return <CloudModule user={user} />;
}
