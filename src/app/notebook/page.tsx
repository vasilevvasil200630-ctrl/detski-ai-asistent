"use client";

import { Loader2 } from "lucide-react";
import { useMe } from "@/lib/client/useMe";
import { NotebookModule } from "@/components/notebook/NotebookModule";

export default function NotebookPage() {
  const { user, loading } = useMe();
  if (loading || !user) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-slate-400" aria-label="Зареждане" />
      </main>
    );
  }
  return <NotebookModule />;
}
