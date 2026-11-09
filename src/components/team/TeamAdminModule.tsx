"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  Check,
  Copy,
  KeyRound,
  Loader2,
  Lock,
  LockOpen,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  ShieldOff,
  Trash2,
  UserMinus,
  X,
} from "lucide-react";
import { toast } from "@/components/Toaster";
import { GroupsSection } from "./GroupsSection";
import type { GroupView } from "@/lib/parents-shared";
import { AGE_SHORT } from "@/services/materialText";

type Member = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  jobTitle: string;
  ageGroup: string;
  groupName: string;
  groupId: string | null;
  role: "ADMIN" | "TEACHER";
  me: boolean;
  mustChangePassword: boolean;
  joinedAt: string;
  removedAt: string | null;
  materials: number;
  files: number;
};

type TeamData = {
  kindergarten: { name: string; joinCode: string; teacherSignupOpen: boolean } | null;
  members: Member[];
  removed: Member[];
};

const JOB_TITLES = [
  "Директор",
  "Заместник-директор",
  "Главен учител",
  "Старши учител",
  "Учител",
  "Музикален ръководител",
  "Логопед",
  "Психолог",
  "Помощник-възпитател",
];

async function api<T>(url: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok)
    throw new Error(data.error ?? "Действието не успя. Опитайте пак.");
  return data;
}

