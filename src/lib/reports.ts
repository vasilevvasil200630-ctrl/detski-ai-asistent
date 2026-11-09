import "server-only";
import { prisma } from "@/lib/prisma";
import { monthRange } from "@/lib/showcase";
import { groupLabel } from "@/lib/parents-shared";
import { AGE_SHORT } from "@/services/materialText";
import type { MonthlyReport, ReportItem, TeacherReport } from "@/lib/reports-shared";

/**
 * Месечният отчет за директора: какво е направил всеки учител през месеца — създадени игри,
 * план-конспекти и материали за печат, „Изпитано с деца“, дейности на витрината, публикации за
 * родителите и файлове в общия облак. Само активните членове на екипа.
 */
export async function buildMonthlyReport(kindergartenId: string, ym: string): Promise<MonthlyReport | null> {
  const range = monthRange(ym);
  if (!range) return null;
  const inMonth = { gte: range.from, lt: range.to };

  const teachers = await prisma.user.findMany({
    where: { kindergartenId, removedAt: null },
    select: { id: true, name: true, avatar: true, jobTitle: true, ageGroup: true, groupName: true, kgRole: true, group: { select: { name: true, ageGroup: true } } },
    orderBy: [{ kgRole: "asc" }, { name: "asc" }],
  });
  const ids = teachers.map((t) => t.id);

  const [materials, tried, showcase, posts, files, plans] = await Promise.all([
    prisma.material.findMany({ where: { authorId: { in: ids }, createdAt: inMonth }, select: { authorId: true, kind: true, title: true, createdAt: true, shared: true } }),
    prisma.material.findMany({ where: { authorId: { in: ids }, triedAt: inMonth }, select: { authorId: true, title: true, triedAt: true, triedNote: true } }),
    prisma.showcaseItem.findMany({
      where: { authorId: { in: ids }, OR: [{ createdAt: inMonth }, { publishedAt: inMonth }] },
      select: { authorId: true, title: true, status: true, createdAt: true, publishedAt: true },
    }),
    prisma.parentPost.findMany({
      where: { authorId: { in: ids }, OR: [{ createdAt: inMonth }, { publishedAt: inMonth }] },
      select: { authorId: true, title: true, kind: true, status: true, createdAt: true, publishedAt: true },
    }),
    prisma.cloudFile.findMany({ where: { uploaderId: { in: ids }, createdAt: inMonth }, select: { uploaderId: true, title: true, createdAt: true, shared: true } }),
    prisma.thematicPlan.findMany({
      where: { authorId: { in: ids }, OR: [{ createdAt: inMonth }, { updatedAt: inMonth }, { approvedAt: inMonth }] },
      select: { authorId: true, ageGroup: true, schoolYear: true, approvedAt: true, updatedAt: true, weeks: { where: { theme: { not: "" } }, select: { id: true } } },
    }),
  ]);

  const day = (d: Date) => d.toISOString().slice(0, 10);
  const KIND_LABEL = { GAME: "Игра", LESSON: "План-конспект", MATERIAL: "Материал за печат" } as const;

  const report: TeacherReport[] = teachers.map((t) => {
    const items: ReportItem[] = [];
    const mine = materials.filter((m) => m.authorId === t.id);
    for (const m of mine) items.push({ type: KIND_LABEL[m.kind], title: m.title, date: day(m.createdAt), note: m.shared ? "споделено с колегите" : null });
    const myTried = tried.filter((m) => m.authorId === t.id);
    for (const m of myTried) items.push({ type: "Изпитано с деца", title: m.title, date: day(m.triedAt!), note: m.triedNote || null });
    const myShow = showcase.filter((s) => s.authorId === t.id);
    for (const s of myShow) {
      const approvedNow = s.status === "APPROVED" && s.publishedAt && s.publishedAt >= range.from && s.publishedAt < range.to;
      items.push({ type: "Витрина", title: s.title, date: day(approvedNow ? s.publishedAt! : s.createdAt), note: approvedNow ? "одобрено" : s.status === "PENDING" ? "чака одобрение" : s.status === "RETURNED" ? "върнато" : "предложено" });
    }
    const myPosts = posts.filter((p) => p.authorId === t.id);
    for (const p of myPosts) {
      const approvedNow = p.status === "APPROVED" && p.publishedAt && p.publishedAt >= range.from && p.publishedAt < range.to;
      items.push({ type: "За родителите", title: p.title, date: day(approvedNow ? p.publishedAt! : p.createdAt), note: approvedNow ? "публикувано" : p.status === "PENDING" ? "чака одобрение" : p.status === "RETURNED" ? "върнато" : "предложено" });
    }
    const myFiles = files.filter((f) => f.uploaderId === t.id);
    for (const f of myFiles) items.push({ type: "Файл в облака", title: f.title, date: day(f.createdAt), note: f.shared ? "споделен" : "само за себе си" });
    const myPlans = plans.filter((p) => p.authorId === t.id);
    for (const p of myPlans) {
      const approvedNow = p.approvedAt && p.approvedAt >= range.from && p.approvedAt < range.to;
      items.push({
        type: "Тематично разпределение",
        title: `${AGE_SHORT[p.ageGroup] ?? ""} · ${p.schoolYear}/${p.schoolYear + 1}`,
        date: day(approvedNow ? p.approvedAt! : p.updatedAt),
        note: `${p.weeks.length} ${p.weeks.length === 1 ? "седмица" : "седмици"} с тема${approvedNow ? " · утвърдено" : p.approvedAt ? " · утвърдено по-рано" : ""}`,
      });
    }
    items.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

    const counts = {
      games: mine.filter((m) => m.kind === "GAME").length,
      lessons: mine.filter((m) => m.kind === "LESSON").length,
      printables: mine.filter((m) => m.kind === "MATERIAL").length,
      shared: mine.filter((m) => m.shared).length,
      tried: myTried.length,
      showcaseApproved: myShow.filter((s) => s.status === "APPROVED" && s.publishedAt && s.publishedAt >= range.from && s.publishedAt < range.to).length,
      showcaseProposed: myShow.filter((s) => s.createdAt >= range.from && s.createdAt < range.to).length,
      parentApproved: myPosts.filter((p) => p.status === "APPROVED" && p.publishedAt && p.publishedAt >= range.from && p.publishedAt < range.to).length,
      parentProposed: myPosts.filter((p) => p.createdAt >= range.from && p.createdAt < range.to).length,
      files: myFiles.length,
    };
    return {
      id: t.id,
      name: t.name,
      avatar: t.avatar,
      jobTitle: t.jobTitle,
      group: t.group ? groupLabel(t.group) : t.groupName || AGE_SHORT[t.ageGroup] || "",
      isAdmin: t.kgRole === "ADMIN",
      counts,
      total: counts.games + counts.lessons + counts.printables + counts.tried + counts.showcaseProposed + counts.parentProposed + counts.files,
      items: items.slice(0, 80),
    };
  });

  const sum = (k: keyof TeacherReport["counts"]) => report.reduce((s, r) => s + r.counts[k], 0);
  return {
    ym,
    teachers: report,
    totals: {
      games: sum("games"),
      lessons: sum("lessons"),
      printables: sum("printables"),
      shared: sum("shared"),
      tried: sum("tried"),
      showcaseApproved: sum("showcaseApproved"),
      showcaseProposed: sum("showcaseProposed"),
      parentApproved: sum("parentApproved"),
      parentProposed: sum("parentProposed"),
      files: sum("files"),
    },
  };
}
