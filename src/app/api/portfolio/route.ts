import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { AUTH_REQUIRED } from "@/lib/teacher";
import type { PortfolioData } from "@/lib/portfolio-shared";
import { schoolYearOf } from "@/lib/portfolio-shared";

/**
 * Портфолио на учителя за учебната година (1 септември – 31 август): какво е създал и споделил,
 * какво е изпитал с децата и какво е показано на витрината. За атестацията и за личен преглед.
 */
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json(AUTH_REQUIRED, { status: 401 });

  const yearParam = Number(new URL(request.url).searchParams.get("year"));
  const year = Number.isInteger(yearParam) && yearParam >= 2020 && yearParam <= 2100 ? yearParam : schoolYearOf(new Date());
  const from = new Date(Date.UTC(year, 8, 1));
  const to = new Date(Date.UTC(year + 1, 8, 1));
  const inYear = { gte: from, lt: to };
  const userId = session.userId;

  const [me, materials, tried, showcase, files] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, jobTitle: true, groupName: true, ageGroup: true, createdAt: true, kindergarten: { select: { name: true, city: true } } },
    }),
    prisma.material.findMany({
      where: { authorId: userId, createdAt: inYear },
      select: { id: true, kind: true, title: true, direction: true, shared: true, content: true, _count: { select: { likes: true } } },
    }),
    prisma.material.findMany({
      where: { authorId: userId, triedAt: inYear },
      select: { id: true, kind: true, title: true, ageGroup: true, direction: true, triedAt: true, triedNote: true },
      orderBy: { triedAt: "asc" },
    }),
    prisma.showcaseItem.findMany({
      where: { authorId: userId, status: "APPROVED", publishedAt: inYear },
      select: { id: true, title: true, kind: true, ageGroup: true, content: true, publishedAt: true },
      orderBy: { publishedAt: "asc" },
    }),
    prisma.cloudFile.findMany({ where: { uploaderId: userId, createdAt: inYear }, select: { shared: true } }),
  ]);
  if (!me) return NextResponse.json(AUTH_REQUIRED, { status: 401 });

  const copies = materials.length
    ? await prisma.material.count({ where: { copiedFromId: { in: materials.map((m) => m.id) }, NOT: { authorId: userId } } })
    : 0;

  const byKind = { GAME: 0, LESSON: 0, MATERIAL: 0 };
  const byDirection: Record<string, number> = {};
  let withTasks = 0;
  for (const m of materials) {
    byKind[m.kind] += 1;
    if (m.direction) byDirection[m.direction] = (byDirection[m.direction] ?? 0) + 1;
    const content = m.content as { tasks?: unknown[] } | null;
    if (m.kind === "GAME" && Array.isArray(content?.tasks) && content.tasks.length > 0) withTasks += 1;
  }

  const data: PortfolioData = {
    year,
    teacher: {
      name: me.name,
      jobTitle: me.jobTitle,
      groupName: me.groupName,
      ageGroup: me.ageGroup as PortfolioData["teacher"]["ageGroup"],
      kindergarten: me.kindergarten ? `${me.kindergarten.name}${me.kindergarten.city ? `, ${me.kindergarten.city}` : ""}` : "",
    },
    totals: {
      materials: materials.length,
      byKind,
      byDirection,
      gamesWithTasks: withTasks,
      shared: materials.filter((m) => m.shared).length,
      likes: materials.reduce((n, m) => n + m._count.likes, 0),
      copies,
      tried: tried.length,
      showcase: showcase.length,
      files: files.length,
      filesShared: files.filter((f) => f.shared).length,
    },
    topLiked: materials
      .filter((m) => m._count.likes > 0)
      .sort((a, b) => b._count.likes - a._count.likes)
      .slice(0, 5)
      .map((m) => ({ id: m.id, title: m.title, kind: m.kind, likes: m._count.likes })),
    tried: tried.map((m) => ({
      id: m.id,
      title: m.title,
      kind: m.kind,
      ageGroup: m.ageGroup as PortfolioData["teacher"]["ageGroup"],
      direction: m.direction as PortfolioData["tried"][number]["direction"],
      at: m.triedAt!.toISOString(),
      note: m.triedNote ?? "",
    })),
    showcase: showcase.map((s) => ({
      id: s.id,
      title: s.title,
      kind: s.kind,
      activity: Boolean((s.content as { activity?: unknown } | null)?.activity),
      at: s.publishedAt!.toISOString(),
    })),
  };
  return NextResponse.json(data);
}
