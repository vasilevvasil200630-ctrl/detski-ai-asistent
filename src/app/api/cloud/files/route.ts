import { NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { AUTH_REQUIRED } from "@/lib/teacher";
import { CLOUD_FOLDER_IDS, fileTypeFor, formatBytes } from "@/lib/cloud/folders";
import { CloudListQuery, CloudMetaSchema, RegisterBlobSchema, type CloudMeta } from "@/lib/cloud/schemas";
import {
  CLOUD_FILE_INCLUDE,
  blobInfo,
  cloudDriver,
  cloudLimits,
  cloudMember,
  cloudUsage,
  deleteBlobs,
  safeFileName,
  toCloudFileItem,
} from "@/lib/cloud/storage";

const NOT_MEMBER = { error: "Профилът не е свързан с детската градина." };

/**
 * Общият облак на градината.
 * scope=all — споделеното от всички учители и директора (и моите лични файлове);
 * scope=mine — всичко, което аз съм качила; scope=private — само моите лични (несподелени).
 */
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json(AUTH_REQUIRED, { status: 401 });
  const me = await cloudMember(session.userId);
  if (!me) return NextResponse.json(NOT_MEMBER, { status: 403 });

  const q = CloudListQuery.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!q.success) return NextResponse.json({ error: "Невалиден филтър." }, { status: 400 });
  const { scope, folder, ageGroup, q: text } = q.data;

  const and: Prisma.CloudFileWhereInput[] = [
    scope === "mine"
      ? { uploaderId: me.id }
      : scope === "private"
        ? { uploaderId: me.id, shared: false }
        : { OR: [{ shared: true }, { uploaderId: me.id }] },
  ];
  // Файл „за всички групи“ (ageGroup = null) се вижда при всяка група
  if (ageGroup) and.push({ OR: [{ ageGroup }, { ageGroup: null }] });
  if (text) {
    and.push({
      OR: [
        { title: { contains: text, mode: "insensitive" } },
        { description: { contains: text, mode: "insensitive" } },
        { fileName: { contains: text, mode: "insensitive" } },
        { uploader: { name: { contains: text, mode: "insensitive" } } },
      ],
    });
  }
  const base: Prisma.CloudFileWhereInput = { kindergartenId: me.kindergartenId, AND: and };

  const [rows, byFolder, usage] = await Promise.all([
    prisma.cloudFile.findMany({
      where: { ...base, ...(folder ? { folder } : {}) },
      include: CLOUD_FILE_INCLUDE,
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
    prisma.cloudFile.groupBy({ by: ["folder"], where: base, _count: { _all: true } }),
    cloudUsage(me.kindergartenId),
  ]);

  const counts = Object.fromEntries(CLOUD_FOLDER_IDS.map((id) => [id, 0])) as Record<string, number>;
  for (const g of byFolder) counts[g.folder in counts ? g.folder : "other"] += g._count._all;

  return NextResponse.json({ files: rows.map((r) => toCloudFileItem(r, me)), counts, usage });
}

/**
 * Стъпка 2 от качването: записва файла в облака.
 * - JSON { pathname, ... } — файлът вече е качен в Blob; проверяваме пътя и истинския размер.
 * - multipart/form-data { file, ... } — без Blob: малък файл направо в базата.
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json(AUTH_REQUIRED, { status: 401 });
  const me = await cloudMember(session.userId);
  if (!me) return NextResponse.json(NOT_MEMBER, { status: 403 });

  const rate = await checkRateLimit(`cloud-save:${me.id}`, 40);
  if (!rate.allowed) return NextResponse.json({ error: "Твърде много качвания за минута. Изчакайте малко." }, { status: 429 });

  const driver = cloudDriver();
  const limits = cloudLimits(driver);
  const isForm = (request.headers.get("content-type") ?? "").includes("multipart/form-data");

  let meta: CloudMeta;
  let fileName: string;
  let size: number;
  let bytes: Uint8Array<ArrayBuffer> | null = null;
  let blobPathname: string | null = null;

  if (isForm) {
    if (driver !== "db") return NextResponse.json({ error: "Качете файла отново." }, { status: 400 });
    const form = await request.formData().catch(() => null);
    const file = form?.get("file");
    if (!form || !(file instanceof File)) return NextResponse.json({ error: "Липсва файл." }, { status: 400 });
    const fields = Object.fromEntries([...form.entries()].filter(([k, v]) => k !== "file" && typeof v === "string"));
    const parsed = CloudMetaSchema.safeParse(fields);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Невалидни данни." }, { status: 400 });
    meta = parsed.data;
    fileName = safeFileName(file.name);
    size = file.size;
    if (size === 0) return NextResponse.json({ error: "Файлът е празен." }, { status: 400 });
    if (size > limits.maxFileSize) {
      return NextResponse.json({ error: `Файлът е по-голям от ${formatBytes(limits.maxFileSize)}.` }, { status: 413 });
    }
    bytes = new Uint8Array(await file.arrayBuffer());
  } else {
    if (driver !== "blob") return NextResponse.json({ error: "Хранилището за файлове не е свързано." }, { status: 400 });
    const parsed = RegisterBlobSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Невалидни данни." }, { status: 400 });
    const { pathname, fileName: rawName, ...rest } = parsed.data;
    // Токенът е издаден само за пътя на този учител в тази градина
    if (!pathname.startsWith(`cloud/${me.kindergartenId}/${me.id}/`) || pathname.includes("..")) {
      return NextResponse.json({ error: "Невалиден файл." }, { status: 403 });
    }
    const info = await blobInfo(pathname);
    if (!info) return NextResponse.json({ error: "Файлът не беше качен докрай. Опитайте отново." }, { status: 400 });
    meta = rest;
    fileName = safeFileName(rawName);
    size = info.size;
    blobPathname = pathname;
  }

  const type = fileTypeFor(fileName);
  if (!type) {
    await deleteBlobs([blobPathname]);
    return NextResponse.json({ error: "Този вид файл не се приема." }, { status: 415 });
  }
  const usage = await cloudUsage(me.kindergartenId);
  if (usage.used + size > usage.quota) {
    await deleteBlobs([blobPathname]);
    return NextResponse.json({ error: "Облакът на градината е пълен. Изтрийте стари файлове, за да освободите място." }, { status: 507 });
  }

  const row = await prisma.cloudFile.create({
    data: {
      kindergartenId: me.kindergartenId,
      uploaderId: me.id,
      title: meta.title,
      description: meta.description,
      folder: meta.folder,
      ageGroup: meta.ageGroup ?? null,
      direction: meta.direction ?? null,
      fileName,
      mimeType: type.mime,
      size,
      storage: blobPathname ? "blob" : "db",
      blobPathname,
      shared: meta.shared,
      ...(bytes ? { data: { create: { bytes } } } : {}),
    },
    include: CLOUD_FILE_INCLUDE,
  });
  return NextResponse.json({ file: toCloudFileItem(row, me) }, { status: 201 });
}
