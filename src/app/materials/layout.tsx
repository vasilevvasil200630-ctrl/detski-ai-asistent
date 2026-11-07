import type { Metadata } from "next";

// Заглавие на страницата в браузъра (самата страница е клиентски компонент)
export const metadata: Metadata = { title: "Материали за печат" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
