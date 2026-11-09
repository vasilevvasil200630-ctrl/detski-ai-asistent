import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/team-admin";
import { groupLabel } from "@/lib/parents-shared";
import { GroupFields, toGroupView } from "@/lib/parents";

const NOT_FOUND = { error: "Групата не е намерена." };
const TEACHERS = { teachers: { where: { removedAt: null }, select: { id: true, name: true, avatar: true, jobTitle: true }, orderBy: { name: "asc" as const } } };

/** Преименуване или смяна на възрастта; адресът на страницата остава същият (QR кодовете не се чупят). */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;
  const { id } = await params;
  const parsed = GroupFields.partial().safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Невалидни данни." }, { status: 400 });
  const row = await prisma.group.findUnique({ where: { id }, select: { kindergartenId: true } });
  if (!row || row.kindergartenId !== auth.me.kindergartenId) return NextResponse.json(NOT_FOUND, { status: 404 });
  const updated = await prisma.$transaction(async (tx) => {
    const g = await tx.group.update({ where: { id }, data: parsed.data, include: TEACHERS });
    // Учителите в групата носят нейното име и възраст
    await tx.user.updateMany({ where: { groupId: id }, data: { ageGroup: g.ageGroup, groupName: groupLabel(g) } });
    return g;
  });
  return NextResponse.json({ group: toGroupView(updated) });
}

/** Изтриване: учителите остават без група, а публикациите за родителите на групата се изтриват. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;
  const { id } = await params;
  const row = await prisma.group.findUnique({ where: { id }, select: { kindergartenId: true } });
  if (!row || row.kindergartenId !== auth.me.kindergartenId) return NextResponse.json(NOT_FOUND, { status: 404 });
  await prisma.$transaction([prisma.parentPost.deleteMany({ where: { groupId: id } }), prisma.group.delete({ where: { id } })]);
  return NextResponse.json({ ok: true });
}
