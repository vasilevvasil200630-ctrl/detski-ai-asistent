import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { LoginSchema } from "@/lib/auth/schemas";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, passwordVersion } from "@/lib/auth/session";
import { ACCESS_STOPPED_MESSAGE, userHasAccess } from "@/lib/allowed-emails";
import { checkLoginRateLimit, recordFailedLogin, clearFailedLogins } from "@/lib/auth/rate-limit";
import { getClientIp } from "@/lib/rate-limit";

// Копирано от МатураПлюс (src/app/api/auth/login/route.ts): обща грешка без изтичане на
// информация кой имейл съществува и лимит от 5 неуспешни опита / 15 мин за (IP, имейл).

const GENERIC_ERROR = "Невалиден имейл или парола.";

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  return `${(local ?? "").slice(0, 2)}***@${domain ?? ""}`;
}

export async function POST(request: Request) {
  const ip = getClientIp(request);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Невалидно тяло на заявката." }, { status: 400 });
  }

  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
  }

  const { email, password, remember } = parsed.data;

  const rl = await checkLoginRateLimit(ip, email);
  if (!rl.allowed) {
    console.warn(`[auth] login rate limit hit ip=${ip} email=${maskEmail(email)}`);
    return NextResponse.json(
      { error: "Твърде много неуспешни опити. Моля, опитай отново след 15 минути." },
      { status: 429, headers: { "Retry-After": String(rl.resetInSeconds) } },
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    await recordFailedLogin(ip, email);
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    await recordFailedLogin(ip, email);
    console.warn(`[auth] failed login (bad password) ip=${ip} email=${maskEmail(email)}`);
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  // Само след вярна парола — иначе би се разбрало кой имейл е в списъка
  if (!(await userHasAccess(user))) {
    return NextResponse.json({ error: ACCESS_STOPPED_MESSAGE }, { status: 403 });
  }

  await clearFailedLogins(ip, email);
  await createSession(
    { userId: user.id, email: user.email, name: user.name, pv: passwordVersion(user.passwordHash) },
    { persistent: remember !== false },
  );

  return NextResponse.json({ ok: true, redirectUrl: "/" });
}
