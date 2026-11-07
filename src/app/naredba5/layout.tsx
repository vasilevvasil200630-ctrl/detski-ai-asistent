import type { Metadata } from "next";

// Заглавие на страницата в браузъра (самата страница е клиентски компонент)
export const metadata: Metadata = { title: "Наредба № 5 и „Златно ключе“" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
