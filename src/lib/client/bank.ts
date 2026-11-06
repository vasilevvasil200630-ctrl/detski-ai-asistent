"use client";

import { toast } from "@/components/Toaster";
import type { GameFilterState, GeneratedGame } from "@/types";

/** Записва игра в колективната банка на градината. Връща true при успех. */
export async function saveGameToBank(game: GeneratedGame, filters: GameFilterState): Promise<boolean> {
  try {
    const res = await fetch("/api/hub/games", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ageGroup: filters.ageGroup,
        mood: filters.mood,
        location: filters.location,
        resources: filters.resources,
        game,
      }),
    });
    const data: { error?: string } = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast(data.error ?? "Играта не беше записана. Опитай отново.", "error");
      return false;
    }
    toast("Играта е споделена в банката на градината! 💛", "success");
    return true;
  } catch {
    toast("Няма връзка със сървъра. Опитай отново.", "error");
    return false;
  }
}
