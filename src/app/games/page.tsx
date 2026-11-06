"use client";

import { useRouter } from "next/navigation";
import { MagicGamesModule } from "@/components/MagicGamesModule";
import { useMe } from "@/lib/client/useMe";
import { saveGameToBank } from "@/lib/client/bank";
import { useAppStore } from "@/store/appStore";

export default function GamesPage() {
  const router = useRouter();
  const { user } = useMe();
  const projectorMode = useAppStore((s) => s.projectorMode);
  const addSavedMinutes = useAppStore((s) => s.addSavedMinutes);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <MagicGamesModule
        onTimeSaved={addSavedMinutes}
        projectorMode={projectorMode}
        activeTeacher={user}
        onSaveGameToBank={saveGameToBank}
        onOpenHub={() => router.push("/hub")}
        onRequireLogin={() => router.push("/login?callbackUrl=/games")}
      />
    </main>
  );
}
