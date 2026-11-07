import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ForgotPasswordSchema } from "@/lib/auth/schemas";
import { createEmailToken } from "@/lib/auth/email-tokens";
import { sendPasswordResetEmail } from "@/lib/email/send-auth-email";
import { checkRateLimit, checkWindowedLimit, getClientIp } from "@/lib/rate-limit";
import { isEmailDeliveryReady, maskEmail } from "@/lib/email/config";

// Копирано от МатураПлюс (src/app/api/auth/forgot-password/route.ts).

// Еднакъв отговор, независимо дали има профил с този имейл
const GENERIC_OK = {
  ok: true,
  message: "Ако има профил с този имейл, до минута ще получите писмо с линк за нова парола. Проверете и папка „Спам“.",
};

/** Дали изпращането на писма е настроено — страницата показва друг текст, ако не е. */
export async function GET() {
  return NextResponse.json({ emailReady: isEmailDeliveryReady() });
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rate = await checkRateLimit(`forgot-password:${ip}`, 10);
  if (!rate.allowed) {
    return NextResponse.json({ error: `Твърде много опити. Опитайте пак след ${rate.resetInSeconds} секунди.` }, { status: 429 });
  }

  const parsed = ForgotPasswordSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Моля, въведете валиден имейл адрес." }, { status: 400 });
  }
  const { email } = parsed.data;

  // Най-много 3 писма на час към един адрес — без да издаваме, че лимитът е достигнат
  const perEmail = await checkWindowedLimit(`forgot-password:${email}`, 3, "1 h");
  if (!perEmail.allowed) {
    console.warn(`[auth] forgot-password email limit hit email=${maskEmail(email)}`);
    return NextResponse.json(GENERIC_OK);
  }

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true, name: true } });
  if (!user) return NextResponse.json(GENERIC_OK);

  try {
    const token = await createEmailToken("reset", user.id);
    const result = await sendPasswordResetEmail({ email: user.email, name: user.name, token });
    if (!result.success) {
      console.warn(`[auth] forgot-password email not sent email=${maskEmail(email)} skipped=${Boolean(result.skipped)}`);
    }
  } catch (error) {
    console.error("[auth] forgot-password failed:", error instanceof Error ? error.message : error);
  }

  return NextResponse.json(GENERIC_OK);
}
