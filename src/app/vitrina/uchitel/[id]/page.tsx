import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { KG } from "@/config/kindergarten";
import { publicShowcaseWhere, SHOWCASE_INCLUDE, toShowcaseView } from "@/lib/showcase";
import { ShowcaseCard } from "@/components/showcase/ShowcaseCards";
import { AGE_SHORT } from "@/services/materialText";

export const dynamic = "force-dynamic";

async function load(id: string) {
  const teacher = await prisma.user.findFirst({
    where: { id, kindergartenId: KG.id },
    select: { id: true, name: true, avatar: true, groupName: true, ageGroup: true, showcaseBio: true },
  });
  if (!teacher) return null;
  const rows = await prisma.showcaseItem.findMany({
    where: publicShowcaseWhere({ authorId: id }),
    include: SHOWCASE_INCLUDE,
    orderBy: { publishedAt: "desc" },
  });
  // Учител без одобрени дейности не се показва публично
  return rows.length ? { teacher, items: rows.map((r) => toShowcaseView(r, { forPublic: true })) } : null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const data = await load((await params).id);
  return data ? { title: data.teacher.name } : { title: "Учителят не е намерен" };
}

/** Страницата на учител: кратко представяне и всичките му дейности на витрината. */
export default async function ShowcaseTeacherPage({ params }: { params: Promise<{ id: string }> }) {
  const data = await load((await params).id);
  if (!data) notFound();
  const { teacher, items } = data;
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <Link href="/vitrina" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Витрината
      </Link>
      <header className="mt-5 flex items-center gap-4">
        <span className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-sky-50 text-5xl" aria-hidden>
          {teacher.avatar}
        </span>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{teacher.name}</h1>
          <p className="text-slate-600">{teacher.groupName || AGE_SHORT[teacher.ageGroup]}</p>
        </div>
      </header>
      {teacher.showcaseBio && <p className="mt-4 max-w-3xl whitespace-pre-wrap leading-relaxed text-slate-700">{teacher.showcaseBio}</p>}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <ShowcaseCard key={item.id} item={item} showAuthor={false} />
        ))}
      </div>
    </main>
  );
}
