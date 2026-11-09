import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Групите",
  description: "Групите в ДГ „Пролет“, с. Ягодово: темата на седмицата, обяви, покани и стихчета за родителите.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
