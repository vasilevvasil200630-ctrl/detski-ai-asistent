import type { NextConfig } from "next";
import { PRIVATE_PAGE_ROUTES } from "./src/lib/seo";

// Копирано от МатураПлюс (next.config.ts): защитни заглавки и Content-Security-Policy.
// Външни скриптове няма: Vercel Analytics е на същия домейн (/_vercel/insights); Gemini, Resend
// и Upstash се викат само от сървъра. Нов външен скрипт/услуга → добави го тук.
const CSP_DIRECTIVES = [
  "default-src 'self'",
  // 'unsafe-inline': Next.js вгражда inline скриптове; 'unsafe-eval' само при `next dev` (React Refresh)
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  // Файловете за облака се качват от браузъра направо в частното хранилище на Vercel Blob
  "connect-src 'self' https://vercel.com https://*.blob.vercel-storage.com",
  "media-src 'self' blob: data:",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "frame-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  compress: true,
  serverExternalPackages: ["@prisma/client", "prisma", "bcryptjs"],
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "origin-when-cross-origin" },
          // Микрофонът е разрешен само за самия сайт — диктуване на темата на игра или план-конспект
          { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=()" },
        ],
      },
      // Сайтът — с общата политика. Свалянето от облака задава своя, по-строга (sandbox), затова е изключено тук.
      {
        source: "/((?!api/cloud/files/[^/]+/download).*)",
        headers: [{ key: "Content-Security-Policy", value: CSP_DIRECTIVES }],
      },
      // Service Worker-ът не се кешира, за да стига новата версия веднага
      { source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }] },
      // Лични страници и API — никога в резултатите на търсачките
      ...[...PRIVATE_PAGE_ROUTES, "/api"].flatMap((route) =>
        [route, `${route}/:path*`].map((source) => ({
          source,
          headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
        })),
      ),
    ];
  },
};

export default nextConfig;
