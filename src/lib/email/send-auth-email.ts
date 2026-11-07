import "server-only";
import { Resend } from "resend";
import { EMAIL_CONFIG, escapeHtml, getBaseAppUrl, getResendApiKey, maskEmail, resolveSafeRecipient } from "./config";

// По модела на МатураПлюс (src/lib/email/send-auth-email.ts): писмо с еднократен линк за нова парола.

export type AuthEmailResult = { success: boolean; skipped?: boolean; error?: string };

export function buildResetEmailHtml(options: { name?: string | null; url: string; baseUrl: string }): string {
  const greeting = options.name?.trim() ? `Здравейте, ${escapeHtml(options.name.trim())}!` : "Здравейте!";
  return `
<!DOCTYPE html>
<html lang="bg">
<head><meta charset="utf-8"><title>Нова парола — учителски облак на ДГ „Пролет“</title></head>
<body style="margin:0;padding:24px;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
    <tr><td style="padding:32px;">
      <h1 style="margin:0 0 16px 0;font-size:20px;color:#0f172a;">Заявка за нова парола</h1>
      <p style="font-size:15px;line-height:1.6;margin:0 0 12px 0;">${greeting}</p>
      <p style="font-size:15px;line-height:1.6;margin:0 0 16px 0;">Получихме заявка за нова парола за профила ви в учителския облак на ДГ „Пролет“. Натиснете бутона и изберете нова парола.</p>
      <div style="text-align:center;margin:28px 0;">
        <a href="${options.url}" style="display:inline-block;background:#0a4b82;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:13px 32px;border-radius:10px;">Изберете нова парола</a>
      </div>
      <p style="font-size:13px;line-height:1.6;color:#64748b;margin:0 0 12px 0;">
        Ако бутонът не работи, копирайте този адрес в браузъра:<br>
        <span style="word-break:break-all;color:#0a4b82;">${options.url}</span>
      </p>
      <p style="font-size:13px;line-height:1.6;color:#64748b;margin:0;">Линкът важи 1 час и може да се ползва само веднъж. Ако не сте заявявали нова парола, не правете нищо — паролата ви остава същата.</p>
    </td></tr>
    <tr><td style="padding:16px 32px;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;">
      ДГ „Пролет“, с. Ягодово · <a href="${options.baseUrl}" style="color:#64748b;">${options.baseUrl.replace(/^https?:\/\//, "")}</a> · Изпратено автоматично за сигурността на профила ви.
    </td></tr>
  </table>
</body>
</html>`.trim();
}

export async function sendPasswordResetEmail(payload: { email: string; name?: string | null; token: string }): Promise<AuthEmailResult> {
  const baseUrl = getBaseAppUrl();
  const url = `${baseUrl}/reset-password?token=${encodeURIComponent(payload.token)}`;

  const apiKey = getResendApiKey();
  if (!apiKey) {
    // Локално без Resend линкът се вижда в конзолата на сървъра, за да може да се тества
    if (process.env.NODE_ENV !== "production") {
      console.info(`[send-auth-email] (без RESEND_API_KEY) линк за нова парола за ${maskEmail(payload.email)}: ${url}`);
    } else {
      console.warn("[send-auth-email] RESEND_API_KEY не е зададен.");
    }
    return { success: false, error: "Missing RESEND_API_KEY" };
  }

  const { targetEmail, isSandboxed, shouldSkip } = resolveSafeRecipient(payload.email);
  if (shouldSkip || !targetEmail) return { success: false, skipped: true };
  if (isSandboxed) console.log(`[send-auth-email] Тестов режим: писмото за ${maskEmail(payload.email)} отива до ${maskEmail(targetEmail)}.`);

  try {
    const { error } = await new Resend(apiKey).emails.send({
      from: EMAIL_CONFIG.from,
      replyTo: EMAIL_CONFIG.supportEmail,
      to: targetEmail,
      subject: "Нова парола — учителски облак на ДГ „Пролет“",
      html: buildResetEmailHtml({ name: payload.name, url, baseUrl }),
    });
    if (error) {
      console.warn("[send-auth-email] Resend error:", error);
      return { success: false, error: typeof error === "object" ? JSON.stringify(error) : String(error) };
    }
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[send-auth-email] Failed:", message);
    return { success: false, error: message };
  }
}
