"use client";

import { GoldenPromptsModule } from "@/components/GoldenPromptsModule";
import { useAppStore } from "@/store/appStore";

export default function PromptsPage() {
  const projectorMode = useAppStore((s) => s.projectorMode);
  const addSavedMinutes = useAppStore((s) => s.addSavedMinutes);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <GoldenPromptsModule onTimeSaved={addSavedMinutes} projectorMode={projectorMode} />
    </main>
  );
}
