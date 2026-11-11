import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getSession } from "@/lib/auth/session";
import { PARENT_PREVIEW_COOKIE } from "@/lib/parent-preview";
import { ParentHome } from "@/components/home/ParentHome";
import { TeacherHome } from "@/components/home/TeacherHome";

export const dynamic = "force-dynamic";

/** Учителят, който гледа сайта като родител („Виж като родител“), получава страницата за родителите. */
async function teacherView(): Promise<boolean> {
  if (!(await getSession())) return false;
  return (await cookies()).get(PARENT_PREVIEW_COOKIE)?.value !== "1";
}

/** Заглавието за търсачките и родителите; влезлите учители виждат „Начало“. */
export async function generateMetadata(): Promise<Metadata> {
  if (await teacherView()) return { title: { absolute: "Начало · ДГ „Пролет“" } };
  return {
    title: { absolute: "ДГ „Пролет“, с. Ягодово — какво правим с децата" },
    description:
      "Игри, дейности и празници от групите на ДГ „Пролет“, с. Ягодово — за родителите и гостите на градината. Без снимки на деца, без регистрация.",
  };
}

/** Начало: за родителите и гостите — какво правим с децата; за влезлите учители — таблото. */
export default async function Home() {
  return (await teacherView()) ? <TeacherHome /> : <ParentHome />;
}
