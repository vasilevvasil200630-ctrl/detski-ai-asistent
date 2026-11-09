"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, Loader2, Pencil, Plus, QrCode, Trash2, Users } from "lucide-react";
import { toast } from "@/components/Toaster";
import { AGE_LABEL, type GroupView } from "@/lib/parents-shared";

async function api<T>(url: string, init: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json" } });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data.error ?? "Нещо се обърка. Опитайте пак.");
  return data;
}

const field = "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#0a4b82] focus:outline-none focus:ring-2 focus:ring-[#0a4b82]/20";

/**
 * Групите на градината: директорът ги създава, а учителите слага в тях от „Длъжност и група“.
 * Всяка група има публична страница за родителите (/grupi/…).
 */
export function GroupsSection({ groups, onChange }: { groups: GroupView[]; onChange: () => Promise<void> | void }) {
  const [name, setName] = useState("");
  const [ageGroup, setAgeGroup] = useState("1");
  const [busy, setBusy] = useState(false);

  async function create() {
    setBusy(true);
    try {
      await api("/api/admin/groups", { method: "POST", body: JSON.stringify({ name: name.trim(), ageGroup }) });
      toast("Групата е създадена. Сложете учителите в нея от „Длъжност и група“.", "success");
      setName("");
      await onChange();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Не успях.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function rename(g: GroupView) {
    const next = window.prompt("Ново име на групата (без възрастта):", g.name)?.trim();
    if (!next || next === g.name) return;
    try {
      await api(`/api/admin/groups/${g.id}`, { method: "PATCH", body: JSON.stringify({ name: next }) });
      toast("Името е сменено. Адресът на страницата остава същият.", "success");
      await onChange();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Не успях.", "error");
    }
  }

  async function remove(g: GroupView) {
    if (!window.confirm(`Да изтрия ли ${g.label}? Учителите остават без група, а публикациите за родителите на групата се изтриват.`)) return;
    try {
      await api(`/api/admin/groups/${g.id}`, { method: "DELETE" });
      toast("Групата е изтрита.", "success");
      await onChange();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Не успях.", "error");
    }
  }

  return (
    <section aria-labelledby="groups-title" className="mt-8">
      <h2 id="groups-title" className="flex items-center gap-2 text-lg font-bold text-slate-900">
        <Users className="h-5 w-5 text-slate-500" aria-hidden /> Групи <span className="text-sm font-normal text-slate-400">{groups.length}</span>
      </h2>
      <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-600">
        Всяка група има страница за родителите с одобреното от вас: темата на седмицата, покани и писма, обяви, стихчета и песни. Сложете
        учителите в групата им от „Длъжност и група“.
      </p>
      {groups.length > 0 && (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {groups.map((g) => (
            <li key={g.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{g.label}</p>
                  <p className="mt-0.5 text-sm text-slate-600">
                    {g.teachers.length ? g.teachers.map((t) => `${t.avatar} ${t.name}`).join(", ") : "Още няма учители"}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button type="button" onClick={() => void rename(g)} aria-label={`Преименувай ${g.label}`} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100">
                    <Pencil className="h-4 w-4" aria-hidden />
                  </button>
                  <button type="button" onClick={() => void remove(g)} aria-label={`Изтрий ${g.label}`} className="rounded-md p-1.5 text-rose-600 hover:bg-rose-50">
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                <Link href={`/grupi/${g.slug}`} target="_blank" className="inline-flex items-center gap-1 text-sm font-semibold text-[#0a4b82] hover:underline">
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden /> Страницата за родителите
                </Link>
                <Link href={`/showcase/qr?grupa=${g.slug}&ime=${encodeURIComponent(g.label)}`} className="inline-flex items-center gap-1 text-sm font-semibold text-[#0a4b82] hover:underline">
                  <QrCode className="h-3.5 w-3.5" aria-hidden /> QR за групата
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void create();
        }}
        className="mt-4 flex flex-wrap items-end gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-4"
      >
        <label className="text-sm font-medium text-slate-700">
          Нова група
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="напр. Пчелички" maxLength={40} required minLength={2} className={`mt-1 block w-48 ${field}`} />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Възраст
          <select value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)} className={`mt-1 block ${field}`}>
            {Object.entries(AGE_LABEL).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={busy || name.trim().length < 2} className="inline-flex items-center gap-1.5 rounded-lg bg-[#0a4b82] px-4 py-2 text-sm font-semibold text-white hover:bg-[#083861] disabled:opacity-60">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />} Създай
        </button>
      </form>
    </section>
  );
}
