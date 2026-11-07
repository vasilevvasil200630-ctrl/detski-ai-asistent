"use client";

import { PrintablesModule } from "@/components/PrintablesModule";
import { useMe } from "@/lib/client/useMe";

export default function MaterialsPage() {
  const { user } = useMe();
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <PrintablesModule teacher={user} />
    </main>
  );
}
