import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { KG } from "@/config/kindergarten";
import { ForgotPasswordSchema } from "@/lib/auth/schemas";
import { createEmailToken, revokeEmailTokens } from "@/lib/auth/email-tokens";
import { sendPasswordResetEmail, sendRegistrationHintEmail } from "@/lib/email/send-auth-email";
import { checkRateLimit, checkWindowedLimit, getClientIp } from "@/lib/rate-limit";
import { isEmailDeliveryReady, maskEmail } from "@/lib/email/config";
import { userHasAccess } from "@/lib/allowed-emails";

// Копирано от МатураПлюс (src/app/api/auth/forgot-password/route.ts), надградено с проверка
// за ненастроена поща, реален отчет при грешка от доставчика и насочващо писмо за колега от
// списъка „Разрешени имейли“, която още не си е създала профил.

export const runtime = "nodejs";

// Еднакъв отговор при успешно обработена заявка, независимо дали има профил с този имейл
const GENERIC_OK = {
  ok: true,
  message: "Ако има профил с този имейл, до минута ще получите писмо с линк за нова парола. Проверете и папка „Спам“.",
};

const EMAIL_NOT_CONFIGURED =
  "Изпращането на писма още не е включено. Обърнете се към директора: от „Управление на екипа“ може веднага да ви бъде дадена временна парола.";

const EMAIL_SEND_FAILED =
  "Писмото не можа да бъде изпратено заради технически проблем с пощенската услуга. Опитайте пак след малко или помолете директора за временна парола от „Управление на екипа“.";

/** Дали изпращането на писма е настроено — страницата показва друг текст, ако не е. */
export async function GET() {
  return NextResponse.json({ emailReady: isEmailDeliveryReady() }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rate = await checkRateLimit(`forgot-password:${ip}`, 10);
  if (!rate.allowed) {
    return NextResponse.json({ error: `Твърде много опити. Опитайте пак след ${rate.resetInSeconds} секунди.` }, { status: 429 });
  }

  const parsed = ForgotPasswordSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Моля, въведете валиден имейл адрес." }, { status: 400 });
  }
  const { email } = parsed.data;

  // Преди базата и лимита по адрес: ако пощата изобщо не е настроена, не подвеждаме учителя със зелен банер
  if (!isEmailDeliveryReady()) {
    return NextResponse.json({ error: EMAIL_NOT_CONFIGURED }, { status: 503 });
  }

  // Най-много 3 писма на час към един адрес — без да издаваме, че лимитът е достигнат
  const perEmail = await checkWindowedLimit(`forgot-password:${email}`, 3, "1 h");
  if (!perEmail.allowed) {
    console.warn(`[auth] forgot-password email limit hit email=${maskEmail(email)}`);
    return NextResponse.json(GENERIC_OK);
  }

  const user =
    (await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, kgRole: true, kindergartenId: true, removedAt: true },
    })) ??
    (await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true, email: true, name: true, kgRole: true, kindergartenId: true, removedAt: true },
    }));

  if (!user) {
    // Ако директорът е добавил имейла в „Разрешени имейли“, но колежката още не се е регистрирала,
    // пращаме ѝ любезно писмо с директен линк към „Регистрация“.
    try {
      const allowed = await prisma.allowedEmail.findUnique({
        where: { kindergartenId_email: { kindergartenId: KG.id, email } },
        select: { id: true },
      });
      if (allowed) {
        const invite = await sendRegistrationHintEmail({ email });
        if (!invite.success) {
          console.error(`[auth] forgot-password registration hint failed email=${maskEmail(email)} err=${invite.error ?? "skipped"}`);
          return NextResponse.json({ error: EMAIL_SEND_FAILED }, { status: 502 });
        }
      }
    } catch (error) {
      console.error("[auth] forgot-password allowlist check failed:", error instanceof Error ? error.message : error);
    }
    return NextResponse.json(GENERIC_OK);
  }

  // Премахнат от екипа или изваден от списъка с разрешени имейли профил няма активен достъп
  if (user.removedAt || !(await userHasAccess(user))) {
    return NextResponse.json(GENERIC_OK);
  }

  try {
    const token = await createEmailToken("reset", user.id);
    const result = await sendPasswordResetEmail({ email: user.email, name: user.name, token });
    if (!result.success) {
      await revokeEmailTokens("reset", user.id).catch(() => {});
      console.error(
        `[auth] forgot-password email not sent email=${maskEmail(email)} skipped=${Boolean(result.skipped)} error=${result.error ?? "unknown"}`,
      );
      return NextResponse.json({ error: EMAIL_SEND_FAILED }, { status: 502 });
    }
  } catch (error) {
    console.error("[auth] forgot-password failed:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: EMAIL_SEND_FAILED }, { status: 502 });
  }

  return NextResponse.json(GENERIC_OK);
}
