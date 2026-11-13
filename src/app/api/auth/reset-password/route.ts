import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ResetPasswordSchema } from "@/lib/auth/schemas";
import { consumeEmailToken, peekEmailToken, revokeEmailTokens } from "@/lib/auth/email-tokens";
import { hashPassword } from "@/lib/auth/password";
import { createSession, passwordVersion } from "@/lib/auth/session";
import { clearFailedLogins } from "@/lib/auth/rate-limit";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// Копирано от МатураПлюс (src/app/api/auth/reset-password/route.ts).

const INVALID_LINK = "Линкът е невалиден или е изтекъл (важи 1 час и само веднъж). Заявете нов от „Забравена парола“.";

/** Проверка на линка, преди да се покаже формата за нова парола. Не го изразходва. */
export async function GET(request: Request) {
  const rate = await checkRateLimit(`reset-password:${getClientIp(request)}`, 20);
  if (!rate.allowed) return NextResponse.json({ error: "Твърде много опити. Опитайте пак след малко." }, { status: 429 });
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const userId = await peekEmailToken("reset", token);
  if (!userId) return NextResponse.json({ error: INVALID_LINK }, { status: 400 });
  return NextResponse.json({ valid: true });
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rate = await checkRateLimit(`reset-password:${ip}`, 20);
  if (!rate.allowed) return NextResponse.json({ error: "Твърде много опити. Опитайте пак след малко." }, { status: 429 });

  const parsed = ResetPasswordSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Моля, проверете въведените данни." }, { status: 400 });
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const userId = await consumeEmailToken("reset", parsed.data.token);
  if (!userId) return NextResponse.json({ error: INVALID_LINK }, { status: 400 });

  const exists = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!exists) return NextResponse.json({ error: INVALID_LINK }, { status: 400 });

  // Новата парола анулира всички стари сесии (отпечатъкът на паролата в тях вече не съвпада)
  const user = await prisma.user.update({
    where: { id: userId },
    data: { passwordHash, mustChangePassword: false },
    select: { id: true, email: true, name: true, passwordHash: true },
  });
  await revokeEmailTokens("reset", user.id);
  await clearFailedLogins(ip, user.email);
  await createSession({ userId: user.id, email: user.email, name: user.name, pv: passwordVersion(user.passwordHash) });

  return NextResponse.json({ ok: true, redirectUrl: "/" });
}
