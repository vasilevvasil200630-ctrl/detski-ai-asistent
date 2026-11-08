import type { Metadata } from "next";

export const metadata: Metadata = { title: "Витрина за родители" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
