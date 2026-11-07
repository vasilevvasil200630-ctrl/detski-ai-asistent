import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { AUTH_REQUIRED } from "@/lib/teacher";
import { fileTypeFor, formatBytes } from "@/lib/cloud/folders";
import { UploadTokenSchema } from "@/lib/cloud/schemas";
import { blobPathFor, cloudDriver, cloudLimits, cloudMember, cloudUsage, createBlobUploadToken } from "@/lib/cloud/storage";

/**
 * Стъпка 1 от качването: проверява вида, размера и свободното място.
 * С Vercel Blob връща еднократен токен за точно един път; без Blob казва на браузъра да прати
 * файла направо към /api/cloud/files (до 4 МБ).
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json(AUTH_REQUIRED, { status: 401 });
  const me = await cloudMember(session.userId);
  if (!me) return NextResponse.json({ error: "Профилът не е свързан с детската градина." }, { status: 403 });

  const rate = await checkRateLimit(`cloud-upload:${me.id}`, 40);
  if (!rate.allowed) return NextResponse.json({ error: "Твърде много качвания за минута. Изчакайте малко." }, { status: 429 });

  const parsed = UploadTokenSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Невалиден файл." }, { status: 400 });
  const { fileName, size } = parsed.data;

  const type = fileTypeFor(fileName);
  if (!type) {
    return NextResponse.json(
      { error: "Този вид файл не се приема. Качете PDF, Word, Excel, PowerPoint, снимка, аудио, видео или ZIP." },
      { status: 415 },
    );
  }
  const driver = cloudDriver();
  const limits = cloudLimits(driver);
  if (size > limits.maxFileSize) {
    return NextResponse.json({ error: `Файлът е по-голям от ${formatBytes(limits.maxFileSize)}.` }, { status: 413 });
  }
  const usage = await cloudUsage(me.kindergartenId);
  if (usage.used + size > usage.quota) {
    return NextResponse.json({ error: "Облакът на градината е пълен. Изтрийте стари файлове, за да освободите място." }, { status: 507 });
  }

  if (driver === "db") return NextResponse.json({ driver, mimeType: type.mime });

  const pathname = blobPathFor(me.kindergartenId, me.id, fileName);
  const token = await createBlobUploadToken(pathname, type.mime, limits.maxFileSize);
  return NextResponse.json({ driver, pathname, token, mimeType: type.mime.split(";")[0] });
}
