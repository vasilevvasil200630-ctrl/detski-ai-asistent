import type { Metadata } from "next";

export const metadata: Metadata = { title: "За родителите" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
