import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Списък с разрешени имейли: директорът въвежда имейлите на учителите. Докато списъкът е празен,
 * регистрацията е с кода на градината (както преди). Щом има поне един имейл, списъкът е вратата:
 * учител без имейл в него не може да се регистрира, да влезе или да остане вписан. Директорите
 * (администраторите) имат достъп винаги — за да не може градината да остане без управление.
 */

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

/** Колко имейла има в списъка (0 — списъкът не е включен). */
export function allowlistSize(kindergartenId: string): Promise<number> {
  return prisma.allowedEmail.count({ where: { kindergartenId } });
}

/** Има ли достъп учител с този имейл: списъкът не е включен или имейлът е в него. */
export async function emailHasAccess(kindergartenId: string, email: string): Promise<boolean> {
  const [size, found] = await Promise.all([
    allowlistSize(kindergartenId),
    prisma.allowedEmail.findUnique({ where: { kindergartenId_email: { kindergartenId, email: normalizeEmail(email) } }, select: { id: true } }),
  ]);
  return size === 0 || !!found;
}

/** Достъп за вече регистриран профил: директорите винаги, учителите — по списъка. */
export async function userHasAccess(user: { email: string; kgRole: string; kindergartenId: string | null }): Promise<boolean> {
  if (!user.kindergartenId || user.kgRole === "ADMIN") return true;
  return emailHasAccess(user.kindergartenId, user.email);
}

export const NOT_ALLOWED_MESSAGE = "Този имейл не е в списъка на градината. Обърнете се към директора.";
export const ACCESS_STOPPED_MESSAGE = "Достъпът с този имейл е спрян. Обърнете се към директора.";
