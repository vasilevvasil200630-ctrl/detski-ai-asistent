"use client";

import { CloudError, uploadCloudFile } from "@/lib/client/cloud";
import type { CloudFileItem } from "@/lib/cloud/folders";

/** Най-дългата страна на снимката след намаляване — достатъчно за екран и за печат на A4. */
const MAX_SIDE = 1600;
const QUALITY = 0.85;

/**
 * Намалява снимката от телефона и я записва наново като JPEG. Така се качва бързо и мобилни данни,
 * а данните в EXIF (място по GPS, модел на телефона) не се качват изобщо.
 */
export async function shrinkPhoto(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    // Форматът не се чете в браузъра (напр. HEIC извън Safari) — сървърът ще го откаже с ясна грешка
    return file;
  }
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", QUALITY));
  if (!blob) return file;
  const base = file.name.replace(/\.[^.]+$/, "") || "snimka";
  return new File([blob], `${base}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
}

/** Качва снимка от дейност в моя облак (папка „Снимки“, само за мен), готова за витрината. */
export async function uploadActivityPhoto(file: File, title: string, onProgress: (pct: number) => void = () => {}): Promise<CloudFileItem> {
  if (!file.type.startsWith("image/")) throw new CloudError("Изберете снимка (JPG, PNG или WebP).");
  const small = await shrinkPhoto(file);
  return uploadCloudFile(
    small,
    { title: title.trim() || "Снимка от дейност", description: "", folder: "photos", ageGroup: null, direction: null, shared: false },
    onProgress,
  );
}
