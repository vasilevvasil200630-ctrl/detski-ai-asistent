import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { AppShell } from "@/components/AppShell";
import { getBaseAppUrl } from "@/lib/email/config";

// Копирано от МатураПлюс (src/app/layout.tsx): Geist с кирилица, метаданни, скрипт преди
// рендериране за щадящия режим (без премигване) и AppShell около всяка страница.

// Шрифтовете (Geist и ръкописният Caveat от официалния сайт на градината) са в public/fonts и се
// описват в globals.css — build-ът не зависи от Google Fonts. Предварително се зареждат тези за
// кирилицата и латиницата на основния текст и кирилицата на ръкописните заглавия.
const PRELOAD_FONTS = ["/fonts/geist-cyrillic.woff2", "/fonts/geist-latin.woff2", "/fonts/caveat-cyrillic.woff2"];

const SITE_DESCRIPTION =
  "Учителският облак на ДГ „Пролет“, с. Ягодово: игри, работни листове, стихчета, писма до родителите, грамоти и план-конспекти за печат. Съобразено с Наредба № 5 за предучилищното образование.";

export const metadata: Metadata = {
  metadataBase: new URL(getBaseAppUrl()),
  title: {
    default: "Учителски облак · ДГ „Пролет“, с. Ягодово",
    template: "%s · ДГ „Пролет“",
  },
  description: SITE_DESCRIPTION,
  applicationName: "ДГ „Пролет“",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: "ДГ „Пролет“", statusBarStyle: "default" },
  icons: { apple: "/apple-touch-icon.png" },
  keywords: ["ДГ Пролет", "Ягодово", "детска градина", "учители", "план-конспект", "ДОС", "ситуационни игри", "Наредба № 5", "Златно ключе", "предучилищно образование"],
  openGraph: {
    title: "Учителски облак · ДГ „Пролет“, с. Ягодово",
    description: SITE_DESCRIPTION,
    siteName: "ДГ „Пролет“",
    locale: "bg_BG",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="bg"
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <head>
        <meta name="theme-color" content="#ffffff" />
        {PRELOAD_FONTS.map((href) => (
          <link key={href} rel="preload" href={href} as="font" type="font/woff2" crossOrigin="anonymous" />
        ))}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  if (localStorage.getItem('detski-eyecare') === 'true') {
                    document.documentElement.classList.add('eye-care');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)] font-sans tracking-tight bg-app-ambient selection:bg-[#0a4b82]/15 selection:text-[#072d4c] transition-colors duration-200">
        <AppShell>{children}</AppShell>
        {/* Vercel Analytics: без бисквитки и без лични данни — брои само посещенията на страниците */}
        {/* Само в production: там скриптът е на същия домейн; в dev е от чужд домейн и CSP го спира */}
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  );
}
