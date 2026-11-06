"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, ArrowLeft } from "lucide-react";

// По модела на МатураПлюс (src/app/error.tsx): съобщение, „Опитай отново“ и автоматично
// презареждане при разминаване на файловете след нов deploy (ChunkLoadError).

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("APP ERROR:", error);
    const isChunkError =
      error?.message?.includes("Loading chunk") ||
      error?.name === "ChunkLoadError" ||
      error?.message?.includes("Failed to fetch dynamically imported module");
    if (isChunkError) {
      const last = sessionStorage.getItem("last_chunk_reload");
      const now = Date.now();
      if (!last || now - Number(last) > 10000) {
        sessionStorage.setItem("last_chunk_reload", String(now));
        window.location.reload();
      }
    }
  }, [error]);

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <section className="w-full max-w-xl text-center space-y-6">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-amber-200/80 bg-amber-50 shadow-sm">
          <AlertTriangle className="h-10 w-10 text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">Нещо се обърка</h1>
        <p className="text-stone-600 leading-relaxed">Опитайте отново. Ако проблемът остане, презаредете страницата.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-lg bg-[#c2410c] px-5 py-2.5 font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-[#9a3412] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c2410c] focus-visible:ring-offset-2"
          >
            <RotateCcw className="h-4 w-4" /> Опитай отново
          </button>
          <Link
            href="/games"
            className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-5 py-2.5 font-semibold text-stone-700 transition-colors duration-150 hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c2410c]"
          >
            <ArrowLeft className="h-4 w-4" /> Към началото
          </Link>
        </div>
      </section>
    </main>
  );
}
