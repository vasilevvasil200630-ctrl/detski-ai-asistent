import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { KG, KG_SIGNATURE } from "@/config/kindergarten";
import { groupLabel } from "@/lib/parents-shared";
import { publicPostsWhere } from "@/lib/parents";
import { isPrintable } from "@/services/printables";
import { PrintableSheet } from "@/components/print/PrintableSheet";
import { PrintButton } from "@/components/showcase/BulletinFooter";

export const dynamic = "force-dynamic";

async function load(slug: string, id: string) {
  const row = await prisma.parentPost.findFirst({
    where: publicPostsWhere({ id, group: { slug, kindergartenId: KG.id } }),
    include: { group: { select: { name: true, ageGroup: true, slug: true } } },
  });
  return row && row.group ? row : null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; id: string }> }): Promise<Metadata> {
  const { slug, id } = await params;
  const row = await load(slug, id);
  return row ? { title: row.title } : { title: "Не е намерено" };
}

/** Покана, писмо или стихче за печат вкъщи — само одобреното за групата. */
export default async function ParentPostPrintPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const row = await load(slug, id);
  if (!row || !row.group) notFound();
  const printable = isPrintable(row.printable) ? row.printable : null;
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 print:p-0">
      <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link href={`/grupi/${row.group.slug}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" aria-hidden /> {groupLabel(row.group)}
        </Link>
        <PrintButton label="Отпечатай" />
      </div>
      {printable ? (
        <PrintableSheet item={printable} />
      ) : (
        <article className="print-sheet mx-auto max-w-[210mm] bg-white p-8 shadow-sm ring-1 ring-slate-200 sm:p-10">
          <p className="text-xs font-semibold text-slate-500">
            {KG_SIGNATURE} · {groupLabel(row.group)}
          </p>
          <h1 className="mt-1 text-2xl font-bold">{row.title}</h1>
          <div className="mt-6 whitespace-pre-wrap text-[17px] leading-relaxed">{row.body}</div>
          <p className="mt-8 text-sm text-slate-500">{KG.fullName}, {KG.village}</p>
        </article>
      )}
    </main>
  );
}
