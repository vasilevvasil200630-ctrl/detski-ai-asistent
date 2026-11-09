import "server-only";
import { randomUUID } from "node:crypto";
import { del, get, head, put } from "@vercel/blob";
import { generateClientTokenFromReadWriteToken } from "@vercel/blob/client";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { relativeDate } from "@/lib/materials";
import { CLOUD_FOLDER_IDS, fileTypeFor, type CloudFileItem, type CloudFolderId, type CloudUsage } from "./folders";

/**
 * Хранилище на облака.
 * - "blob": частно хранилище на Vercel Blob (BLOB_READ_WRITE_TOKEN). Браузърът качва файла
 *   направо там с еднократен токен за точно определен път; сваля се само през /api/cloud/files/[id]/download
 *   след проверка, че учителят е от същата градина. Линк към файла няма.
 * - "db": без Blob (локално или преди хранилището да е свързано) — малки файлове в базата.
 */
export type CloudDriver = "blob" | "db";

export function cloudDriver(): CloudDriver {
  return process.env.BLOB_READ_WRITE_TOKEN ? "blob" : "db";
}

const MB = 1024 * 1024;

/**
 * Ограничения: до 4 МБ във формата на заявка (Vercel приема до 4,5 МБ), до 50 МБ в Blob.
 * Общото място е под безплатния лимит на Vercel Blob (1 ГБ), за да не спре хранилището.
 */
export function cloudLimits(driver: CloudDriver = cloudDriver()) {
  return driver === "blob"
    ? { maxFileSize: 50 * MB, quota: 950 * MB }
    : { maxFileSize: 4 * MB, quota: 150 * MB };
}

export async function cloudUsage(kindergartenId: string): Promise<CloudUsage> {
  const driver = cloudDriver();
  const agg = await prisma.cloudFile.aggregate({ where: { kindergartenId }, _sum: { size: true } });
  return { used: agg._sum.size ?? 0, driver, ...cloudLimits(driver) };
}

/** Безопасно име на файл за пътя в хранилището (кирилицата остава). */
export function safeFileName(fileName: string): string {
  const cleaned = fileName
    .normalize("NFC")
    .replace(/[\\/:*?"<>|\u0000-\u001f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return (cleaned || "file").slice(-120);
}

export function blobPathFor(kindergartenId: string, userId: string, fileName: string): string {
  return `cloud/${kindergartenId}/${userId}/${randomUUID()}/${safeFileName(fileName)}`;
}

/** Еднократен токен: браузърът може да качи точно един файл, точно на този път, до 15 минути. */
export async function createBlobUploadToken(pathname: string, mimeType: string, maxBytes: number): Promise<string> {
  return generateClientTokenFromReadWriteToken({
    pathname,
    allowedContentTypes: [mimeType.split(";")[0]],
    maximumSizeInBytes: maxBytes,
    validUntil: Date.now() + 15 * 60_000,
    addRandomSuffix: false,
    allowOverwrite: false,
  });
}

export async function blobInfo(pathname: string) {
  try {
    return await head(pathname);
  } catch {
    return null;
  }
}

export async function openBlob(pathname: string) {
  const res = await get(pathname, { access: "private" });
  return res && res.statusCode === 200 ? res : null;
}

/** Записва файл, създаден от сървъра (напр. Word от генератора), направо в частното хранилище. */
export async function putBlob(pathname: string, bytes: Uint8Array, contentType: string): Promise<void> {
  await put(pathname, Buffer.from(bytes), { access: "private", contentType, addRandomSuffix: false, allowOverwrite: false });
}

/** Изтрива файлове от Blob; грешка не спира изтриването на записа в базата. */
export async function deleteBlobs(pathnames: (string | null | undefined)[]): Promise<void> {
  const list = pathnames.filter((p): p is string => Boolean(p));
  if (list.length === 0 || cloudDriver() !== "blob") return;
  try {
    await del(list);
  } catch (error) {
    console.warn("[cloud] неуспешно изтриване от Blob:", error instanceof Error ? error.message : error);
  }
}

export const CLOUD_FILE_INCLUDE = {
  uploader: { select: { id: true, name: true, avatar: true, jobTitle: true } },
} satisfies Prisma.CloudFileInclude;

type CloudFileRow = Prisma.CloudFileGetPayload<{ include: typeof CLOUD_FILE_INCLUDE }>;

export function toCloudFileItem(row: CloudFileRow, me: { id: string; kgRole: string }): CloudFileItem {
  const type = fileTypeFor(row.fileName);
  const mine = row.uploaderId === me.id;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    folder: (CLOUD_FOLDER_IDS as readonly string[]).includes(row.folder) ? (row.folder as CloudFolderId) : "other",
    ageGroup: (row.ageGroup as CloudFileItem["ageGroup"]) ?? null,
    direction: row.direction,
    fileName: row.fileName,
    mimeType: row.mimeType,
    kind: type?.kind ?? "doc",
    inline: Boolean(type?.inline),
    size: row.size,
    shared: row.shared,
    downloads: row.downloads,
    mine,
    canDelete: mine || (row.shared && me.kgRole === "ADMIN"),
    uploaderName: row.uploader?.name ?? "Бивш колега",
    uploaderAvatar: row.uploader?.avatar ?? "👩‍🏫",
    uploaderJobTitle: row.uploader?.jobTitle ?? "",
    createdAt: relativeDate(row.createdAt),
    createdAtIso: row.createdAt.toISOString(),
  };
}

/** Учителят и градината му — облакът е само за свързани с градина профили. */
export async function cloudMember(userId: string) {
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, kgRole: true, kindergartenId: true } });
  if (!me?.kindergartenId) return null;
  return me as { id: string; kgRole: "ADMIN" | "TEACHER"; kindergartenId: string };
}

/** Файл, който учителят вижда: свой или споделен в неговата градина. */
export async function findVisibleCloudFile(id: string, me: { id: string; kindergartenId: string }) {
  const row = await prisma.cloudFile.findUnique({ where: { id }, include: CLOUD_FILE_INCLUDE });
  if (!row || row.kindergartenId !== me.kindergartenId) return null;
  if (row.uploaderId !== me.id && !row.shared) return null;
  return row;
}

/** Content-Disposition с кирилско име (RFC 6266 / 5987). */
export function contentDisposition(fileName: string, inline: boolean): string {
  const ascii = fileName.replace(/[^\x20-\x7e]+/g, "_").replace(/["\\]/g, "_") || "file";
  return `${inline ? "inline" : "attachment"}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}
