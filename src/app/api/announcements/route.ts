import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { AUTH_REQUIRED } from "@/lib/teacher";
import { checkRateLimit } from "@/lib/rate-limit";
import { ANNOUNCEMENT_INCLUDE, AnnouncementFields, parseEventDate, teamMember, toAnnouncementView } from "@/lib/announcements";

/**
 * Обявите на градината: закачените първо, после най-новите. Учителите виждат дали са ги прочели;
 * директорът вижда и колко от екипа са ги прочели. ?unread=1 връща само броя непрочетени.
 */
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json(AUTH_REQUIRED, { status: 401 });
  const me = await teamMember(session.userId);
  if (!me) return NextResponse.json({ items: [], unread: 0 });

  const reads = await prisma.announcementRead.findMany({ where: { userId: me.id, announcement: { kindergartenId: me.kindergartenId } }, select: { announcementId: true } });
  const readIds = new Set(reads.map((r) => r.announcementId));

  if (new URL(request.url).searchParams.get("unread") === "1") {
    const total = await prisma.announcement.count({ where: { kindergartenId: me.kindergartenId } });
    return NextResponse.json({ unread: Math.max(0, total - readIds.size) });
  }

  const rows = await prisma.announcement.findMany({
    where: { kindergartenId: me.kindergartenId },
    include: ANNOUNCEMENT_INCLUDE,
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    take: 200,
  });

  let team: { total: number; readsInTeam: Map<string, number> } | undefined;
  if (me.isAdmin) {
    // Броят се само прочитанията от хора, които още са в екипа
    const [total, grouped] = await Promise.all([
      prisma.user.count({ where: { kindergartenId: me.kindergartenId } }),
      prisma.announcementRead.groupBy({
        by: ["announcementId"],
        where: { announcementId: { in: rows.map((r) => r.id) }, user: { kindergartenId: me.kindergartenId } },
        _count: { _all: true },
      }),
    ]);
    team = { total, readsInTeam: new Map(grouped.map((g) => [g.announcementId, g._count._all])) };
  }

  const items = rows.map((r) => toAnnouncementView(r, readIds, team));
  return NextResponse.json({ items, unread: items.filter((i) => !i.readByMe).length });
}

/** Нова обява — само директорът (администраторът). Авторът я е „прочел“ автоматично. */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json(AUTH_REQUIRED, { status: 401 });
  const me = await teamMember(session.userId);
  if (!me?.isAdmin) return NextResponse.json({ error: "Обяви публикува само директорът." }, { status: 403 });
  const rate = await checkRateLimit(`announce:${me.id}`, 20);
  if (!rate.allowed) return NextResponse.json({ error: "Твърде много обяви за минута." }, { status: 429 });

  const parsed = AnnouncementFields.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Невалидни данни." }, { status: 400 });
  const { eventDate, ...rest } = parsed.data;

  const row = await prisma.announcement.create({
    data: { ...rest, eventDate: parseEventDate(eventDate), kindergartenId: me.kindergartenId, authorId: me.id, reads: { create: { userId: me.id } } },
    include: ANNOUNCEMENT_INCLUDE,
  });
  return NextResponse.json({ item: toAnnouncementView(row, new Set([row.id])) }, { status: 201 });
}
