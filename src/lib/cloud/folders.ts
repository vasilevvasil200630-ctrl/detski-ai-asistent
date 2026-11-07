/**
 * Общият облак на градината: папки, позволени видове файлове и ограничения.
 * Файлът е общ за сървъра и за браузъра (без server-only).
 */

export const CLOUD_FOLDERS = [
  { id: "plans", label: "Планове и разпределения", hint: "годишни и седмични планове, конспекти, програми" },
  { id: "worksheets", label: "Работни листове и табла", hint: "листове, шаблони, табла и картинки за занимания" },
  { id: "holidays", label: "Празници и сценарии", hint: "сценарии, покани, украса, музика за тържества" },
  { id: "songs", label: "Песни, стихове и приказки", hint: "текстове, аудио и видео за децата" },
  { id: "photos", label: "Снимки и видео", hint: "от празници и изложби; с деца — само със съгласие на родителите" },
  { id: "parents", label: "За родителите", hint: "писма, съобщения, декларации, бележки" },
  { id: "documents", label: "Документи и заповеди", hint: "от директора: заповеди, правилници, графици" },
  { id: "other", label: "Други", hint: "всичко останало" },
] as const;

export type CloudFolderId = (typeof CLOUD_FOLDERS)[number]["id"];

export const CLOUD_FOLDER_IDS = CLOUD_FOLDERS.map((f) => f.id) as [CloudFolderId, ...CloudFolderId[]];

export function folderLabel(id: string): string {
  return CLOUD_FOLDERS.find((f) => f.id === id)?.label ?? "Други";
}

export type CloudFileKind = "pdf" | "doc" | "sheet" | "slides" | "image" | "audio" | "video" | "text" | "archive";

/**
 * Позволените файлове по разширение. Видът (MIME) се определя от сървъра по разширението —
 * не от браузъра. SVG и HTML не се приемат: биха могли да изпълнят код при отваряне.
 */
export const CLOUD_FILE_TYPES: Record<string, { mime: string; kind: CloudFileKind; inline?: boolean }> = {
  pdf: { mime: "application/pdf", kind: "pdf", inline: true },
  doc: { mime: "application/msword", kind: "doc" },
  docx: { mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", kind: "doc" },
  odt: { mime: "application/vnd.oasis.opendocument.text", kind: "doc" },
  rtf: { mime: "application/rtf", kind: "doc" },
  txt: { mime: "text/plain; charset=utf-8", kind: "text", inline: true },
  xls: { mime: "application/vnd.ms-excel", kind: "sheet" },
  xlsx: { mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", kind: "sheet" },
  ods: { mime: "application/vnd.oasis.opendocument.spreadsheet", kind: "sheet" },
  csv: { mime: "text/csv; charset=utf-8", kind: "sheet" },
  ppt: { mime: "application/vnd.ms-powerpoint", kind: "slides" },
  pptx: { mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation", kind: "slides" },
  odp: { mime: "application/vnd.oasis.opendocument.presentation", kind: "slides" },
  jpg: { mime: "image/jpeg", kind: "image", inline: true },
  jpeg: { mime: "image/jpeg", kind: "image", inline: true },
  png: { mime: "image/png", kind: "image", inline: true },
  gif: { mime: "image/gif", kind: "image", inline: true },
  webp: { mime: "image/webp", kind: "image", inline: true },
  heic: { mime: "image/heic", kind: "image" },
  mp3: { mime: "audio/mpeg", kind: "audio", inline: true },
  m4a: { mime: "audio/mp4", kind: "audio", inline: true },
  wav: { mime: "audio/wav", kind: "audio", inline: true },
  ogg: { mime: "audio/ogg", kind: "audio", inline: true },
  mp4: { mime: "video/mp4", kind: "video", inline: true },
  mov: { mime: "video/quicktime", kind: "video" },
  zip: { mime: "application/zip", kind: "archive" },
};

/** Атрибутът accept за полето за избор на файл. */
export const CLOUD_ACCEPT = Object.keys(CLOUD_FILE_TYPES)
  .map((ext) => `.${ext}`)
  .join(",");

export function fileExtension(fileName: string): string {
  const m = /\.([a-z0-9]{1,5})$/i.exec(fileName.trim());
  return m ? m[1].toLowerCase() : "";
}

export function fileTypeFor(fileName: string) {
  return CLOUD_FILE_TYPES[fileExtension(fileName)] ?? null;
}

/** „2,4 МБ“ */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} КБ`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toLocaleString("bg-BG", { maximumFractionDigits: 1 })} МБ`;
  return `${(bytes / 1024 / 1024 / 1024).toLocaleString("bg-BG", { maximumFractionDigits: 2 })} ГБ`;
}

/** Заглавие по подразбиране от името на файла: „Есен_работен-лист.pdf“ → „Есен работен лист“. */
export function titleFromFileName(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  return (base || "Файл").slice(0, 140);
}

/** Файл в облака, както го вижда браузърът. */
export interface CloudFileItem {
  id: string;
  title: string;
  description: string;
  folder: CloudFolderId;
  ageGroup: "1" | "2" | "3" | "4" | null;
  direction: string | null;
  fileName: string;
  mimeType: string;
  kind: CloudFileKind;
  /** Може да се отвори в браузъра (PDF, снимка, аудио, видео, текст) */
  inline: boolean;
  size: number;
  shared: boolean;
  downloads: number;
  mine: boolean;
  /** Може да го изтрие: качилият или директорът (администраторът) */
  canDelete: boolean;
  uploaderName: string;
  uploaderAvatar: string;
  uploaderJobTitle: string;
  createdAt: string;
  createdAtIso: string;
}

export interface CloudUsage {
  used: number;
  quota: number;
  maxFileSize: number;
  driver: "blob" | "db";
}
