"use client";

import { useState } from "react";
import Link from "next/link";
import { Library, Loader2 } from "lucide-react";
import { useMe } from "@/lib/client/useMe";
import { MaterialBrowser } from "@/components/MaterialBrowser";
import { AddMaterialForm } from "@/components/AddMaterialForm";

/** Моята библиотека: всичко запазено от учителя, подредено по възрастови групи. */
export default function LibraryPage() {
  const { user, loading } = useMe();
  const [refreshKey, setRefreshKey] = useState(0);
  const [showForm, setShowForm] = useState(false);

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" aria-label="Зареждане" />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto w-full max-w-xl px-4 py-16 text-center">
        <Library className="mx-auto h-10 w-10 text-indigo-600" />
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">Моята библиотека</h1>
        <p className="mt-3 leading-relaxed text-slate-600">
          Влезте, за да запазвате игри, ДОС планове и помощни материали в профила си по възрастови групи и да ги споделяте с
          колегите от детската градина.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/login?callbackUrl=/library" className="rounded-lg bg-indigo-600 px-5 py-2.5 font-semibold text-white hover:bg-indigo-700">
            Вход
          </Link>
          <Link href="/register" className="rounded-lg border border-slate-300 px-5 py-2.5 font-semibold text-slate-800 hover:bg-slate-50">
            Регистрация
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="border-b border-slate-200 pb-6 sm:p-8">
        <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">
          <Library className="h-7 w-7" /> Моята библиотека
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-600 sm:text-base">
          Всичко, което сте създали или генерирали – игри, ДОС планове, приказки, промптове и собствени материали – подредено по
          възрастови групи. Всеки материал може да се сподели с колегите
          {user.kindergarten ? ` от ${user.kindergarten.name}` : ""}.
        </p>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="mt-4 rounded-xl bg-white px-4 py-2 text-sm font-bold text-indigo-800 hover:bg-slate-100"
        >
          {showForm ? "Скрий формата" : "Добави собствен материал"}
        </button>
      </div>

      {showForm && (
        <AddMaterialForm
          defaultAgeGroup={user.ageGroup}
          canShare={Boolean(user.kindergarten)}
          onCreated={() => {
            setRefreshKey((k) => k + 1);
            setShowForm(false);
          }}
        />
      )}

      <MaterialBrowser
        scope="mine"
        initialAgeGroup={user.ageGroup}
        refreshKey={refreshKey}
        emptyText="Тук още няма материали за тази група. Генерирайте игра или ДОС план и натиснете „Запази в моята библиотека“."
      />
    </main>
  );
}
