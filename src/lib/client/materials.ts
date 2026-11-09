"use client";

import { toast } from "@/components/Toaster";
import type { AgeGroup, LessonDirection, MaterialKind, SavedMaterial } from "@/types";
import type { GameKit } from "@/services/printables/types";

export type NewMaterial = {
  kind: MaterialKind;
  title: string;
  ageGroup: AgeGroup;
  direction?: LessonDirection | null;
  core?: string | null;
  holiday?: string | null;
  meta?: Record<string, unknown> | null;
  content: unknown;
  shared?: boolean;
};

export type SaveResult = { material: SavedMaterial } | { authRequired: true } | null;

/** Записва материал в библиотеката (и по желание го споделя). Показва съобщение за резултата. */
export async function saveMaterial(input: NewMaterial): Promise<SaveResult> {
  try {
    const res = await fetch("/api/materials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data: { material?: SavedMaterial; error?: string; code?: string } = await res.json().catch(() => ({}));
    if (res.status === 401 || data.code === "AUTH_REQUIRED") return { authRequired: true };
    if (!res.ok || !data.material) {
      toast(data.error ?? "Материалът не беше запазен. Опитай отново.", "error");
      return null;
    }
    toast(input.shared ? "Запазено и споделено с колегите! 💛" : "Запазено в твоята библиотека! 📚", "success");
    return { material: data.material };
  } catch {
    toast("Няма връзка със сървъра. Опитай отново.", "error");
    return null;
  }
}

async function call<T>(url: string, init: RequestInit, failMessage: string): Promise<T | null> {
  try {
    const res = await fetch(url, init);
    const data = (await res.json().catch(() => ({}))) as T & { error?: string };
    if (!res.ok) {
      toast(data.error ?? failMessage, "error");
      return null;
    }
    return data;
  } catch {
    toast("Няма връзка със сървъра.", "error");
    return null;
  }
}

export function fetchMaterials(params: Record<string, string | undefined>) {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]);
  return call<{ materials: SavedMaterial[]; noKindergarten?: boolean }>(
    `/api/materials?${qs}`,
    { cache: "no-store" },
    "Материалите не можаха да се заредят.",
  );
}

export function setMaterialShared(id: string, shared: boolean) {
  return call<{ material: SavedMaterial }>(
    `/api/materials/${id}`,
    { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ shared }) },
    "Промяната не беше записана.",
  );
}

/** „Изпитано с деца“ с бележка (или null — маха отметката). */
export function setMaterialTried(id: string, tried: { note: string } | null) {
  return call<{ material: SavedMaterial }>(
    `/api/materials/${id}`,
    { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tried }) },
    "Отметката не беше записана.",
  );
}

/** Записва (или маха с null) материалите към запазена игра. */
export function setMaterialKit(id: string, kit: GameKit | null) {
  return call<{ material: SavedMaterial }>(
    `/api/materials/${id}`,
    { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kit }) },
    "Материалите не бяха записани към играта.",
  );
}

export function deleteMaterial(id: string) {
  return call<{ ok: true }>(`/api/materials/${id}`, { method: "DELETE" }, "Материалът не беше изтрит.");
}

export function toggleMaterialLike(id: string) {
  return call<{ likedByMe: boolean; likes: number }>(`/api/materials/${id}/like`, { method: "POST" }, "Харесването не беше записано.");
}

export function copyMaterial(id: string) {
  return call<{ material: SavedMaterial }>(`/api/materials/${id}/copy`, { method: "POST" }, "Материалът не беше копиран.");
}
