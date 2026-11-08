import "server-only";
import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { AUTH_REQUIRED } from "@/lib/teacher";

/**
 * Панелът на директора (администратора на облака): екипът, роли, премахване/връщане,
 * временна парола и нов код за регистрация. Всяко действие е само в своята градина.
 */

/** Временна парола за диктуване по телефона: без двусмислени знаци (0/o, 1/l/i). Напр. „kdm7-pq4x-9tw2“. */
export function generateTempPassword(): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  const group = () => Array.from({ length: 4 }, () => chars[crypto.randomInt(0, chars.length)]).join("");
  return `${group()}-${group()}-${group()}`;
}

/** Парола, която никой не знае — премахнатият учител не може да влезе (и старите сесии спират). */
export function unusablePassword(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export type AdminMe = { id: string; kindergartenId: string };

/** Текущият администратор или готов отговор за грешка. */
export async function requireAdmin(): Promise<{ me: AdminMe } | { response: NextResponse }> {
  const session = await getSession();
  if (!session) return { response: NextResponse.json(AUTH_REQUIRED, { status: 401 }) };
  const me = await prisma.user.findUnique({ where: { id: session.userId }, select: { id: true, kgRole: true, kindergartenId: true } });
  if (!me?.kindergartenId || me.kgRole !== "ADMIN") {
    return { response: NextResponse.json({ error: "Само директорът (администраторът на облака) има достъп." }, { status: 403 }) };
  }
  return { me: { id: me.id, kindergartenId: me.kindergartenId } };
}

export const TEAM_MEMBER_SELECT = {
  id: true,
  name: true,
  email: true,
  avatar: true,
  jobTitle: true,
  ageGroup: true,
  groupName: true,
  kgRole: true,
  mustChangePassword: true,
  createdAt: true,
  removedAt: true,
  _count: { select: { materials: true, cloudFiles: true, notes: true } },
} as const;
