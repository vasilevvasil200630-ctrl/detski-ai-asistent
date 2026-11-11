import "server-only";
import { KG } from "@/config/kindergarten";

/**
 * Настройки на имейлите (Resend). По модела на МатураПлюс (src/lib/email/config.ts).
 *
 * Във Vercel → Settings → Environment Variables:
 * - RESEND_API_KEY — без него писма не се изпращат (линкът за нова парола се вижда само в логовете локално)
 * - EMAIL_FROM="ДГ „Пролет“ <noreply@вашият-домейн>" — подател от верифициран домейн
 * - RESEND_DOMAIN_VERIFIED="true" — след като домейнът е потвърден в Resend
 * - ADMIN_NOTIFICATION_EMAIL — къде идва обратната връзка
 * - NEXT_PUBLIC_SUPPORT_EMAIL — публичният адрес за помощ (по подразбиране — официалният имейл на градината)
 */
export const EMAIL_CONFIG = {
  from: process.env.EMAIL_FROM || "ДГ „Пролет“ — учителски облак <onboarding@resend.dev>",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || KG.email,
  adminNotificationEmail: process.env.ADMIN_NOTIFICATION_EMAIL || "vasilevvasil200630@gmail.com",
} as const;

export function getResendApiKey(): string {
  return process.env.RESEND_API_KEY?.trim() ?? "";
}

/** За логовете: „pe***@abv.bg“ — без пълния адрес на учителя. */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return "—";
  const [local = "", domain] = email.trim().split("@");
  if (!domain) return "***";
  return `${local.slice(0, 2)}***@${domain}`;
}

export function isResendDomainVerified(): boolean {
  return process.env.RESEND_DOMAIN_VERIFIED === "true";
}

/** Публичният адрес на сайта (за линковете в писмата, sitemap и картинката при споделяне). */
export function getBaseAppUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes("localhost")) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.replace(/\/$/, "")}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  return process.env.NODE_ENV === "production" ? "https://detski-ai-asistent-s56y.vercel.app" : "http://localhost:3000";
}

/**
 * Безопасен получател. В тестовия режим на Resend (без верифициран домейн) писма могат да
 * отидат само до собственика на профила в Resend — затова в production писмото се пропуска
 * (не препращаме лични писма на учители към чужд адрес), а локално отива до администратора.
 */
export function resolveSafeRecipient(intendedEmail: string): { targetEmail: string; isSandboxed: boolean; shouldSkip: boolean } {
  const verified = isResendDomainVerified() && !EMAIL_CONFIG.from.includes("resend.dev");
  if (verified) return { targetEmail: intendedEmail.trim(), isSandboxed: false, shouldSkip: false };
  if (process.env.NODE_ENV === "production") {
    console.warn(`[email] Домейнът в Resend не е потвърден — писмото до ${maskEmail(intendedEmail)} се пропуска.`);
    return { targetEmail: "", isSandboxed: true, shouldSkip: true };
  }
  return { targetEmail: EMAIL_CONFIG.adminNotificationEmail, isSandboxed: true, shouldSkip: false };
}

/** Имейлът работи ли изобщо (ключ + потвърден домейн) — страницата „Забравена парола“ го показва. */
export function isEmailDeliveryReady(): boolean {
  return Boolean(getResendApiKey()) && (isResendDomainVerified() || process.env.NODE_ENV !== "production");
}

export function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
