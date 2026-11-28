"use client";

import { invalidateMe } from "@/lib/client/me";

/**
 * Изход: изтрива сесийната бисквитка, почиства локалния PWA кеш (важно при общ компютър
 * в детската градина) и презарежда към началото.
 */
export async function performSignOut(callbackUrl = "/"): Promise<void> {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch {
    // ignore
  }
  try {
    if (typeof caches !== "undefined") {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
  } catch {
    // ignore
  }
  invalidateMe();
  window.dispatchEvent(new Event("detski-auth-changed"));
  window.location.assign(callbackUrl);
}
