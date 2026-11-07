import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

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
  "Ситуационни игри, план-конспекти по ДОС и обща библиотека с материали за учителския екип на детската градина. Съобразено с Наредба № 5 за предучилищното образование.";

export const metadata: Metadata = {
  title: {
    default: "Детски асистент — платформа за учителите в детската градина",
    template: "%s · Детски асистент",
  },
  description: SITE_DESCRIPTION,
  applicationName: "Детски асистент",
  openGraph: {
    title: "Детски асистент — платформа за учителите в детската градина",
    description: SITE_DESCRIPTION,
    siteName: "Детски асистент",
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
      </body>
    </html>
  );
}
