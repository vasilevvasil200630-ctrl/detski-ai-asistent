"use client";

import type { CloudFileItem, CloudUsage } from "@/lib/cloud/folders";

export type CloudMetaInput = {
  title: string;
  description?: string;
  folder: string;
  ageGroup?: string | null;
  direction?: string | null;
  shared: boolean;
};

export type CloudListResponse = { files: CloudFileItem[]; counts: Record<string, number>; usage: CloudUsage };

export class CloudError extends Error {}

async function readError(res: Response, fallback: string): Promise<never> {
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  throw new CloudError(data.error ?? fallback);
}

export async function listCloudFiles(params: Record<string, string | undefined>): Promise<CloudListResponse> {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]);
  const res = await fetch(`/api/cloud/files?${qs}`, { cache: "no-store" });
  if (!res.ok) await readError(res, "Файловете не можаха да се заредят.");
  return res.json();
}

/** Качване с напредък през XMLHttpRequest (fetch не дава напредък при изпращане). */
function postFormWithProgress(url: string, form: FormData, onProgress: (pct: number) => void): Promise<Response> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => resolve(new Response(xhr.responseText, { status: xhr.status, headers: { "Content-Type": "application/json" } }));
    xhr.onerror = () => reject(new CloudError("Няма връзка със сървъра."));
    xhr.send(form);
  });
}

/**
 * Качва един файл в облака: 1) пита сървъра за разрешение (вид, размер, място);
 * 2) с Vercel Blob — качва го направо в частното хранилище и го записва; без Blob — праща го на сървъра.
 */
export async function uploadCloudFile(file: File, meta: CloudMetaInput, onProgress: (pct: number) => void): Promise<CloudFileItem> {
  const tokenRes = await fetch("/api/cloud/upload-token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileName: file.name, size: file.size }),
  });
  if (!tokenRes.ok) await readError(tokenRes, "Файлът не може да се качи.");
  const grant = (await tokenRes.json()) as { driver: "blob" | "db"; pathname?: string; token?: string; mimeType: string };

  let res: Response;
  if (grant.driver === "blob" && grant.pathname && grant.token) {
    const { put } = await import("@vercel/blob/client");
    try {
      await put(grant.pathname, file, {
        access: "private",
        token: grant.token,
        contentType: grant.mimeType,
        multipart: file.size > 8 * 1024 * 1024,
        onUploadProgress: (e) => onProgress(Math.min(99, Math.round(e.percentage))),
      });
    } catch {
      throw new CloudError("Качването прекъсна. Проверете връзката и опитайте отново.");
    }
    res = await fetch("/api/cloud/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...meta, pathname: grant.pathname, fileName: file.name }),
    });
  } else {
    const form = new FormData();
    form.set("file", file);
    form.set("title", meta.title);
    form.set("description", meta.description ?? "");
    form.set("folder", meta.folder);
    form.set("ageGroup", meta.ageGroup ?? "");
    form.set("direction", meta.direction ?? "");
    form.set("shared", String(meta.shared));
    res = await postFormWithProgress("/api/cloud/files", form, (p) => onProgress(Math.min(99, p)));
  }
  if (!res.ok) await readError(res, "Файлът не беше записан.");
  onProgress(100);
  const data = (await res.json()) as { file: CloudFileItem };
  return data.file;
}

export async function updateCloudFile(id: string, patch: Partial<CloudMetaInput>): Promise<CloudFileItem> {
  const res = await fetch(`/api/cloud/files/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) await readError(res, "Промяната не беше записана.");
  return ((await res.json()) as { file: CloudFileItem }).file;
}

export async function deleteCloudFile(id: string): Promise<void> {
  const res = await fetch(`/api/cloud/files/${id}`, { method: "DELETE" });
  if (!res.ok) await readError(res, "Файлът не беше изтрит.");
}

export function cloudDownloadUrl(id: string, inline = false): string {
  return `/api/cloud/files/${id}/download${inline ? "?inline=1" : ""}`;
}
