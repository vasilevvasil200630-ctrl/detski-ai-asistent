import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { fileTypeFor } from "@/lib/cloud/folders";
import { cloudMember, contentDisposition, findVisibleCloudFile, openBlob } from "@/lib/cloud/storage";

/**
 * Сваляне или отваряне (?inline=1) на файл от облака. Проверява, че учителят е от същата градина
 * и че файлът е споделен или негов; съдържанието идва от частното хранилище през сървъра.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Влезте в профила си." }, { status: 401 });
  const me = await cloudMember(session.userId);
  const { id } = await params;
  const row = me ? await findVisibleCloudFile(id, me) : null;
  if (!row) return NextResponse.json({ error: "Файлът не е намерен." }, { status: 404 });

  const wantsInline = new URL(request.url).searchParams.get("inline") === "1";
  const inline = wantsInline && Boolean(fileTypeFor(row.fileName)?.inline);

  let body: BodyInit;
  if (row.storage === "blob" && row.blobPathname) {
    const blob = await openBlob(row.blobPathname).catch(() => null);
    if (!blob) return NextResponse.json({ error: "Файлът липсва в хранилището." }, { status: 404 });
    body = blob.stream;
  } else {
    const data = await prisma.cloudFileData.findUnique({ where: { fileId: row.id } });
    if (!data) return NextResponse.json({ error: "Файлът липсва в хранилището." }, { status: 404 });
    body = new Uint8Array(data.bytes);
  }

  if (!inline) {
    await prisma.cloudFile.update({ where: { id: row.id }, data: { downloads: { increment: 1 } } }).catch(() => undefined);
  }

  return new Response(body, {
    headers: {
      "Content-Type": row.mimeType,
      "Content-Length": String(row.size),
      "Content-Disposition": contentDisposition(row.fileName, inline),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      // Отвореният файл не може да изпълнява скриптове в сайта. PDF е без sandbox — иначе Chrome не го показва.
      "Content-Security-Policy":
        "default-src 'none'; img-src 'self' data:; media-src 'self'; style-src 'unsafe-inline'" +
        (row.mimeType === "application/pdf" ? "" : "; sandbox"),
    },
  });
}
