"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BellRing, Megaphone, Pin } from "lucide-react";
import type { AnnouncementView } from "@/lib/announcements-shared";

/** Картата „Обяви“ на началната страница: последните 3, непрочетените важни — отгоре и оцветени. */
export function AnnouncementsCard({ isAdmin }: { isAdmin: boolean }) {
  const [items, setItems] = useState<AnnouncementView[] | null>(null);

  useEffect(() => {
    fetch("/api/announcements", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d: { items?: AnnouncementView[] }) => setItems(d.items ?? []))
      .catch(() => setItems([]));
  }, []);

  if (items === null) return null;
  if (items.length === 0 && !isAdmin) return null;
  const urgent = items.filter((i) => i.important && !i.readByMe);
  const list = [...urgent, ...items.filter((i) => !urgent.includes(i))].slice(0, 3);

  return (
    <section aria-labelledby="dash-announcements" className={`rounded-2xl border bg-white p-5 ${urgent.length ? "border-amber-300" : "border-slate-200"}`}>
      <div className="flex items-center justify-between gap-2">
        <h2 id="dash-announcements" className="flex items-center gap-2 text-sm font-semibold text-slate-500">
          <Megaphone className="h-4 w-4" aria-hidden /> Обяви
          {urgent.length > 0 && <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">{urgent.length} {urgent.length === 1 ? "важна" : "важни"}</span>}
        </h2>
        <Link href="/announcements" className="inline-flex items-center gap-1 text-sm font-semibold text-[#4d7a0a] hover:underline">
          {isAdmin && items.length === 0 ? "Напиши обява" : "Всички"} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-slate-600">Тук екипът ще вижда вашите съобщения — съвети, срокове, празници.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {list.map((i) => (
            <li key={i.id}>
              <Link
                href="/announcements"
                className={`block rounded-xl px-3 py-2 text-sm hover:bg-slate-50 ${i.important && !i.readByMe ? "bg-amber-50 font-semibold text-amber-950" : "text-slate-800"}`}
              >
                <span className="flex items-center gap-1.5">
                  {i.pinned && <Pin className="h-3.5 w-3.5 shrink-0 text-slate-500" aria-label="Закачена" />}
                  {i.important && <BellRing className="h-3.5 w-3.5 shrink-0 text-amber-600" aria-label="Важно" />}
                  <span className="truncate">{i.title}</span>
                </span>
                {i.eventDate && (
                  <span className="block text-xs font-normal text-slate-500">
                    {new Date(`${i.eventDate}T12:00:00Z`).toLocaleDateString("bg-BG", { weekday: "short", day: "numeric", month: "long" })}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