const count = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`;

const date = (iso: string) =>
  new Date(iso).toLocaleDateString("bg-BG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const titleId = useId();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current
      ?.querySelector<HTMLElement>("input, button[data-autofocus]")
      ?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center">
      <div
        className="absolute inset-0 bg-slate-900/40"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-lg"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-lg font-bold text-slate-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Затвори"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          toast("Копирането не успя — препишете го ръчно.", "error");
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
    >
      {done ? (
        <Check className="h-4 w-4 text-[#1a7f45]" aria-hidden />
      ) : (
        <Copy className="h-4 w-4" aria-hidden />
      )}
      {done ? "Копирано" : label}
    </button>
  );
}

/** Менюто с действия за един колега. */
function MemberMenu({
  items,
}: {
  items: {
    label: string;
    icon: typeof Pencil;
    onClick: () => void;
    danger?: boolean;
  }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) =>
      !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        <MoreHorizontal className="h-4 w-4" aria-hidden /> Действия
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
        >
          {items.map((it) => (
            <button
              key={it.label}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                it.onClick();
              }}
              className={`flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm hover:bg-slate-50 ${it.danger ? "text-rose-700" : "text-slate-800"}`}
            >
              <it.icon className="h-4 w-4 shrink-0" aria-hidden /> {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

type Dialog =
  | { kind: "temp"; member: Member; password: string; restored?: boolean }
  | { kind: "confirm-reset"; member: Member }
  | { kind: "confirm-remove"; member: Member }
  | { kind: "confirm-delete"; member: Member }
  | { kind: "confirm-code" }
  | { kind: "edit"; member: Member };

/** Панелът на директора: код за регистрация, екипът, роли, временни пароли, премахване. */
export function TeamAdminModule() {
  const [data, setData] = useState<TeamData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [busy, setBusy] = useState(false);
  const [groups, setGroups] = useState<GroupView[]>([]);

  const load = useCallback(async () => {
    try {
      const [team, g] = await Promise.all([
        api<TeamData>("/api/admin/team", { cache: "no-store" }),
        api<{ groups: GroupView[] }>("/api/admin/groups", { cache: "no-store" }),
      ]);
      setData(team);
      setGroups(g.groups);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Екипът не можа да се зареди.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function act(
    member: Member,
    body: Record<string, unknown>,
    success?: string,
  ) {
    setBusy(true);
    try {
      const res = await api<{ ok: true; tempPassword?: string }>(
        `/api/admin/team/${member.id}`,
        { method: "PATCH", body: JSON.stringify(body) },
      );
      if (res.tempPassword)
        setDialog({
          kind: "temp",
          member,
          password: res.tempPassword,
          restored: body.action === "restore",
        });
      else setDialog(null);
      if (success) toast(success, "success");
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Действието не успя.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function deleteForever(member: Member) {
    setBusy(true);
    try {
      await api(`/api/admin/team/${member.id}`, { method: "DELETE" });
      toast(`Профилът на ${member.name} е изтрит.`, "success");
      setDialog(null);
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Изтриването не успя.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function setSignup(open: boolean) {
    setBusy(true);
    try {
      const res = await api<{ open: boolean }>("/api/admin/signup", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ open }),
      });
      setData((d) => (d && d.kindergarten ? { ...d, kindergarten: { ...d.kindergarten, teacherSignupOpen: res.open } } : d));
      toast(res.open ? "Регистрацията на нови учители е отворена." : "Регистрацията е затворена. Нови учители не могат да се регистрират.", "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Не успях да сменя настройката.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function newCode() {
    setBusy(true);
    try {
      const res = await api<{ joinCode: string }>("/api/admin/join-code", {
        method: "POST",
      });
      setData((d) =>
        d && d.kindergarten
          ? {
              ...d,
              kindergarten: { ...d.kindergarten, joinCode: res.joinCode },
            }
          : d,
      );
      toast("Новият код е готов. Старият вече не важи.", "success");
      setDialog(null);
    } catch (e) {
      toast(
        e instanceof Error ? e.message : "Не успях да сменя кода.",
        "error",
      );
    } finally {
      setBusy(false);
    }
  }

  if (error)
    return (
      <p className="mx-auto mt-16 max-w-md rounded-xl bg-rose-50 px-4 py-3 text-center text-sm text-rose-800">
        {error}
      </p>
    );
  if (!data) {
    return (
      <div className="flex justify-center py-24">
        <Loader2
          className="h-7 w-7 animate-spin text-slate-400"
          aria-label="Зареждане"
        />
      </div>
    );
  }

  const admins = data.members.filter((m) => m.role === "ADMIN").length;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <header className="border-b border-slate-200 pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Управление на екипа
        </h1>
        <p className="mt-1.5 max-w-2xl leading-relaxed text-slate-600">
          Кой е в облака на {data.kindergarten?.name ?? "градината"}, кой има
          права на администратор, временни пароли и кодът за нови колеги.
        </p>
      </header>

      <section
        aria-labelledby="code-title"
        className="mt-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h2
            id="code-title"
            className="flex items-center gap-2 text-sm font-semibold text-slate-500"
          >
            <KeyRound className="h-4 w-4" aria-hidden /> Код за регистрация на
            нови колеги
          </h2>
          <p className="mt-1.5 font-mono text-3xl font-bold tracking-wide text-slate-900">
            {data.kindergarten?.joinCode}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Нов колега отваря „Регистрация“ и въвежда този код.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.kindergarten && (
            <CopyButton
              text={data.kindergarten.joinCode}
              label="Копирай кода"
            />
          )}
          <button
            type="button"
            onClick={() => setDialog({ kind: "confirm-code" })}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" aria-hidden /> Смени кода
          </button>
        </div>
      </section>

      {data.kindergarten && (
        <section
          aria-labelledby="signup-title"
          className={`mt-4 flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between ${
            data.kindergarten.teacherSignupOpen ? "border-slate-200 bg-white" : "border-amber-200 bg-amber-50"
          }`}
        >
          <div className="max-w-2xl">
            <h2 id="signup-title" className="flex items-center gap-2 text-sm font-semibold text-slate-500">
              {data.kindergarten.teacherSignupOpen ? <LockOpen className="h-4 w-4" aria-hidden /> : <Lock className="h-4 w-4" aria-hidden />}
              Приемане на нови учители
            </h2>
            <p className="mt-1.5 text-lg font-bold text-slate-900">
              {data.kindergarten.teacherSignupOpen ? "Включено — нови колеги се регистрират с кода" : "Изключено — регистрацията е затворена"}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              {data.kindergarten.teacherSignupOpen
                ? "Когато всички учители са се регистрирали, изключете — тогава никой не може да създаде учителски профил, дори с кода."
                : "Бутонът „Регистрация“ не се показва на сайта, а кодът не работи. Включете отново, когато дойде нов колега."}
            </p>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => void setSignup(!data.kindergarten!.teacherSignupOpen)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60 ${
              data.kindergarten.teacherSignupOpen
                ? "bg-[#0a4b82] text-white hover:bg-[#083861]"
                : "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
            }`}
          >
            {data.kindergarten.teacherSignupOpen ? <Lock className="h-4 w-4" aria-hidden /> : <LockOpen className="h-4 w-4" aria-hidden />}
            {data.kindergarten.teacherSignupOpen ? "Затвори регистрацията" : "Отвори регистрацията"}
          </button>
        </section>
      )}

      <GroupsSection groups={groups} onChange={load} />

      <section aria-labelledby="team-title" className="mt-8">
        <h2 id="team-title" className="text-lg font-bold text-slate-900">
          Екипът{" "}
          <span className="font-normal text-slate-400">
            · {data.members.length}
          </span>
        </h2>
        <ul className="mt-3 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
          {data.members.map((m) => (
            <li
              key={m.id}
              className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-5"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-slate-100 text-xl"
                  aria-hidden
                >
                  {m.avatar}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-semibold text-slate-900">
                    {m.name}
                    {m.me && (
                      <span className="text-sm font-normal text-slate-500">
                        (вие)
                      </span>
                    )}
                    {m.role === "ADMIN" && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-[#eef5fb] px-1.5 py-0.5 text-xs font-medium text-[#0a4b82]">
                        <ShieldCheck className="h-3.5 w-3.5" aria-hidden />{" "}
                        Администратор
                      </span>
                    )}
                    {m.mustChangePassword && (
                      <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-800">
                        С временна парола
                      </span>
                    )}
                  </p>
                  <p className="truncate text-sm text-slate-600">
                    {m.jobTitle}
                    {m.groupName
                      ? ` · ${m.groupName}`
                      : ` · ${AGE_SHORT[m.ageGroup] ?? ""}`}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {m.email} · от {date(m.joinedAt)} ·{" "}
                    {count(m.materials, "материал", "материала")} ·{" "}
                    {count(m.files, "файл", "файла")}
                  </p>
                </div>
              </div>
              <div className="pl-14 sm:pl-0">
                {m.me ? (
                  <button
                    type="button"
                    onClick={() => setDialog({ kind: "edit", member: m })}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Pencil className="h-4 w-4" aria-hidden /> Длъжност и група
                  </button>
                ) : (
                  <MemberMenu
                    items={[
                      {
                        label: "Временна парола",
                        icon: KeyRound,
                        onClick: () =>
                          setDialog({ kind: "confirm-reset", member: m }),
                      },
                      {
                        label: "Длъжност и група",
                        icon: Pencil,
                        onClick: () => setDialog({ kind: "edit", member: m }),
                      },
                      m.role === "ADMIN"
                        ? {
                            label: "Махни правата на администратор",
                            icon: ShieldOff,
                            onClick: () =>
                              void act(
                                m,
                                { action: "role", role: "TEACHER" },
                                `${m.name} вече няма права на администратор.`,
                              ),
                          }
                        : {
                            label: "Направи администратор",
                            icon: ShieldCheck,
                            onClick: () =>
                              void act(
                                m,
                                { action: "role", role: "ADMIN" },
                                `${m.name} вече е администратор.`,
                              ),
                          },
                      {
                        label: "Премахни от екипа",
                        icon: UserMinus,
                        danger: true,
                        onClick: () =>
                          setDialog({ kind: "confirm-remove", member: m }),
                      },
                    ]}
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-slate-500">
          Администраторите ({admins}) виждат този панел и могат да трият
          споделени файлове в облака. Себе си променяте от „Моят профил“.
        </p>
      </section>

      {data.removed.length > 0 && (
        <section aria-labelledby="removed-title" className="mt-8">
          <h2 id="removed-title" className="text-lg font-bold text-slate-900">
            Премахнати от екипа{" "}
            <span className="font-normal text-slate-400">
              · {data.removed.length}
            </span>
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Нямат достъп. Споделеното от тях остава в облака на градината. Профилът и личните им файлове и бележки се
            пазят, докато не го изтриете — изтрийте го, когато колегата напусне окончателно или поиска това.
          </p>
          <ul className="mt-3 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
            {data.removed.map((m) => (
              <li
                key={m.id}
                className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-5"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-slate-100 text-xl opacity-60"
                    aria-hidden
                  >
                    {m.avatar}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-700">{m.name}</p>
                    <p className="truncate text-xs text-slate-500">
                      {m.email} · извън екипа от{" "}
                      {m.removedAt ? date(m.removedAt) : "—"} ·{" "}
                      {count(m.files, "файл", "файла")}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pl-14 sm:pl-0">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void act(
                        m,
                        { action: "restore" },
                        `${m.name} отново е в екипа.`,
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <RotateCcw className="h-4 w-4" aria-hidden /> Върни в екипа
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setDialog({ kind: "confirm-delete", member: m })
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-50"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden /> Изтрий завинаги
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {dialog?.kind === "temp" && (
        <Modal
          title={
            dialog.restored
              ? `${dialog.member.name} е отново в екипа`
              : "Временната парола е готова"
          }
          onClose={() => setDialog(null)}
        >
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            Дайте я на{" "}
            <strong className="font-semibold text-slate-900">
              {dialog.member.name}
            </strong>{" "}
            лично или по телефона. Колегата влиза с имейла{" "}
            <span className="font-medium text-slate-800">
              {dialog.member.email}
            </span>{" "}
            и тази парола, а сайтът подканва да си сложи своя.
          </p>
          <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-center font-mono text-2xl font-bold tracking-wider text-slate-900 select-all">
            {dialog.password}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Паролата се показва само сега. Ако я загубите, създайте нова.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <CopyButton text={dialog.password} label="Копирай паролата" />
            <button
              type="button"
              data-autofocus
              onClick={() => setDialog(null)}
              className="rounded-lg bg-[#0a4b82] px-4 py-1.5 text-sm font-semibold text-white hover:bg-[#083861]"
            >
              Готово
            </button>
          </div>
        </Modal>
      )}

      {dialog?.kind === "confirm-reset" && (
        <Modal
          title={`Временна парола за ${dialog.member.name}`}
          onClose={() => setDialog(null)}
        >
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            Старата парола спира да важи и колегата излиза от профила на всички
            устройства. Ще получите нова парола, която да предадете.
          </p>
          <ConfirmRow
            busy={busy}
            label="Създай временна парола"
            onCancel={() => setDialog(null)}
            onConfirm={() =>
              void act(dialog.member, { action: "resetPassword" })
            }
          />
        </Modal>
      )}

      {dialog?.kind === "confirm-remove" && (
        <Modal
          title={`Да премахна ли ${dialog.member.name}?`}
          onClose={() => setDialog(null)}
        >
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-600">
            <li>Веднага губи достъп до облака и излиза от профила си.</li>
            <li>
              Споделените файлове и материали на колегата остават за екипа.
            </li>
            <li>
              Можете да върнете колегата в екипа по-късно с временна парола.
            </li>
            <li>
              Профилът се пази, докато не го изтриете завинаги от „Премахнати от екипа“.
            </li>
          </ul>
          <ConfirmRow
            danger
            busy={busy}
            label="Премахни от екипа"
            onCancel={() => setDialog(null)}
            onConfirm={() =>
              void act(
                dialog.member,
                { action: "remove" },
                `${dialog.member.name} вече не е в екипа.`,
              )
            }
          />
        </Modal>
      )}

      {dialog?.kind === "confirm-delete" && (
        <Modal
          title={`Да изтрия ли завинаги профила на ${dialog.member.name}?`}
          onClose={() => setDialog(null)}
        >
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            Изтриват се профилът, личният бележник и всичко създадено и качено
            от колегата — и споделените:{" "}
            {count(dialog.member.files, "файл", "файла")} и{" "}
            {count(dialog.member.materials, "материал", "материала")}. Това не
            може да се върне.
          </p>
          <ConfirmRow
            danger
            busy={busy}
            label="Изтрий завинаги"
            onCancel={() => setDialog(null)}
            onConfirm={() => void deleteForever(dialog.member)}
          />
        </Modal>
      )}

      {dialog?.kind === "confirm-code" && (
        <Modal title="Да сменя ли кода?" onClose={() => setDialog(null)}>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            Старият код спира да важи веднага — с него никой вече не може да се
            регистрира. Колегите, които вече са в облака, не се засягат.
          </p>
          <ConfirmRow
            busy={busy}
            label="Създай нов код"
            onCancel={() => setDialog(null)}
            onConfirm={() => void newCode()}
          />
        </Modal>
      )}

      {dialog?.kind === "edit" && (
        <EditMemberDialog
          member={dialog.member}
          groups={groups}
          busy={busy}
          onClose={() => setDialog(null)}
          onSave={(patch) =>
            void act(
              dialog.member,
              { action: "update", ...patch },
              "Промяната е записана.",
            )
          }
        />
      )}
    </main>
  );
}

function ConfirmRow({
  label,
  onConfirm,
  onCancel,
  busy,
  danger,
}: {
  label: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy: boolean;
  danger?: boolean;
}) {
  return (
    <div className="mt-6 flex justify-end gap-2">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
      >
        Откажи
      </button>
      <button
        type="button"
        data-autofocus
        disabled={busy}
        onClick={onConfirm}
        className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 ${danger ? "bg-rose-700 hover:bg-rose-800" : "bg-[#0a4b82] hover:bg-[#083861]"}`}
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}{" "}
        {label}
      </button>
    </div>
  );
}

function EditMemberDialog({
  member,
  groups,
  busy,
  onClose,
  onSave,
}: {
  member: Member;
  groups: GroupView[];
  busy: boolean;
  onClose: () => void;
  onSave: (patch: {
    jobTitle: string;
    groupName?: string;
    ageGroup?: string;
    groupId: string | null;
  }) => void;
}) {
  const [jobTitle, setJobTitle] = useState(member.jobTitle);
  const [groupName, setGroupName] = useState(member.groupName);
  const [ageGroup, setAgeGroup] = useState(member.ageGroup);
  const [groupId, setGroupId] = useState(member.groupId ?? "");
  const field =
    "mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#0a4b82] focus:outline-none focus:ring-2 focus:ring-[#0a4b82]/20";
  return (
    <Modal title={`${member.name}: длъжност и група`} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          // С група възрастта и името идват от нея; без група — както са въведени
          onSave(groupId ? { jobTitle: jobTitle.trim(), groupId } : { jobTitle: jobTitle.trim(), groupName: groupName.trim(), ageGroup, groupId: null });
        }}
      >
        <label className="mt-4 block text-sm font-medium text-slate-700">
          Длъжност
          <input
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            list="job-titles"
            required
            minLength={2}
            maxLength={60}
            className={field}
          />
          <datalist id="job-titles">
            {JOB_TITLES.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </label>
        {groups.length > 0 && (
          <label className="mt-4 block text-sm font-medium text-slate-700">
            Група в градината
            <select value={groupId} onChange={(e) => setGroupId(e.target.value)} className={field}>
              <option value="">— без група —</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs font-normal text-slate-500">Учителят публикува за родителите на тази група.</span>
          </label>
        )}
        {!groupId && (
        <>
        <label className="mt-4 block text-sm font-medium text-slate-700">
          Възрастова група
          <select
            value={ageGroup}
            onChange={(e) => setAgeGroup(e.target.value)}
            className={field}
          >
            {Object.entries(AGE_SHORT).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="mt-4 block text-sm font-medium text-slate-700">
          Име на групата{" "}
          <span className="font-normal text-slate-400">(по желание)</span>
          <input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            maxLength={80}
            placeholder="напр. II група „Пчелички“"
            className={field}
          />
        </label>
        </>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Откажи
          </button>
          <button
            type="submit"
            disabled={busy || jobTitle.trim().length < 2}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0a4b82] px-4 py-2 text-sm font-semibold text-white hover:bg-[#083861] disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}{" "}
            Запази
          </button>
        </div>
      </form>
    </Modal>
  );
}
