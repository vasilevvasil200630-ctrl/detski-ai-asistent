import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { AppShell } from "@/components/AppShell";
import { getBaseAppUrl } from "@/lib/email/config";

// Копирано от МатураПлюс (src/app/layout.tsx): Geist с кирилица, метаданни, скрипт преди
// рендериране за щадящия режим (без премигване) и AppShell около всяка страница.

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

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
  icons: { apple: "/icon-192.svg" },
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <meta name="theme-color" content="#ffffff" />
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
