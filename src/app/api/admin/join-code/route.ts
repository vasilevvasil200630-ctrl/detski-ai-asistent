import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateJoinCode } from "@/lib/auth/utils";
import { requireAdmin } from "@/lib/team-admin";

/** Нов код за регистрация — старият спира да важи (напр. ако е стигнал до външен човек). */
export async function POST() {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const kg = await prisma.kindergarten.update({
        where: { id: auth.me.kindergartenId },
        data: { joinCode: generateJoinCode() },
        select: { joinCode: true },
      });
      return NextResponse.json({ joinCode: kg.joinCode });
    } catch (error) {
      // P2002: същият код вече е зает (почти невъзможно) — нов опит
      if ((error as { code?: string } | null)?.code !== "P2002") throw error;
    }
  }
  return NextResponse.json({ error: "Не успях да създам нов код. Опитайте пак." }, { status: 500 });
}
