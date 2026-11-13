import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ProfileUpdateSchema } from "@/lib/auth/schemas";
import { getSession } from "@/lib/auth/session";
import { AUTH_REQUIRED, TEACHER_SELECT } from "@/lib/teacher";

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json(AUTH_REQUIRED, { status: 401 });

  const parsed = ProfileUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Невалидни данни." }, { status: 400 });
  }
  const user = await prisma.user.update({ where: { id: session.userId }, data: parsed.data, select: TEACHER_SELECT });
  return NextResponse.json({ user });
}
