import type { Metadata } from "next";
import { getSession } from "@/lib/auth/session";
import { ParentHome } from "@/components/home/ParentHome";
import { TeacherHome } from "@/components/home/TeacherHome";

export const dynamic = "force-dynamic";

/** Заглавието за търсачките и родителите; влезлите учители виждат „Начало“. */
export async function generateMetadata(): Promise<Metadata> {
  if (await getSession()) return { title: { absolute: "Начало · ДГ „Пролет“" } };
  return {
    title: { absolute: "ДГ „Пролет“, с. Ягодово — какво правим с децата" },
    description:
      "Игри, дейности и празници от групите на ДГ „Пролет“, с. Ягодово — за родителите и гостите на градината. Без снимки на деца, без регистрация.",
  };
}

/** Начало: за родителите и гостите — какво правим с децата; за влезлите учители — таблото. */
export default async function Home() {
  const session = await getSession();
  return session ? <TeacherHome /> : <ParentHome />;
}
