"use client";

import { useEffect, useState } from "react";

export type ThemeMode = "light" | "eye-care";

const EYECARE_STORAGE_KEY = "detski-eyecare";

/**
 * Проверява дали щадящият зрението режим (Eye-Care Mode) е активен на documentElement.
 */
export function isEyeCareActive(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("eye-care");
}

/**
 * Връща запазеното предпочитание за щадящ режим от localStorage.
 */
export function getStoredEyeCare(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(EYECARE_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

/**
 * Прилага щадящия режим (eye-care) към <html> тага и гарантира,
 * че тъмният режим (dark) е напълно премахнат.
 */
export function applyEyeCare(enabled: boolean) {
  if (typeof document === "undefined") return;

  // Елиминираме напълно тъмния режим
  document.documentElement.classList.remove("dark");

  if (enabled) {
    document.documentElement.classList.add("eye-care");
  } else {
    document.documentElement.classList.remove("eye-care");
  }

  try {
    localStorage.setItem(EYECARE_STORAGE_KEY, enabled ? "true" : "false");
    // Премахваме стария matura-theme ключ, за да няма конфликти
    localStorage.removeItem("matura-theme");
  } catch {
    // ignore
  }

  // Уведомяваме компонентите
  window.dispatchEvent(
    new CustomEvent("detski-eyecare-changed", {
      detail: { enabled },
    }),
  );
}

/**
 * React hook за щадящ зрението режим (Eye-Care Mode).
 * Съдържа и пълна обратна съвместимост за съществуващи компоненти.
 */
export function useEyeCare() {
  const [isEyeCare, setIsEyeCare] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    const initial = getStoredEyeCare();
    setIsEyeCare(initial);

    // Гарантираме премахване на .dark клас
    if (typeof document !== "undefined") {
      document.documentElement.classList.remove("dark");
      if (initial) {
        document.documentElement.classList.add("eye-care");
      } else {
        document.documentElement.classList.remove("eye-care");
      }
    }

    const handleChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ enabled: boolean }>;
      if (customEvent.detail !== undefined) {
        setIsEyeCare(customEvent.detail.enabled);
      }
    };

    window.addEventListener("detski-eyecare-changed", handleChange);
    return () => {
      window.removeEventListener("detski-eyecare-changed", handleChange);
    };
  }, []);

  const toggleEyeCare = () => {
    const next = !isEyeCare;
    applyEyeCare(next);
    setIsEyeCare(next);
  };

  return {
    isEyeCare,
    mounted,
    toggleEyeCare,
    // Обратна съвместимост за всякакви компоненти, ползващи useTheme свойства:
    isDark: false,
    theme: (isEyeCare ? "eye-care" : "light") as ThemeMode,
    toggleTheme: toggleEyeCare,
    setTheme: (mode: ThemeMode) => applyEyeCare(mode === "eye-care"),
  };
}

// Алиас за обратна съвместимост:
export const useTheme = useEyeCare;

// Стари хелпъри за съвместимост:
export function getStoredTheme(): ThemeMode {
  return getStoredEyeCare() ? "eye-care" : "light";
}

export function isDarkActive(): boolean {
  return false;
}

export function resolveIsDark(): boolean {
  return false;
}

export function applyTheme(mode: ThemeMode | string) {
  applyEyeCare(mode === "eye-care");
}
