"use client";

import { LiveDosModule } from "@/components/LiveDosModule";
import { useMe } from "@/lib/client/useMe";
import { useAppStore } from "@/store/appStore";

export default function DosPage() {
  const { user } = useMe();
  const projectorMode = useAppStore((s) => s.projectorMode);
  const addSavedMinutes = useAppStore((s) => s.addSavedMinutes);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <LiveDosModule defaultAgeGroup={user?.ageGroup} onTimeSaved={addSavedMinutes} projectorMode={projectorMode} />
    </main>
  );
}
