import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { AUTH_REQUIRED } from "@/lib/teacher";
import { MATERIAL_INCLUDE, toSavedMaterial } from "@/lib/materials";
import { findVisibleMaterial } from "@/lib/material-access";

/** Един материал — свой или споделен в моята градина (за изгледа за печат). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json(AUTH_REQUIRED, { status: 401 });
  const { id } = await params;
  const visible = await findVisibleMaterial(id, session.userId, { anyKindergartenGames: true });
  if (!visible) return NextResponse.json({ error: "Материалът не е намерен." }, { status: 404 });
  const [row, like] = await Promise.all([
    prisma.material.findUniqueOrThrow({ where: { id }, include: MATERIAL_INCLUDE }),
    prisma.materialLike.findUnique({ where: { userId_materialId: { userId: session.userId, materialId: id } } }),
  ]);
  return NextResponse.json({ material: toSavedMaterial(row, session.userId, new Set(like ? [id] : [])) });
}

const PatchBody = z.object({
  shared: z.boolean().optional(),
  title: z.string().trim().min(2).max(140).optional(),
  ageGroup: z.enum(["1", "2", "3", "4"]).optional(),
});

/** Само авторът променя своя материал: споделяне/спиране на споделянето, заглавие, група. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json(AUTH_REQUIRED, { status: 401 });
  const { id } = await params;

  const parsed = PatchBody.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Невалидни данни." }, { status: 400 });

  const existing = await prisma.material.findUnique({ where: { id }, select: { authorId: true } });
  if (!existing || existing.authorId !== session.userId) {
    return NextResponse.json({ error: "Материалът не е намерен." }, { status: 404 });
  }

  const data: { title?: string; ageGroup?: string; shared?: boolean; sharedAt?: Date | null; kindergartenId?: string | null } = {};
  if (parsed.data.title) data.title = parsed.data.title;
  if (parsed.data.ageGroup) data.ageGroup = parsed.data.ageGroup;
  if (parsed.data.shared !== undefined) {
    if (parsed.data.shared) {
      // Споделя се в текущата градина на автора
      const me = await prisma.user.findUnique({ where: { id: session.userId }, select: { kindergartenId: true } });
      if (!me?.kindergartenId) {
        return NextResponse.json({ error: "За да споделяш, профилът трябва да е свързан с детска градина." }, { status: 400 });
      }
      data.kindergartenId = me.kindergartenId;
      data.sharedAt = new Date();
    } else {
      data.sharedAt = null;
    }
    data.shared = parsed.data.shared;
  }

  const row = await prisma.material.update({ where: { id }, data, include: MATERIAL_INCLUDE });
  return NextResponse.json({ material: toSavedMaterial(row, session.userId, new Set()) });
}

/** Изтриване — само от автора. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json(AUTH_REQUIRED, { status: 401 });
  const { id } = await params;

  const { count } = await prisma.material.deleteMany({ where: { id, authorId: session.userId } });
  if (count === 0) return NextResponse.json({ error: "Материалът не е намерен." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
