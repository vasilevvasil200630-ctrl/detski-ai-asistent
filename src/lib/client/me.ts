/**
 * Текущият потребител от /api/auth/me — една заявка за цялата страница.
 * Сайдбарът, горната лента, AppShell, таблото и др. питаха поотделно (3–5 пъти на зареждане).
 * Едновременните извиквания споделят една заявка, а отговорът важи 5 секунди.
 * След вход, изход, регистрация или промяна на профила извикай invalidateMe().
 */

import type { SessionTeacher } from "@/types";

export type MeUser = SessionTeacher;

export type MeResponse = { user: MeUser | null };

const TTL_MS = 5_000;

let cached: { at: number; value: MeResponse } | null = null;
let inFlight: Promise<MeResponse | null> | null = null;
let generation = 0;

/**
 * `null` = заявката не успя (мрежа, 5xx) — не се кешира. `{ user: null }` = гост.
 * `fresh: true` пропуска кеша (но се присъединява към вече тръгнала заявка).
 */
export function getMe(options: { fresh?: boolean } = {}): Promise<MeResponse | null> {
  if (!options.fresh && cached && Date.now() - cached.at < TTL_MS) {
    return Promise.resolve(cached.value);
  }
  if (inFlight) return inFlight;

  const gen = generation;
  const request: Promise<MeResponse | null> = fetch("/api/auth/me", { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : null))
    .then((data: { user?: MeUser | null } | null) => {
      if (!data) return null;
      const value: MeResponse = { user: data.user ?? null };
      // Отговор на заявка отпреди invalidateMe() не бива да влиза в кеша
      if (gen === generation) cached = { at: Date.now(), value };
      return value;
    })
    .catch(() => null)
    .finally(() => {
      if (inFlight === request) inFlight = null;
    });
  inFlight = request;
  return request;
}

/** Забравя кеширания потребител — следващото getMe() пита сървъра. */
export function invalidateMe(): void {
  generation++;
  cached = null;
  inFlight = null;
}
