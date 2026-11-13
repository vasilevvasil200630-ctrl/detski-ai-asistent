import Link from "next/link";
import { AGE_SHORT, directionLabel } from "@/services/materialText";
import { showcaseKind, type ShowcaseItemView, type ShowcaseTeacher } from "@/lib/showcase-shared";

/** Карта на учител на публичната витрина. */
export function TeacherCard({ teacher, count }: { teacher: ShowcaseTeacher; count: number }) {
  return (
    <Link
      href={`/vitrina/uchitel/${teacher.id}`}
      className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-[#4d7a0a]/40 hover:bg-sky-50/40"
    >
      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-sky-50 text-3xl" aria-hidden>
        {teacher.avatar}
      </span>
      <span className="min-w-0">
        <span className="block truncate font-bold text-slate-900">{teacher.name}</span>
        <span className="block truncate text-sm text-slate-600">{teacher.groupName || AGE_SHORT[teacher.ageGroup]}</span>
        <span className="mt-0.5 block text-xs font-semibold text-[#4d7a0a]">
          {count} {count === 1 ? "дейност" : "дейности"}
        </span>
      </span>
    </Link>
  );
}

/** Карта на дейност от витрината. */
export function ShowcaseCard({ item, showAuthor = true }: { item: ShowcaseItemView; showAuthor?: boolean }) {
  const dir = directionLabel(item.direction);
  const cover = item.images[0];
  return (
    <Link
      href={`/vitrina/${item.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-colors hover:border-[#4d7a0a]/40"
    >
      {cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cover.url} alt="" className="aspect-[4/3] w-full object-cover" loading="lazy" />
      ) : (
        <div className="grid aspect-[4/3] w-full place-items-center bg-gradient-to-br from-sky-50 to-amber-50 text-6xl" aria-hidden>
          {showcaseKind(item).emoji}
        </div>
      )}
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-semibold text-slate-500">
          {item.activity ? "Днес в групата · " : ""}
          {AGE_SHORT[item.ageGroup]}
          {dir ? ` · ${dir}` : ""}
        </p>
        <h3 className="mt-1 font-bold text-slate-900 group-hover:text-[#4d7a0a]">{item.title}</h3>
        <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-slate-600">{item.story}</p>
        {showAuthor && (
          <p className="mt-auto pt-3 text-xs font-semibold text-slate-500">
            {item.author.avatar} {item.author.name}
          </p>
        )}
      </div>
    </Link>
  );
}
