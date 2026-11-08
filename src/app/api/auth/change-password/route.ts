import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ChangePasswordSchema } from "@/lib/auth/schemas";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, getSession, passwordVersion } from "@/lib/auth/session";
import { revokeEmailTokens } from "@/lib/auth/email-tokens";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { AUTH_REQUIRED } from "@/lib/teacher";

/**
 * Смяна на паролата от профила. Новата парола сменя отпечатъка (pv) в сесията — входовете
 * на други устройства спират да важат, а текущият получава нова бисквитка.
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json(AUTH_REQUIRED, { status: 401 });

  const rate = await checkRateLimit(`change-password:${session.userId}:${getClientIp(request)}`, 10);
  if (!rate.allowed) return NextResponse.json({ error: "Твърде много опити. Опитайте пак след малко." }, { status: 429 });

  const parsed = ChangePasswordSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Моля, проверете въведените данни." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { passwordHash: true } });
  if (!user || !(await verifyPassword(parsed.data.currentPassword, user.passwordHash))) {
    return NextResponse.json({ error: "Сегашната парола не е вярна." }, { status: 400 });
  }
  if (parsed.data.currentPassword === parsed.data.newPassword) {
    return NextResponse.json({ error: "Новата парола трябва да е различна от сегашната." }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: session.userId },
    data: { passwordHash: await hashPassword(parsed.data.newPassword), mustChangePassword: false },
    select: { id: true, email: true, name: true, passwordHash: true },
  });
  await revokeEmailTokens("reset", updated.id);
  await createSession({ userId: updated.id, email: updated.email, name: updated.name, pv: passwordVersion(updated.passwordHash) });

  return NextResponse.json({ ok: true });
}
