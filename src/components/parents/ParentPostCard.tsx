import Link from "next/link";
import { CalendarDays, Printer } from "lucide-react";
import type { ParentPostView } from "@/lib/parents-shared";

const dateLabel = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("bg-BG", { day: "numeric", month: "long", weekday: "long", timeZone: "UTC" });

/** Публикация за родителите на страницата на групата или на началната страница. */
export function ParentPostCard({ post, printHref }: { post: ParentPostView; printHref?: string }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        {post.eventDate && (
          <span className="inline-flex items-center gap-1 font-semibold text-[#4d7a0a]">
            <CalendarDays className="h-4 w-4" aria-hidden /> {dateLabel(post.eventDate)}
          </span>
        )}
        <span className="text-slate-500">
          {post.author.avatar} {post.author.name}
        </span>
      </div>
      <h3 className="mt-2 text-lg font-bold text-slate-900">{post.title}</h3>
      <p className="mt-2 whitespace-pre-wrap leading-relaxed text-slate-700">{post.body}</p>
      {printHref && (
        <Link href={printHref} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#4d7a0a] hover:underline">
          <Printer className="h-4 w-4" aria-hidden /> Отпечатай
        </Link>
      )}
    </article>
  );
}
