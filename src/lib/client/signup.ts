"use client";

import { useEffect, useState } from "react";

/**
 * Дали облакът приема нови учители (директорът го изключва, когато екипът е пълен).
 * Зарежда се веднъж на страница; null — още не знаем (тогава „Регистрация“ не се показва).
 */
let cached: Promise<boolean> | null = null;

export function signupOpen(): Promise<boolean> {
  cached ??= fetch("/api/auth/register", { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : { open: true }))
    .then((d: { open?: boolean }) => d.open !== false)
    .catch(() => true);
  return cached;
}

export function useSignupOpen(): boolean | null {
  const [open, setOpen] = useState<boolean | null>(null);
  useEffect(() => {
    let alive = true;
    void signupOpen().then((v) => alive && setOpen(v));
    return () => {
      alive = false;
    };
  }, []);
  return open;
}
