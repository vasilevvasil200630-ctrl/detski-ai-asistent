"use client";

import { invalidateMe } from "@/lib/client/me";

/** Изход: изтрива сесийната бисквитка и презарежда към началото (по модела на МатураПлюс). */
export async function performSignOut(callbackUrl = "/"): Promise<void> {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch {
    // ignore
  }
  invalidateMe();
  window.dispatchEvent(new Event("detski-auth-changed"));
  window.location.assign(callbackUrl);
}
