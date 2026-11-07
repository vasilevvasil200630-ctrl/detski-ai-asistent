"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TeacherHubModule, type TeamMember } from "@/components/TeacherHubModule";
import { MaterialBrowser } from "@/components/MaterialBrowser";
import { toast } from "@/components/Toaster";
import { useMe } from "@/lib/client/useMe";
import { useAppStore } from "@/store/appStore";
import { AGE_GROUP_LABELS } from "@/services/aiEngine";
import { INITIAL_BANK_GAMES } from "@/services/hubSeedData";
import type { AgeGroup, GeneratedGame, SavedBankGame } from "@/types";

export default function HubPage() {
  const router = useRouter();
  const { user, loading: meLoading } = useMe();
  const projectorMode = useAppStore((s) => s.projectorMode);

  const [scope, setScope] = useState<"kg" | "all">("kg");
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [bank, setBank] = useState<SavedBankGame[]>([]);
  const [loadingBank, setLoadingBank] = useState(true);

  const loadBank = useCallback(async () => {
    setLoadingBank(true);
    try {
      const res = await fetch(`/api/hub/games?scope=${scope}`, { cache: "no-store" });
      const data: { games?: SavedBankGame[] } = await res.json().catch(() => ({}));
      setBank(data.games ?? []);
    } catch {
      toast("Банката не можа да се зареди. Проверете връзката.", "error");
    } finally {
      setLoadingBank(false);
    }
  }, [scope]);

  useEffect(() => {
    if (meLoading) return;
    if (!user) {
      // Гост: примерна банка, само за разглеждане
      setBank(INITIAL_BANK_GAMES);
      setLoadingBank(false);
      return;
    }
    void loadBank();
    fetch("/api/hub/team", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { teachers: [] }))
      .then((d: { teachers?: TeamMember[] }) => setTeam(d.teachers ?? []))
      .catch(() => setTeam([]));
  }, [meLoading, user, loadBank]);

  const requireLogin = () => router.push("/login?callbackUrl=/hub");

  const handleToggleLike = async (id: string) => {
    if (!user) return requireLogin();
    // Оптимистично обновяване, после реалният брой от сървъра
    setBank((prev) =>
      prev.map((g) => (g.id === id ? { ...g, likedByMe: !g.likedByMe, likes: g.likes + (g.likedByMe ? -1 : 1) } : g)),
    );
    try {
      const res = await fetch(`/api/hub/games/${id}/like`, { method: "POST" });
      if (!res.ok) throw new Error(String(res.status));
      const data: { likedByMe: boolean; likes: number } = await res.json();
      setBank((prev) => prev.map((g) => (g.id === id ? { ...g, ...data } : g)));
    } catch {
      toast("Харесването не беше записано.", "error");
      void loadBank();
    }
  };

  const handleAddCustom = async (title: string, ageGroup: AgeGroup, rhymeText: string, stepsText: string, goal: string) => {
    if (!user) {
      requireLogin();
      return false;
    }
    const game: GeneratedGame = {
      id: `custom-${Date.now()}`,
      title,
      subtitle: `Авторска практика от ${user.name}${user.kindergarten ? ` (${user.kindergarten.name})` : ""}`,
      tags: ["Авторска игра", AGE_GROUP_LABELS[ageGroup].ageRange],
      badgeColor: "mint",
      rhymeTitle: "📜 Римуван стих / закачка за старт:",
      rhymeLines: rhymeText.split("\n").map((s) => s.trim()).filter(Boolean),
      steps: stepsText.split("\n").map((s) => s.replace(/^\s*\d+[.)]\s*/, "").trim()).filter(Boolean),
      pedagogicalGoal: goal,
      teacherTip: `Споделено в колективната банка${user.kindergarten ? ` на ${user.kindergarten.name}` : ""}.`,
    };
    try {
      const res = await fetch("/api/hub/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ageGroup, mood: "noisy", location: "classroom", resources: "none", game }),
      });
      const data: { game?: SavedBankGame; error?: string } = await res.json().catch(() => ({}));
      if (!res.ok || !data.game) {
        toast(data.error ?? "Играта не беше записана.", "error");
        return false;
      }
      setBank((prev) => [data.game!, ...prev]);
      toast("Играта е споделена с колегите! 💛", "success");
      return true;
    } catch {
      toast("Няма връзка със сървъра.", "error");
      return false;
    }
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <TeacherHubModule
        teacher={user}
        team={team}
        bankGames={bank}
        loading={meLoading || loadingBank}
        scope={scope}
        onScopeChange={setScope}
        onToggleLikeGame={handleToggleLike}
        onAddCustomBankGame={handleAddCustom}
        onNavigateToGenerator={() => router.push("/games")}
        projectorMode={projectorMode}
      />

      {/* Всичко останало, което колегите споделят: ДОС планове, приказки, промптове, помощни материали */}
      {user && (
        <section aria-labelledby="shared-materials-title" className="mt-10 space-y-4">
          <div>
            <h2 id="shared-materials-title" className="text-xl font-extrabold text-slate-900">
              📂 Споделени материали от колегите
            </h2>
            <p className="text-sm text-slate-600">
              ДОС планове, промптове и помощни материали, споделени в {user.kindergarten?.name ?? "вашата детска градина"}. Запазете
              всеки от тях в своята библиотека с един бутон.
            </p>
          </div>
          <MaterialBrowser
            scope="shared"
            excludeKind="GAME"
            emptyText="Още няма споделени материали. Генерирайте ДОС план или добавете материал в библиотеката си и го споделете."
          />
        </section>
      )}
    </main>
  );
}
