import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { AUTH_REQUIRED } from "@/lib/teacher";
import { CloudPatchSchema } from "@/lib/cloud/schemas";
import { CLOUD_FILE_INCLUDE, cloudMember, deleteBlobs, toCloudFileItem } from "@/lib/cloud/storage";

const NOT_FOUND = { error: "Файлът не е намерен." };

/** Само качилият променя заглавието, папката, групата и дали файлът е споделен. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json(AUTH_REQUIRED, { status: 401 });
  const me = await cloudMember(session.userId);
  if (!me) return NextResponse.json(NOT_FOUND, { status: 404 });
  const { id } = await params;

  const parsed = CloudPatchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Невалидни данни." }, { status: 400 });

  const existing = await prisma.cloudFile.findUnique({ where: { id }, select: { uploaderId: true, kindergartenId: true } });
  if (!existing || existing.uploaderId !== me.id || existing.kindergartenId !== me.kindergartenId) {
    return NextResponse.json(NOT_FOUND, { status: 404 });
  }
  const d = parsed.data;
  const row = await prisma.cloudFile.update({
    where: { id },
    data: {
      ...(d.title !== undefined ? { title: d.title } : {}),
      ...(d.description !== undefined ? { description: d.description } : {}),
      ...(d.folder !== undefined ? { folder: d.folder } : {}),
      ...(d.ageGroup !== undefined ? { ageGroup: d.ageGroup } : {}),
      ...(d.direction !== undefined ? { direction: d.direction } : {}),
      ...(d.shared !== undefined ? { shared: d.shared } : {}),
    },
    include: CLOUD_FILE_INCLUDE,
  });
  return NextResponse.json({ file: toCloudFileItem(row, me) });
}

/** Изтрива качилият; споделен файл може да изтрие и директорът (администраторът на градината). */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json(AUTH_REQUIRED, { status: 401 });
  const me = await cloudMember(session.userId);
  if (!me) return NextResponse.json(NOT_FOUND, { status: 404 });
  const { id } = await params;

  const row = await prisma.cloudFile.findUnique({
    where: { id },
    select: { uploaderId: true, kindergartenId: true, shared: true, blobPathname: true },
  });
  if (!row || row.kindergartenId !== me.kindergartenId) return NextResponse.json(NOT_FOUND, { status: 404 });
  const mine = row.uploaderId === me.id;
  if (!mine) {
    if (!row.shared) return NextResponse.json(NOT_FOUND, { status: 404 });
    if (me.kgRole !== "ADMIN") {
      return NextResponse.json({ error: "Само качилият файла или директорът може да го изтрие." }, { status: 403 });
    }
  }
  await prisma.cloudFile.delete({ where: { id } });
  await deleteBlobs([row.blobPathname]);
  return NextResponse.json({ ok: true });
}
