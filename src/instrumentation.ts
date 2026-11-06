/**
 * Вика се веднъж при старт на всяка сървърна инстанция (Next.js instrumentation).
 * Само в production на Node.js — проверява настройките и обяснява в логовете какво не
 * работи, ако нещо липсва (вместо функции да спират тихо).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.VERCEL_ENV !== "production" && process.env.NODE_ENV !== "production") return;
  const { reportEnvProblems } = await import("@/lib/env-check");
  reportEnvProblems();
}
