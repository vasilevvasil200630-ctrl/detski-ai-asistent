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
import { ReminderCenter } from "./notebook/ReminderCenter";
import { PrintPrefsSync } from "./print/PrintOptions";
import { SignInGate } from "./home/SignInGate";
import { ParentPreviewBanner } from "./home/ParentPreviewBanner";
import { readParentPreview } from "@/lib/parent-preview";
import Link from "next/link";
import { KeyRound, Loader2 } from "lucide-react";

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
  // „Виж като родител“: учителят вижда публичната част като гост (само изглед)
  const [parentPreview, setParentPreview] = useState(false);
  useEffect(() => {
    setParentPreview(readParentPreview());
  }, [pathname]);

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

  // Публичната витрина за родителите е отворена за всички
  // Публичните страници за родителите: витрината и страниците на групите
  const isShowcase = pathname === "/vitrina" || pathname.startsWith("/vitrina/") || pathname === "/grupi" || pathname.startsWith("/grupi/");

  // Витрината се рисува веднага (за родителите и търсачките): съдържанието е в HTML-а,
  // а липсваща дейност връща истински код 404. Учителят после вижда менюто си.
  // Същата структура като гостовия изглед по-долу (празно място за лентата, после рамката): след
  // проверката за вход React запазва вече изрисуваната страница, вместо да я рисува наново —
  // иначе най-големият елемент (небето) се „появява“ чак след проверката и страницата изглежда бавна.
  if (loading && (isShowcase || pathname === "/")) {
    return (
      <>
        {null}
        <GuestShell footer={pathname === "/" ? "full" : "compact"} variant={isShowcase ? "showcase" : "site"}>
          {children}
        </GuestShell>
      </>
    );
  }

  // Докато не знаем дали има вход — без рамка, за да не премигва менюто
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-7 w-7 animate-spin text-slate-400" aria-label="Зареждане" />
      </div>
    );
  }

  // Посетител (или учител в „Виж като родител“): само страницата на градината, входът и правните
  // страници; останалото е заключено
  if (!user || parentPreview) {
    const isPublic = PUBLIC_PATHS.includes(pathname) || isShowcase;
    return (
      <>
        {user && parentPreview && <ParentPreviewBanner />}
        <GuestShell footer={pathname === "/" ? "full" : "compact"} variant={isShowcase ? "showcase" : "site"}>{isPublic ? children : <SignInGate path={pathname} />}</GuestShell>
        <PrintPrefsSync />
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
      {/* kg-app: ръкописните заглавия на официалния сайт и в облака (globals.css) */}
      <div className="kg-app flex min-h-screen min-w-0 flex-1 flex-col">
        <AppTopBar
          onOpenMobile={() => setMobileOpen(true)}
          onToggleCollapse={toggleCollapsed}
          collapsed={hydrated ? collapsed : false}
        />
        <div className="flex flex-1 flex-col pb-16 md:pb-0 print:pb-0">
          {user.mustChangePassword && (
            <div role="status" className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 sm:px-6">
              <p className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-1 text-sm text-amber-900">
                <KeyRound className="h-4 w-4 shrink-0" aria-hidden />
                Влезли сте с временна парола от директора. Сложете си своя, за да е профилът ви защитен.
                <Link href="/profile#change-password" className="font-semibold underline underline-offset-2 hover:text-amber-950">
                  Смени паролата
                </Link>
              </p>
            </div>
          )}
          <div className="flex-1">{children}</div>
          <SiteFooter compact />
        </div>
      </div>
      <MobileBottomNav />
      <ReminderCenter />
      <PrintPrefsSync />
      <Toaster />
      <FeedbackWidget />
      <PwaProvider />
    </div>
  );
}
