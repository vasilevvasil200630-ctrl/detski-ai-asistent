import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RegisterSchema } from "@/lib/auth/schemas";
import { hashPassword } from "@/lib/auth/password";
import { createSession, passwordVersion } from "@/lib/auth/session";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { generateJoinCode, normalizeJoinCode } from "@/lib/auth/utils";

// По модела на МатураПлюс (src/app/api/auth/register/route.ts): лимит по IP, Zod, bcrypt,
// транзакция и обработка на P2002 (едновременна регистрация със същия имейл).
// Добавено: създаване на детска градина или присъединяване към нея с код.

export async function POST(request: Request) {
  const ip = getClientIp(request);

  // Цял учителски екип може да се регистрира от една мрежа в градината (общ IP)
  const rate = await checkRateLimit(`register:${ip}`, 30);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: `Твърде много опити за регистрация. Опитай пак след ${rate.resetInSeconds} секунди.` },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Невалидно тяло на заявката." }, { status: 400 });
  }

  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]?.message ?? "Моля, провери въведените данни.";
    return NextResponse.json({ error: firstError }, { status: 400 });
  }
  const data = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    return NextResponse.json({ error: "Профил с този имейл вече съществува." }, { status: 409 });
  }

  let kindergartenId: string;
  let kgRole: "ADMIN" | "TEACHER" = "TEACHER";

  if (data.mode === "join") {
    const kg = await prisma.kindergarten.findUnique({ where: { joinCode: normalizeJoinCode(data.joinCode ?? "") } });
    if (!kg) {
      return NextResponse.json(
        { error: "Няма детска градина с този код. Провери го при колегата, който те е поканил." },
        { status: 404 },
      );
    }
    kindergartenId = kg.id;
  } else {
    let joinCode: string | null = null;
    for (let attempt = 0; attempt < 10 && !joinCode; attempt++) {
      const candidate = generateJoinCode();
      const clash = await prisma.kindergarten.findUnique({ where: { joinCode: candidate } });
      if (!clash) joinCode = candidate;
    }
    if (!joinCode) {
      return NextResponse.json({ error: "Временен проблем. Моля, опитай отново." }, { status: 503 });
    }
    kindergartenId = "";
    kgRole = "ADMIN";
    // Градината се създава в транзакцията по-долу заедно с профила
    data.joinCode = joinCode;
  }

  const passwordHash = await hashPassword(data.password);

  let user;
  try {
    user = await prisma.$transaction(async (tx) => {
      if (data.mode === "create") {
        const kg = await tx.kindergarten.create({
          data: {
            name: data.kgName!,
            city: data.kgCity ?? "",
            motto: data.kgMotto ?? "",
            joinCode: data.joinCode!,
          },
        });
        kindergartenId = kg.id;
      }
      return tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          name: data.name,
          jobTitle: data.jobTitle || "Учител",
          avatar: data.avatar || "👩‍🏫",
          ageGroup: data.ageGroup,
          groupName: data.groupName ?? "",
          kgRole,
          kindergartenId,
        },
      });
    });
  } catch (error) {
    if ((error as { code?: string } | null)?.code === "P2002") {
      return NextResponse.json({ error: "Профил с този имейл вече съществува." }, { status: 409 });
    }
    console.error("[auth] register failed:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Регистрацията не успя. Моля, опитай отново след малко." }, { status: 500 });
  }

  await createSession({ userId: user.id, email: user.email, name: user.name, pv: passwordVersion(user.passwordHash) });

  return NextResponse.json({ ok: true, redirectUrl: "/hub" }, { status: 201 });
}
