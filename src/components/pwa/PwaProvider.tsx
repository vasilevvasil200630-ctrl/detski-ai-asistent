"use client";

import { useEffect, useRef, useState } from "react";
import { Wifi, WifiOff } from "lucide-react";

// По модела на МатураПлюс (src/components/pwa/PwaProvider.tsx): регистрира Service Worker-а
// (само в production) и показва кратко известие, когато връзката с интернет липсва.

/** Банерът излиза чак ако връзката липсва поне толкова — кратко прекъсване не плаши никого. */
const OFFLINE_NOTICE_DELAY_MS = 2500;

export function PwaProvider() {
  const [notice, setNotice] = useState<"offline" | "online" | null>(null);
  const offlineShownRef = useRef(false);

  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      const register = () => {
        navigator.serviceWorker.register("/sw.js").catch((err) => console.warn("[PWA] Service Worker registration failed:", err));
      };
      if (document.readyState === "complete") register();
      else window.addEventListener("load", register, { once: true });
    }

    let offlineTimer: ReturnType<typeof setTimeout> | null = null;
    let hideTimer: ReturnType<typeof setTimeout> | null = null;

    const handleOnline = () => {
      if (offlineTimer) {
        clearTimeout(offlineTimer);
        offlineTimer = null;
      }
      if (!offlineShownRef.current) return;
      offlineShownRef.current = false;
      setNotice("online");
      if (hideTimer) clearTimeout(hideTimer);
      hideTimer = setTimeout(() => setNotice(null), 4000);
    };

    const handleOffline = () => {
      if (offlineTimer) clearTimeout(offlineTimer);
      offlineTimer = setTimeout(() => {
        offlineTimer = null;
        if (navigator.onLine) return;
        offlineShownRef.current = true;
        if (hideTimer) clearTimeout(hideTimer);
        setNotice("offline");
      }, OFFLINE_NOTICE_DELAY_MS);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      if (offlineTimer) clearTimeout(offlineTimer);
      if (hideTimer) clearTimeout(hideTimer);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!notice) return null;

  // Само информационен: pointer-events-none, за да не закрива бутони
  return (
    <div role="status" aria-live="polite" className="no-print pointer-events-none fixed inset-x-4 top-4 z-50 mx-auto max-w-md">
      <div
        className={`flex items-start gap-3 rounded-2xl border p-3.5 text-sm shadow-sm ${
          notice === "offline" ? "border-amber-200 bg-amber-50 text-amber-950" : "border-emerald-200 bg-emerald-50 text-emerald-950"
        }`}
      >
        {notice === "offline" ? (
          <WifiOff className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden />
        ) : (
          <Wifi className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden />
        )}
        <div>
          <p className="font-semibold">{notice === "offline" ? "Няма връзка с интернет" : "Връзката е възстановена"}</p>
          <p className="mt-0.5 text-xs leading-relaxed opacity-80">
            {notice === "offline"
              ? "Отворените страници остават достъпни. Генерирането и библиотеката ще работят, щом връзката се върне."
              : "Всичко работи отново."}
          </p>
        </div>
      </div>
    </div>
  );
}
