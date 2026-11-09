import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/team-admin";

const Body = z.object({ open: z.boolean() });

/** „Приемане на нови учители“: директорът затваря регистрацията, когато екипът е пълен, и я отваря при нов колега. */
export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Невалидни данни." }, { status: 400 });
  const kg = await prisma.kindergarten.update({
    where: { id: auth.me.kindergartenId },
    data: { teacherSignupOpen: parsed.data.open },
    select: { teacherSignupOpen: true },
  });
  return NextResponse.json({ open: kg.teacherSignupOpen });
}
