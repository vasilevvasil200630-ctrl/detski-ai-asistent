import "server-only";
import { cookies } from "next/headers";
import { createHmac } from "crypto";
import { SignJWT, jwtVerify } from "jose";

// Копирано от МатураПлюс (src/lib/auth/session.ts): подписана JWT бисквитка (jose, HS256),
// отпечатък на паролата (pv) за анулиране на стари сесии и проверка срещу базата при всяко четене.
// Разлика: без NextAuth/Google и без ролите ученик/родител.

const SESSION_COOKIE = "detski_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export type SessionPayload = {
  userId: string;
  email: string;
  name?: string | null;
  /** Отпечатък на паролата към момента на входа (виж passwordVersion). */
  pv?: string | null;
};

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET липсва или е под 32 символа. Генерирай с: openssl rand -base64 32",
    );
  }
  return new TextEncoder().encode(secret);
}

/**
 * Кратък отпечатък на паролата (HMAC, не самият хеш). Записва се в сесията при вход;
 * смяна на паролата го променя и всички стари сесии спират да важат.
 */
export function passwordVersion(passwordHash: string | null | undefined): string {
  return createHmac("sha256", process.env.SESSION_SECRET ?? "")
    .update(`detski-pv:v1:${passwordHash ?? ""}`)
    .digest("base64url")
    .slice(0, 16);
}

export async function encryptSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({
    userId: payload.userId,
    email: payload.email,
    name: payload.name ?? null,
    ...(payload.pv ? { pv: payload.pv } : {}),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecret());
}

export async function decryptSession(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
    });
    if (typeof payload.userId !== "string" || typeof payload.email !== "string") {
      return null;
    }
    return {
      userId: payload.userId,
      email: payload.email,
      name: (payload.name as string) || null,
      pv: typeof payload.pv === "string" ? payload.pv : null,
    };
  } catch {
    return null;
  }
}

export async function createSession(
  payload: SessionPayload,
  options: { persistent?: boolean } = {},
): Promise<void> {
  const token = await encryptSession(payload);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    // „Запомни ме“ изключено → бисквитка до затваряне на браузъра
    ...(options.persistent === false ? {} : { maxAge: SESSION_MAX_AGE_SECONDS }),
    path: "/",
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  const decrypted = await decryptSession(token);
  if (!decrypted) return null;

  // Изтрит профил или сменена парола → сесията вече не важи.
  try {
    const { prisma } = await import("@/lib/prisma");
    const dbUser = await prisma.user.findUnique({
      where: { id: decrypted.userId },
      select: { email: true, name: true, passwordHash: true },
    });
    if (!dbUser) return null;
    if (decrypted.pv && decrypted.pv !== passwordVersion(dbUser.passwordHash)) return null;
    return { userId: decrypted.userId, email: dbUser.email, name: dbUser.name };
  } catch {
    // Базата е недостъпна — подписаният токен остава валиден (по-добре от изхвърляне от профила)
    return decrypted;
  }
}

export async function deleteSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}
