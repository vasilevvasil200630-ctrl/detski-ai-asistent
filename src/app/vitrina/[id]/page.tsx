import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { publicShowcaseWhere, SHOWCASE_INCLUDE, toShowcaseView } from "@/lib/showcase";
import { ShowcaseItemBody } from "@/components/showcase/ShowcaseItemBody";
import { AGE_SHORT, directionLabel } from "@/services/materialText";
import { showcaseKind } from "@/lib/showcase-shared";

export const dynamic = "force-dynamic";

async function load(id: string) {
  const row = await prisma.showcaseItem.findFirst({ where: publicShowcaseWhere({ id }), include: SHOWCASE_INCLUDE });
  return row ? toShowcaseView(row, { forPublic: true }) : null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const item = await load((await params).id);
  return item ? { title: item.title, description: item.story.slice(0, 160) } : { title: "Дейността не е намерена" };
}

/** Една дейност от витрината: разказ, снимки, играта и печат за вкъщи. */
export default async function ShowcaseItemPage({ params }: { params: Promise<{ id: string }> }) {
  const item = await load((await params).id);
  if (!item) notFound();
  const dir = directionLabel(item.direction);
  const published = item.publishedAt ? new Date(item.publishedAt).toLocaleDateString("bg-BG", { day: "numeric", month: "long", year: "numeric" }) : null;
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <Link href="/vitrina" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Витрината
      </Link>
      <p className="mt-5 text-sm font-semibold text-[#0a4b82]">
        {showcaseKind(item).label} · {AGE_SHORT[item.ageGroup]}
        {dir ? ` · ${dir}` : ""}
      </p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{item.title}</h1>
      <Link href={`/vitrina/uchitel/${item.author.id}`} className="mt-3 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
        <span className="text-xl" aria-hidden>
          {item.author.avatar}
        </span>
        <span>
          <strong className="font-semibold">{item.author.name}</strong>
          {item.author.groupName ? `, ${item.author.groupName}` : ""}
          {published ? ` · ${published}` : ""}
        </span>
      </Link>
      <div className="mt-6">
        <ShowcaseItemBody item={item} />
      </div>
    </main>
  );
}
