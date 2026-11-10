import "server-only";
import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

/**
 * Копирано от МатураПлюс (src/lib/auth/email-tokens.ts): еднократни линкове по имейл.
 * Пазят се в VerificationToken само като SHA-256 — изтекла база не дава работещи линкове.
 * `identifier` = "<цел>:<userId>"; нов линк анулира предишните.
 */
export type EmailTokenPurpose = "reset";

export const EMAIL_TOKEN_TTL_MS: Record<EmailTokenPurpose, number> = {
  reset: 60 * 60 * 1000, // 1 час
};

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

function identifierFor(purpose: EmailTokenPurpose, userId: string): string {
  return `${purpose}:${userId}`;
}

/** Създава нов линк-токен (предишните за същата цел и потребител спират да важат). */
export async function createEmailToken(purpose: EmailTokenPurpose, userId: string): Promise<string> {
  const raw = randomBytes(32).toString("base64url");
  const identifier = identifierFor(purpose, userId);
  await prisma.$transaction([
    prisma.verificationToken.deleteMany({ where: { identifier } }),
    // Изтеклите линкове на всички потребители не се пазят (срок на съхранение по политиката)
    prisma.verificationToken.deleteMany({ where: { expires: { lt: new Date() } } }),
    prisma.verificationToken.create({
      data: { identifier, token: hashToken(raw), expires: new Date(Date.now() + EMAIL_TOKEN_TTL_MS[purpose]) },
    }),
  ]);
  return raw;
}

async function findValid(purpose: EmailTokenPurpose, raw: string) {
  if (!raw || raw.length > 200) return null;
  const record = await prisma.verificationToken.findUnique({ where: { token: hashToken(raw) } });
  if (!record || !record.identifier.startsWith(`${purpose}:`)) return null;
  if (record.expires.getTime() < Date.now()) {
    await prisma.verificationToken.deleteMany({ where: { token: record.token } });
    return null;
  }
  return record;
}

/** Проверява линка, без да го изразходва (за да се покаже формата за нова парола). */
export async function peekEmailToken(purpose: EmailTokenPurpose, raw: string): Promise<string | null> {
  const record = await findValid(purpose, raw);
  return record ? record.identifier.slice(purpose.length + 1) : null;
}

/**
 * Изразходва линка и връща userId. Изтриването е условието за успех — два едновременни
 * опита с един и същ линк не могат да минат и двата.
 */
export async function consumeEmailToken(purpose: EmailTokenPurpose, raw: string): Promise<string | null> {
  const record = await findValid(purpose, raw);
  if (!record) return null;
  const { count } = await prisma.verificationToken.deleteMany({ where: { token: record.token } });
  return count === 1 ? record.identifier.slice(purpose.length + 1) : null;
}

/** Анулира всички линкове с дадена цел за потребителя (напр. след смяна на паролата). */
export async function revokeEmailTokens(purpose: EmailTokenPurpose, userId: string): Promise<void> {
  await prisma.verificationToken.deleteMany({ where: { identifier: identifierFor(purpose, userId) } });
}
