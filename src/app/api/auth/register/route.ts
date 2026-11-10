import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RegisterSchema } from "@/lib/auth/schemas";
import { hashPassword } from "@/lib/auth/password";
import { createSession, passwordVersion } from "@/lib/auth/session";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { normalizeJoinCode } from "@/lib/auth/utils";
import { KG } from "@/config/kindergarten";
import { NOT_ALLOWED_MESSAGE, allowlistSize } from "@/lib/allowed-emails";
import { firstAdminAllowed, setupCodeConfigured } from "@/lib/auth/setup-code";

// По модела на МатураПлюс (src/app/api/auth/register/route.ts): лимит по IP, Zod, bcrypt,
// транзакция и обработка на P2002 (едновременна регистрация със същия имейл).
// Облакът е само на ДГ „Пролет“: всеки нов профил влиза в нея. Първият профил става
// администратор без код; след това регистрацията изисква кода на градината.

/** Градината (създава се от миграция 3_dg_prolet; тук — резервно, ако я няма). */
async function ensureKindergarten() {
  const existing = await prisma.kindergarten.findUnique({ where: { id: KG.id } });
  if (existing) return existing;
  const { generateJoinCode } = await import("@/lib/auth/utils");
  return prisma.kindergarten.upsert({
    where: { id: KG.id },
    update: {},
    create: { id: KG.id, name: KG.name, city: KG.village, joinCode: generateJoinCode() },
  });
}

/**
 * Нужен ли е код (не — докато в градината няма нито един учител или когато директорът ползва списък
 * с разрешени имейли) и дали облакът приема нови учители (директорът затваря регистрацията, когато
 * екипът е пълен; първият профил — винаги; при списък — винаги, вратата е списъкът).
 */
export async function GET() {
  const kg = await ensureKindergarten();
  const [members, listed] = await Promise.all([prisma.user.count({ where: { kindergartenId: kg.id } }), allowlistSize(kg.id)]);
  const byEmail = members > 0 && listed > 0;
  // Първият профил (директорът) — с тайната дума от настройките на сървъра
  const setup = members === 0;
  return NextResponse.json(
    {
      needsCode: setup || !byEmail,
      open: setup ? setupCodeConfigured() || process.env.NODE_ENV !== "production" : byEmail || kg.teacherSignupOpen,
      byEmail,
      setup,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  const ip = getClientIp(request);

  // Цял учителски екип може да се регистрира от една мрежа в градината (общ IP)
  const rate = await checkRateLimit(`register:${ip}`, 30);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: `Твърде много опити за регистрация. Опитайте пак след ${rate.resetInSeconds} секунди.` },
      { status: 429 },
    );
  }

  const parsed = RegisterSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Моля, проверете въведените данни." }, { status: 400 });
  }
  const data = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    return NextResponse.json({ error: "Профил с този имейл вече съществува." }, { status: 409 });
  }

  const kg = await ensureKindergarten();
  const passwordHash = await hashPassword(data.password);

  let user;
  try {
    user = await prisma.$transaction(async (tx) => {
      // Проверката е в транзакцията: двама „първи“ едновременно не стават и двамата администратори
      const members = await tx.user.count({ where: { kindergartenId: kg.id } });
      const isFirst = members === 0;
      // Само който знае тайната дума от настройките, може да стане първият директор
      if (isFirst && !firstAdminAllowed(data.joinCode)) throw new Error("SETUP");
      if (!isFirst) {
        const listed = await tx.allowedEmail.count({ where: { kindergartenId: kg.id } });
        if (listed > 0) {
          // Списъкът е вратата: кодът и „Приемане на нови учители“ не се гледат
          const allowed = await tx.allowedEmail.findUnique({ where: { kindergartenId_email: { kindergartenId: kg.id, email: data.email } } });
          if (!allowed) throw new Error("NOT_ALLOWED");
        } else {
          const current = await tx.kindergarten.findUnique({ where: { id: kg.id }, select: { teacherSignupOpen: true, joinCode: true } });
          if (!current?.teacherSignupOpen) throw new Error("CLOSED");
          if (normalizeJoinCode(data.joinCode ?? "") !== current.joinCode) throw new Error("BAD_CODE");
        }
      }
      return tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          name: data.name,
          jobTitle: data.jobTitle || (isFirst ? "Директор" : "Учител"),
          avatar: data.avatar || "👩‍🏫",
          ageGroup: data.ageGroup,
          groupName: data.groupName ?? "",
          kgRole: isFirst ? "ADMIN" : "TEACHER",
          kindergartenId: kg.id,
        },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "SETUP") {
      return NextResponse.json(
        { error: "Първоначалният код не е верен. Той е в настройките на сайта и го знае само директорът.", code: "SETUP" },
        { status: 403 },
      );
    }
    if (error instanceof Error && error.message === "NOT_ALLOWED") {
      return NextResponse.json({ error: NOT_ALLOWED_MESSAGE, code: "NOT_ALLOWED" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "CLOSED") {
      return NextResponse.json(
        { error: `Регистрацията на нови учители в ${KG.name} е затворена. Ако сте нов колега, обърнете се към директора.`, code: "SIGNUP_CLOSED" },
        { status: 403 },
      );
    }
    if (error instanceof Error && error.message === "BAD_CODE") {
      return NextResponse.json(
        { error: `Кодът не е верен. Поискайте кода на ${KG.name} от администратора на облака.` },
        { status: 403 },
      );
    }
    if ((error as { code?: string } | null)?.code === "P2002") {
      return NextResponse.json({ error: "Профил с този имейл вече съществува." }, { status: 409 });
    }
    console.error("[auth] register failed:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Регистрацията не успя. Моля, опитайте отново след малко." }, { status: 500 });
  }

  await createSession({ userId: user.id, email: user.email, name: user.name, pv: passwordVersion(user.passwordHash) });

  return NextResponse.json({ ok: true, redirectUrl: "/", admin: user.kgRole === "ADMIN" }, { status: 201 });
}
