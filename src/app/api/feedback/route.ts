import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { EMAIL_CONFIG, escapeHtml, getResendApiKey } from "@/lib/email/config";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { getSession } from "@/lib/auth/session";

// По модела на МатураПлюс (src/app/api/feedback/route.ts). Разлика: съобщението се пази в базата
// (таблица Feedback), така че нищо не се губи без Resend; писмо до администратора — ако има ключ.

export const runtime = "nodejs";

const TYPE_LABELS = { praise: "Харесва ми", idea: "Идея или предложение", bug: "Грешка или проблем" } as const;
const TYPE_DB = { praise: "PRAISE", idea: "IDEA", bug: "BUG" } as const;

const feedbackSchema = z.object({
  type: z.enum(["praise", "idea", "bug"], { errorMap: () => ({ message: "Изберете за какво пишете." }) }),
  rating: z
    .number({ required_error: "Изберете оценка от 1 до 5 звезди.", invalid_type_error: "Изберете оценка от 1 до 5 звезди." })
    .int()
    .min(1, "Изберете оценка от 1 до 5 звезди.")
    .max(5, "Изберете оценка от 1 до 5 звезди."),
  message: z
    .string({ required_error: "Напишете съобщението си." })
    .trim()
    .min(5, "Съобщението трябва да е поне 5 символа.")
    .max(2000, "Съобщението не може да е над 2000 символа."),
  email: z.string().trim().max(120).email("Въведете валиден имейл или оставете полето празно.").optional().or(z.literal("")),
  page: z.string().trim().max(200).optional(),
  // Скрито поле (honeypot) срещу ботове
  website: z.string().optional(),
});

const THANK_YOU = "Благодарим! Съобщението ви е получено и ще го прочетем.";

export async function POST(request: Request) {
  const rate = await checkRateLimit(`feedback:${getClientIp(request)}`, 10);
  if (!rate.allowed) {
    return NextResponse.json({ error: `Твърде много съобщения. Опитайте пак след ${rate.resetInSeconds} секунди.` }, { status: 429 });
  }

  const parsed = feedbackSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Невалидни данни." }, { status: 400 });
  }
  const { type, rating, message, email, page, website } = parsed.data;

  // Honeypot: ботът вижда „успех“, но нищо не се записва
  if (website && website.trim()) return NextResponse.json({ ok: true, message: THANK_YOU });

  const session = await getSession().catch(() => null);

  try {
    await prisma.feedback.create({
      data: { type: TYPE_DB[type], rating, message, email: email || null, page: page || null, userId: session?.userId ?? null },
    });
  } catch (err) {
    console.error("[feedback] Записът не успя:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: `Съобщението не беше изпратено. Опитайте отново или пишете на ${EMAIL_CONFIG.supportEmail}.` }, { status: 502 });
  }

  // Срок на съхранение по политиката за поверителност: обратната връзка и имейлът в нея — до две години
  const TWO_YEARS_MS = 2 * 365 * 24 * 60 * 60 * 1000;
  await prisma.feedback
    .deleteMany({ where: { createdAt: { lt: new Date(Date.now() - TWO_YEARS_MS) } } })
    .catch((err) => console.warn("[feedback] Старите съобщения не бяха изтрити:", err instanceof Error ? err.message : err));

  const apiKey = getResendApiKey();
  if (apiKey) {
    const stars = "★".repeat(rating) + "☆".repeat(5 - rating);
    const sender = session ? `Учител (профил ${session.userId})` : "Гост (без вход)";
    const html = `
<!DOCTYPE html>
<html lang="bg">
<body style="margin:0;padding:24px;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:24px;">
    <p style="margin:0 0 4px;font-size:12px;color:#475569;">Обратна връзка · Учителски облак на ДГ „Пролет“</p>
    <h1 style="margin:0 0 16px;font-size:20px;">${escapeHtml(TYPE_LABELS[type])} · <span style="color:#b45309;">${stars}</span></h1>
    <table style="width:100%;font-size:13px;border-collapse:collapse;margin-bottom:16px;">
      <tr><td style="padding:4px 0;color:#475569;width:120px;">Подател</td><td>${escapeHtml(sender)}</td></tr>
      <tr><td style="padding:4px 0;color:#475569;">Имейл</td><td>${email ? escapeHtml(email) : "—"}</td></tr>
      <tr><td style="padding:4px 0;color:#475569;">Страница</td><td>${page ? escapeHtml(page) : "—"}</td></tr>
    </table>
    <div style="white-space:pre-wrap;font-size:14px;line-height:1.6;background:#f1f5f9;border-radius:8px;padding:16px;">${escapeHtml(message)}</div>
  </div>
</body>
</html>`.trim();
    try {
      const { error } = await new Resend(apiKey).emails.send({
        from: EMAIL_CONFIG.from,
        to: EMAIL_CONFIG.adminNotificationEmail,
        ...(email ? { replyTo: email } : {}),
        subject: `[ДГ „Пролет“] ${TYPE_LABELS[type]} · ${rating}/5`,
        html,
      });
      if (error) console.warn("[feedback] Resend грешка:", error);
    } catch (err) {
      // Съобщението вече е в базата — писмото е само известие
      console.warn("[feedback] Писмото не беше изпратено:", err instanceof Error ? err.message : err);
    }
  }

  // Без съдържание и имейл в логовете — само вида и оценката
  console.log(`[feedback] Получено: ${type}, ${rating}/5`);
  return NextResponse.json({ ok: true, message: THANK_YOU });
}
