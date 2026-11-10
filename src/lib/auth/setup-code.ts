import { timingSafeEqual } from "node:crypto";

/**
 * Първият профил в облака става директор (администратор). За да не може външен човек да го
 * създаде пръв, той иска тайна дума от настройките на сървъра (SETUP_CODE във Vercel).
 * Без зададена дума първият профил не може да се създаде на живия сайт; локално (за разработка)
 * е позволено.
 */
export function setupCodeConfigured(env: Record<string, string | undefined> = process.env): boolean {
  return !!env.SETUP_CODE?.trim();
}

export function firstAdminAllowed(code: string | undefined, env: Record<string, string | undefined> = process.env): boolean {
  const expected = env.SETUP_CODE?.trim();
  if (!expected) return env.NODE_ENV !== "production";
  const given = Buffer.from((code ?? "").trim());
  const want = Buffer.from(expected);
  return given.length === want.length && timingSafeEqual(given, want);
}
