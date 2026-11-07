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

  // Началната страница за посетители е самостоятелен сайт — без страничното меню на приложението
  if (pathname === "/" && (loading || !user)) {
    return (
      <>
        {children}
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
