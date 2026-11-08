import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Какво правим в „Пролет“",
  description: "Игри, работни листове и дейности, които учителите от ДГ „Пролет“, с. Ягодово, са правили с децата.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
