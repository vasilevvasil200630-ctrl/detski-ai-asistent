import "server-only";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";

/** Публичните полета на учителя, които клиентът вижда (без паролата). */
export const TEACHER_SELECT = {
  id: true,
  email: true,
  name: true,
  avatar: true,
  jobTitle: true,
  ageGroup: true,
  groupName: true,
  kgRole: true,
  kindergarten: { select: { id: true, name: true, city: true, motto: true, joinCode: true } },
} as const;

/** Текущият учител с детската му градина или null за гост. */
export async function getCurrentTeacher() {
  const session = await getSession();
  if (!session) return null;
  return prisma.user.findUnique({ where: { id: session.userId }, select: TEACHER_SELECT });
}

export type CurrentTeacher = NonNullable<Awaited<ReturnType<typeof getCurrentTeacher>>>;

/** Стандартен отговор за заключени действия — клиентът пренасочва към вход (виж api-fetch). */
export const AUTH_REQUIRED = { error: "Влез в профила си, за да продължиш.", code: "AUTH_REQUIRED" } as const;
