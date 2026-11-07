"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AppSidebar } from "./AppSidebar";
import { AppTopBar } from "./AppTopBar";
import { MobileBottomNav } from "./MobileBottomNav";
import { Toaster } from "./Toaster";
import { SiteFooter } from "./home/SiteFooter";
import { FeedbackWidget } from "./FeedbackWidget";
import { PwaProvider } from "./pwa/PwaProvider";
import { useMe } from "@/lib/client/useMe";
import { GuestShell } from "./home/GuestShell";
import { SignInGate } from "./home/SignInGate";
import { Loader2 } from "lucide-react";

/** Страниците, които посетител без профил вижда. Всичко друго е зад вход (облакът е затворен). */
const PUBLIC_PATHS = ["/", "/login", "/register", "/forgot-password", "/reset-password", "/privacy", "/terms"];

// Копирано от МатураПлюс (src/components/AppShell.tsx): сгъваем страничен панел (запомня се),
// горна лента, мобилна долна навигация и известия. Без синхронизацията на кеша на ученика.

const COLLAPSED_KEY = "detski-sidebar-collapsed";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useMe();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(COLLAPSED_KEY);
      if (stored === "1") setCollapsed(true);
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const toggleCollapsed = () => {
    setCollapsed((v) => {
      const next = !v;
      try {
        localStorage.setItem(COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Докато не знаем дали има вход — без рамка, за да не премигва менюто
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-7 w-7 animate-spin text-slate-400" aria-label="Зареждане" />
      </div>
    );
  }

  // Посетител: само страницата на градината, входът и правните страници; останалото е заключено
  if (!user) {
    const isPublic = PUBLIC_PATHS.includes(pathname);
    return (
      <>
        <GuestShell footer={pathname === "/" ? "full" : "compact"}>{isPublic ? children : <SignInGate path={pathname} />}</GuestShell>
        <Toaster />
        <FeedbackWidget />
        <PwaProvider />
      </>
    );
  }

  return (
    <div className="flex min-h-screen bg-[var(--background)] text-[var(--foreground)] bg-app-ambient transition-colors duration-200">
      <AppSidebar
        collapsed={hydrated ? collapsed : false}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      {/* min-w-0: колоната не бива да расте по най-широкото си съдържание (карусели, табове) */}
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <AppTopBar
          onOpenMobile={() => setMobileOpen(true)}
          onToggleCollapse={toggleCollapsed}
          collapsed={hydrated ? collapsed : false}
        />
        <div className="flex flex-1 flex-col pb-16 md:pb-0">
          <div className="flex-1">{children}</div>
          <SiteFooter compact />
        </div>
      </div>
      <MobileBottomNav />
      <Toaster />
      <FeedbackWidget />
      <PwaProvider />
    </div>
  );
}
