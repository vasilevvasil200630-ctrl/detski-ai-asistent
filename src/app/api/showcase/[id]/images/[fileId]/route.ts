import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { openBlob } from "@/lib/cloud/storage";
import { publicShowcaseWhere, SHOWCASE_IMAGE_TYPES } from "@/lib/showcase";

/**
 * Снимка от дейност на витрината. Публично — само ако дейността е одобрена и авторът е в екипа;
 * преди одобрението я виждат само авторът и директорът (за прегледа).
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string; fileId: string }> }) {
  const { id, fileId } = await params;
  const item = await prisma.showcaseItem.findUnique({
    where: { id },
    select: { status: true, authorId: true, kindergartenId: true, imageIds: true },
  });
  if (!item || !item.imageIds.includes(fileId)) return NextResponse.json({ error: "Снимката не е намерена." }, { status: 404 });

  const isPublic = Boolean(await prisma.showcaseItem.findFirst({ where: publicShowcaseWhere({ id }), select: { id: true } }));
  if (!isPublic) {
    const session = await getSession();
    const me = session ? await prisma.user.findUnique({ where: { id: session.userId }, select: { id: true, kgRole: true, kindergartenId: true } }) : null;
    const allowed = me && (me.id === item.authorId || (me.kgRole === "ADMIN" && me.kindergartenId === item.kindergartenId));
    if (!allowed) return NextResponse.json({ error: "Снимката не е намерена." }, { status: 404 });
  }

  const file = await prisma.cloudFile.findUnique({ where: { id: fileId } });
  if (!file || file.uploaderId !== item.authorId || !SHOWCASE_IMAGE_TYPES.includes(file.mimeType)) {
    return NextResponse.json({ error: "Снимката не е намерена." }, { status: 404 });
  }

  let body: BodyInit;
  if (file.storage === "blob" && file.blobPathname) {
    const blob = await openBlob(file.blobPathname).catch(() => null);
    if (!blob) return NextResponse.json({ error: "Снимката липсва." }, { status: 404 });
    body = blob.stream;
  } else {
    const data = await prisma.cloudFileData.findUnique({ where: { fileId: file.id } });
    if (!data) return NextResponse.json({ error: "Снимката липсва." }, { status: 404 });
    body = new Uint8Array(data.bytes);
  }

  return new Response(body, {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Length": String(file.size),
      // Публичните се кешират за кратко (свалената от витрината спира да се вижда до 5 минути)
      "Cache-Control": isPublic ? "public, max-age=300" : "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
