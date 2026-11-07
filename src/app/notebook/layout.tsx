import type { Metadata } from "next";

export const metadata: Metadata = { title: "Моят бележник" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
