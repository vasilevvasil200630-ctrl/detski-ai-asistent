"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Camera, Check, ChevronDown, ExternalLink, Loader2, Pencil, Store, Trash2, Undo2 } from "lucide-react";
import { useMe } from "@/lib/client/useMe";
import { toast } from "@/components/Toaster";
import { AGE_SHORT, directionLabel } from "@/services/materialText";
import { SHOWCASE_STATUS_LABELS, showcaseKind, type ShowcaseItemView } from "@/lib/showcase-shared";
import { ProposeShowcaseDialog } from "./ProposeShowcaseDialog";
import { ShowcaseItemBody } from "./ShowcaseItemBody";

type Tab = "mine" | "review";

const STATUS_STYLE: Record<ShowcaseItemView["status"], string> = {
  PENDING: "bg-amber-100 text-amber-900",
  APPROVED: "bg-emerald-100 text-emerald-900",
  RETURNED: "bg-rose-100 text-rose-900",
};

async function api<T>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
    const data = (await res.json().catch(() => ({}))) as T & { error?: string };
    if (!res.ok) {
      toast(data.error ?? "Действието не успя.", "error");
      return null;
    }
    return data;
  } catch {
    toast("Няма връзка със сървъра.", "error");
    return null;
  }
}

/** „Витрина за родители“ за учителите: моите предложения; за директора — и одобрението. */
export function ShowcaseModule() {
  const { user } = useMe();
  const isAdmin = user?.kgRole === "ADMIN";
  const [tab, setTab] = useState<Tab>("mine");
  const [mine, setMine] = useState<ShowcaseItemView[] | null>(null);
  const [review, setReview] = useState<{ pending: ShowcaseItemView[]; published: ShowcaseItemView[] } | null>(null);
  const [editing, setEditing] = useState<ShowcaseItemView | null>(null);
  const [newActivity, setNewActivity] = useState(false);

  // „Днес в групата“ от началната страница: /showcase?new=1 отваря прозореца веднага
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("new") === "1") {
      setNewActivity(true);
      window.history.replaceState(null, "", "/showcase");
    }
  }, []);

  const loadMine = useCallback(async () => {
    const data = await api<{ items: ShowcaseItemView[] }>("/api/showcase");
    setMine(data?.items ?? []);
  }, []);
  const loadReview = useCallback(async () => {
    const data = await api<{ pending: ShowcaseItemView[]; published: ShowcaseItemView[] }>("/api/showcase/review");
    setReview(data ?? { pending: [], published: [] });
  }, []);

  useEffect(() => {
    void loadMine();
  }, [loadMine]);
  useEffect(() => {
    if (isAdmin) void loadReview();
  }, [isAdmin, loadReview]);

  const remove = async (item: ShowcaseItemView) => {
    if (!window.confirm(`Да сваля ли „${item.title}“ от витрината и да изтрия предложението?`)) return;
    if (await api(`/api/showcase/${item.id}`, { method: "DELETE" })) {
      toast("Свалено от витрината.", "success");
      void loadMine();
      if (isAdmin) void loadReview();
    }
  };

  const decide = async (item: ShowcaseItemView, action: "approve" | "return") => {
    let note: string | null = null;
    if (action === "return") {
      note = window.prompt(
        item.status === "APPROVED" ? "Защо сваляте дейността от витрината? (колегата ще види бележката)" : "Какво да промени колегата?",
      );
      if (!note || note.trim().length < 3) return;
    }
    const data = await api<{ item: ShowcaseItemView }>(`/api/showcase/${item.id}/review`, {
      method: "POST",
      body: JSON.stringify(action === "approve" ? { action } : { action, note }),
    });
    if (data) {
      toast(action === "approve" ? "Одобрено — вече е на витрината." : "Върнато на колегата.", "success");
      void loadReview();
      void loadMine();
    }
  };

  const pendingCount = review?.pending.length ?? 0;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            <Store className="h-7 w-7 text-[#0a4b82]" aria-hidden /> Витрина за родители
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Най-хубавото, което сте правили с децата, може да се покаже на родителите. Снимайте рисунките и изработеното с „Днес в групата“
            или предложете материал от „Моята библиотека“ с бутона „За витрината“. Директорът одобрява, преди да стане публично. Без снимки
            с деца.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setNewActivity(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0a4b82] px-4 py-2 text-sm font-semibold text-white hover:bg-[#083861]"
          >
            <Camera className="h-4 w-4" aria-hidden /> Днес в групата
          </button>
          <Link
            href="/vitrina"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#0a4b82] hover:bg-slate-50"
          >
            Публичната витрина <ExternalLink className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>

      {isAdmin && (
        <div className="mt-5 flex gap-2" role="tablist" aria-label="Изглед">
          {(["mine", "review"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold ${tab === t ? "bg-[#0a4b82] text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
            >
              {t === "mine" ? "Моите предложения" : `За одобрение${pendingCount ? ` · ${pendingCount}` : ""}`}
            </button>
          ))}
        </div>
      )}

      {tab === "mine" && (
        <section className="mt-6">
          {mine === null ? (
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" aria-label="Зареждане" />
          ) : mine.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
              <p>Още не сте предложили нищо за витрината.</p>
              <Link href="/library" className="mt-3 inline-block font-semibold text-[#0a4b82] hover:underline">
                Към моята библиотека →
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {mine.map((item) => (
                <ItemRow key={item.id} item={item}>
                  {item.status === "RETURNED" && item.reviewNote && (
                    <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-900">
                      <strong>Бележка от директора:</strong> {item.reviewNote}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {item.status === "APPROVED" && (
                      <Link href={`/vitrina/${item.id}`} target="_blank" className={BTN}>
                        <ExternalLink className="h-4 w-4" aria-hidden /> Виж на витрината
                      </Link>
                    )}
                    <button type="button" onClick={() => setEditing(item)} className={BTN}>
                      <Pencil className="h-4 w-4" aria-hidden /> Промени
                    </button>
                    <button type="button" onClick={() => remove(item)} className={`${BTN} text-rose-700`}>
                      <Trash2 className="h-4 w-4" aria-hidden /> {item.status === "APPROVED" ? "Свали от витрината" : "Оттегли"}
                    </button>
                  </div>
                </ItemRow>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === "review" && isAdmin && (
        <section className="mt-6 space-y-8">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Чакат одобрение</h2>
            {review === null ? (
              <Loader2 className="mt-3 h-6 w-6 animate-spin text-slate-400" aria-label="Зареждане" />
            ) : review.pending.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">Няма нови предложения.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {review.pending.map((item) => (
                  <ItemRow key={item.id} item={item} showAuthor open>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => decide(item, "approve")} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                        <Check className="h-4 w-4" aria-hidden /> Одобри
                      </button>
                      <button type="button" onClick={() => decide(item, "return")} className={BTN}>
                        <Undo2 className="h-4 w-4" aria-hidden /> Върни за промяна
                      </button>
                    </div>
                  </ItemRow>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">На витрината</h2>
            {review && review.published.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">Още няма одобрени дейности.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {review?.published.map((item) => (
                  <ItemRow key={item.id} item={item} showAuthor>
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/vitrina/${item.id}`} target="_blank" className={BTN}>
                        <ExternalLink className="h-4 w-4" aria-hidden /> Виж
                      </Link>
                      <button type="button" onClick={() => decide(item, "return")} className={`${BTN} text-rose-700`}>
                        <Undo2 className="h-4 w-4" aria-hidden /> Свали и върни на колегата
                      </button>
                    </div>
                  </ItemRow>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      {newActivity && user && (
        <ProposeShowcaseDialog
          activityAgeGroup={user.ageGroup}
          onClose={() => setNewActivity(false)}
          onDone={() => {
            setNewActivity(false);
            setTab("mine");
            void loadMine();
            if (isAdmin) void loadReview();
          }}
        />
      )}

      {editing && (
        <ProposeShowcaseDialog
          item={editing}
          onClose={() => setEditing(null)}
          onDone={() => {
            setEditing(null);
            void loadMine();
            if (isAdmin) void loadReview();
          }}
        />
      )}
    </main>
  );
}

const BTN = "inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50";

function ItemRow({ item, showAuthor = false, open = false, children }: { item: ShowcaseItemView; showAuthor?: boolean; open?: boolean; children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(open);
  const dir = directionLabel(item.direction);
  return (
    <li className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-500">
            {showcaseKind(item).label} · {AGE_SHORT[item.ageGroup]}
            {dir ? ` · ${dir}` : ""}
            {showAuthor ? ` · ${item.author.avatar} ${item.author.name}` : ""}
          </p>
          <h3 className="mt-0.5 font-bold text-slate-900">{item.title}</h3>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_STYLE[item.status]}`}>{SHOWCASE_STATUS_LABELS[item.status]}</span>
      </div>
      <button type="button" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded} className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[#0a4b82]">
        <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} aria-hidden /> {expanded ? "Скрий" : "Виж какво ще видят родителите"}
      </button>
      {expanded && (
        <div className="mt-3 rounded-xl bg-slate-50 p-4">
          <ShowcaseItemBody item={item} showPrint={false} />
        </div>
      )}
      <div className="mt-3 space-y-3">{children}</div>
    </li>
  );
}
