import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { KG } from "@/config/kindergarten";
import { monthLabel, monthRange, publicShowcaseWhere, SHOWCASE_INCLUDE, toShowcaseView } from "@/lib/showcase";
import { showcaseKind, type ShowcaseItemView } from "@/lib/showcase-shared";
import { AGE_SHORT, directionLabel } from "@/services/materialText";
import { BulletinQr, PrintButton } from "@/components/showcase/BulletinFooter";
import type { AgeGroup } from "@/types";

export const dynamic = "force-dynamic";

async function load(ym: string) {
  const range = monthRange(ym);
  if (!range) return null;
  const rows = await prisma.showcaseItem.findMany({
    where: publicShowcaseWhere({ publishedAt: { gte: range.from, lt: range.to } }),
    include: SHOWCASE_INCLUDE,
    orderBy: { publishedAt: "asc" },
  });
  return rows.map((r) => toShowcaseView(r, { forPublic: true }));
}

export async function generateMetadata({ params }: { params: Promise<{ ym: string }> }): Promise<Metadata> {
  const { ym } = await params;
  return { title: `Какво правихме през ${monthLabel(ym)}` };
}

/** Месечният бюлетин за таблото: одобрените дейности за месеца, по групи, с QR код към витрината. */
export default async function BulletinPage({ params }: { params: Promise<{ ym: string }> }) {
  const { ym } = await params;
  const items = await load(ym);
  if (!items) notFound();
  const groups = (["1", "2", "3", "4"] as AgeGroup[])
    .map((g) => ({ g, items: items.filter((i) => i.ageGroup === g) }))
    .filter((x) => x.items.length > 0);

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link href="/vitrina" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Витрината
        </Link>
        {items.length > 0 && <PrintButton />}
      </div>

      <article className="print-sheet mx-auto w-full max-w-[210mm] bg-white p-6 text-slate-900 shadow-sm ring-1 ring-slate-200 sm:p-10">
        <header className="border-b-2 border-slate-900 pb-4 text-center">
          <p className="text-sm font-semibold text-[#4d7a0a]">
            {KG.fullName}, {KG.village}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Какво правихме през {monthLabel(ym)}</h1>
        </header>

        {groups.length === 0 ? (
          <p className="mt-8 text-center text-slate-600">През този месец още няма дейности на витрината.</p>
        ) : (
          groups.map(({ g, items: list }) => (
            <section key={g} className="mt-6">
              <h2 className="text-xl font-bold text-[#4d7a0a]">{AGE_SHORT[g]}</h2>
              <div className="mt-3 space-y-4">
                {list.map((item) => (
                  <BulletinEntry key={item.id} item={item} />
                ))}
              </div>
            </section>
          ))
        )}

        <BulletinQr />
      </article>
    </main>
  );
}

function BulletinEntry({ item }: { item: ShowcaseItemView }) {
  const dir = directionLabel(item.direction);
  const cover = item.images[0];
  return (
    <div className="flex break-inside-avoid gap-4 rounded-xl border border-slate-200 p-4">
      {cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cover.url} alt="" className="h-28 w-28 shrink-0 rounded-lg object-cover sm:h-32 sm:w-32" />
      )}
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-500">
          {showcaseKind(item).label}
          {dir ? ` · ${dir}` : ""} · {item.author.name}
        </p>
        <h3 className="mt-0.5 font-bold">
          <Link href={`/vitrina/${item.id}`} className="hover:text-[#4d7a0a]">
            {item.title}
          </Link>
        </h3>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{item.story}</p>
      </div>
    </div>
  );
}
