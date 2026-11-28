"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Резервна граница за грешки в самия RootLayout — самостоятелен HTML без външни зависимости,
 * оформен в цветовете на ДГ „Пролет“, с. Ягодово.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("GLOBAL ERROR:", error);
  }, [error]);

  return (
    <html lang="bg">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background: "#cfe9f8",
          color: "#2e2e2e",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
        }}
      >
        <main
          style={{
            maxWidth: "460px",
            width: "100%",
            background: "#fffef9",
            border: "2px solid #e6cf67",
            borderTop: "5px solid #faca04",
            borderRadius: "12px",
            padding: "32px 28px",
            textAlign: "center",
            boxShadow: "0 4px 14px rgba(61, 47, 0, 0.08)",
          }}
        >
          <h1 style={{ margin: "0 0 12px 0", fontSize: "24px", color: "#c43d00" }}>Нещо се обърка</h1>
          <p style={{ margin: "0 0 16px 0", fontSize: "15px", lineHeight: 1.6, color: "#44403c" }}>
            Възникна неочаквана грешка при зареждането на страницата. Опитайте да я презаредите.
          </p>
          {error?.digest && (
            <p style={{ margin: "0 0 20px 0", fontSize: "12px", fontFamily: "monospace", color: "#78716c" }}>
              Код: {error.digest}
            </p>
          )}
          <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={reset}
              style={{
                padding: "11px 22px",
                border: 0,
                borderRadius: "2px 10px 2px 10px",
                background: "#4d7a0a",
                color: "#ffffff",
                fontSize: "15px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Опитай отново
            </button>
            <Link
              href="/"
              style={{
                padding: "11px 22px",
                border: "1px solid #e6cf67",
                borderRadius: "2px 10px 2px 10px",
                background: "#fffeea",
                color: "#2e2e2e",
                fontSize: "15px",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Към началото
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
