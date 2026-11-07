import type { Metadata } from "next";

// Заглавие на страницата в браузъра (самата страница е клиентски компонент)
export const metadata: Metadata = { title: "План-конспект по ДОС" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
