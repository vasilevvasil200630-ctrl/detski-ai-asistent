import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { AUTH_REQUIRED } from "@/lib/teacher";
import { findVisibleMaterial } from "@/lib/material-access";

/** Харесване / отказ от харесване на материал, който виждам. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json(AUTH_REQUIRED, { status: 401 });
  const { id } = await params;

  const material = await findVisibleMaterial(id, session.userId, { anyKindergartenGames: true });
  if (!material) return NextResponse.json({ error: "Материалът не е намерен." }, { status: 404 });

  const key = { userId_materialId: { userId: session.userId, materialId: id } };
  const existing = await prisma.materialLike.findUnique({ where: key });
  if (existing) await prisma.materialLike.delete({ where: key });
  else await prisma.materialLike.create({ data: { userId: session.userId, materialId: id } });

  const likes = await prisma.materialLike.count({ where: { materialId: id } });
  return NextResponse.json({ likedByMe: !existing, likes });
}
