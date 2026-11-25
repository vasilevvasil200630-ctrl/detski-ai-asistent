import "server-only";
import { KG } from "@/config/kindergarten";

/**
 * Настройки на имейлите (Resend). По модела на МатураПлюс (src/lib/email/config.ts).
 *
 * Във Vercel → Settings → Environment Variables:
 * - RESEND_API_KEY — без него писма не се изпращат (линкът за нова парола се вижда само в логовете локално)
 * - EMAIL_FROM="ДГ „Пролет“ <noreply@вашият-домейн>" — подател от верифициран домейн в Resend
 * - RESEND_DOMAIN_VERIFIED="true" — по желание (включва се автоматично, щом EMAIL_FROM не е resend.dev)
 * - ADMIN_NOTIFICATION_EMAIL — къде идва обратната връзка
 * - NEXT_PUBLIC_SUPPORT_EMAIL — публичният адрес за помощ (по подразбиране — официалният имейл на градината)
 */

const DEFAULT_FROM = "ДГ „Пролет“ — учителски облак <onboarding@resend.dev>";

/** Почиства интервали, нови редове (\r\n от CLI) и случайни външни кавички от променлива на средата. */
export function cleanEnv(raw: string | undefined): string {
  if (!raw) return "";
  let v = raw.trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1).trim();
  }
  return v;
}

export const EMAIL_CONFIG = {
  get from(): string {
    return cleanEnv(process.env.EMAIL_FROM) || DEFAULT_FROM;
  },
  get supportEmail(): string {
    return cleanEnv(process.env.NEXT_PUBLIC_SUPPORT_EMAIL) || KG.email;
  },
  get adminNotificationEmail(): string {
    return cleanEnv(process.env.ADMIN_NOTIFICATION_EMAIL) || "vasilevvasil200630@gmail.com";
  },
};

export function getResendApiKey(): string {
  return cleanEnv(process.env.RESEND_API_KEY);
}

/** За логовете: „pe***@abv.bg“ — без пълния адрес на учителя. */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return "—";
  const [local = "", domain] = email.trim().split("@");
  if (!domain) return "***";
  return `${local.slice(0, 2)}***@${domain}`;
}

export function isUsingSandboxSender(): boolean {
  return EMAIL_CONFIG.from.toLowerCase().includes("resend.dev");
}

export function isResendDomainVerified(): boolean {
  const flag = (cleanEnv(process.env.RESEND_DOMAIN_VERIFIED) || cleanEnv(process.env.RESEND_VERIFIED_DOMAIN)).toLowerCase();
  if (flag === "false" || flag === "0") return false;
  if (flag === "true" || flag === "1") return true;
  // Ако изрично е зададен собствен подател извън resend.dev, домейнът е предвиден за реално изпращане
  return Boolean(cleanEnv(process.env.EMAIL_FROM)) && !isUsingSandboxSender();
}

/** Публичният адрес на сайта (за линковете в писмата, sitemap и картинката при споделяне). */
export function getBaseAppUrl(): string {
  const customUrl = cleanEnv(process.env.NEXT_PUBLIC_APP_URL);
  if (customUrl && !customUrl.includes("localhost")) {
    return customUrl.replace(/\/$/, "");
  }
  const prodUrl = cleanEnv(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  if (prodUrl) {
    return `https://${prodUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}`;
  }
  const vercelUrl = cleanEnv(process.env.VERCEL_URL);
  if (vercelUrl) {
    return `https://${vercelUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}`;
  }
  return process.env.NODE_ENV === "production" ? "https://detski-ai-asistent-s56y.vercel.app" : "http://localhost:3000";
}

/**
 * Безопасен получател. В тестовия режим на Resend (без верифициран домейн) писма могат да
 * отидат само до собственика на профила в Resend — затова в production писмото се пропуска
 * (не препращаме лични писма на учители към чужд адрес), а локално отива до администратора.
 */
export function resolveSafeRecipient(intendedEmail: string): { targetEmail: string; isSandboxed: boolean; shouldSkip: boolean } {
  const verified = isResendDomainVerified() && !isUsingSandboxSender();
  if (verified) return { targetEmail: intendedEmail.trim(), isSandboxed: false, shouldSkip: false };
  if (process.env.NODE_ENV === "production") {
    console.warn(`[email] Домейнът в Resend не е потвърден (from=${EMAIL_CONFIG.from}) — писмото до ${maskEmail(intendedEmail)} се пропуска.`);
    return { targetEmail: "", isSandboxed: true, shouldSkip: true };
  }
  return { targetEmail: EMAIL_CONFIG.adminNotificationEmail, isSandboxed: true, shouldSkip: false };
}

/** Имейлът работи ли изобщо (ключ + потвърден домейн извън resend.dev) — страницата „Забравена парола“ го показва. */
export function isEmailDeliveryReady(): boolean {
  if (!getResendApiKey()) return false;
  if (process.env.NODE_ENV !== "production") return true;
  return isResendDomainVerified() && !isUsingSandboxSender();
}

export function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
