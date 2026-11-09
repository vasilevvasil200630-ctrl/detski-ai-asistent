import { NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { AUTH_REQUIRED } from "@/lib/teacher";
import { checkRateLimit } from "@/lib/rate-limit";
import { isPrintable } from "@/services/printables";
import { PARENT_POST_INCLUDE, PostFields, postMember, toParentPostView } from "@/lib/parents";
import { groupLabel } from "@/lib/parents-shared";

/**
 * Публикациите за родителите в учителския профил: „mine“ — моите; „review“ — за директора
 * (чакащите одобрение и вече публикуваните, за да може да ги скрие).
 */
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json(AUTH_REQUIRED, { status: 401 });
  const me = await postMember(session.userId);
  if (!me) return NextResponse.json({ error: "Профилът не е в екипа на градината." }, { status: 403 });
  const scope = new URL(request.url).searchParams.get("scope") === "review" ? "review" : "mine";
  if (scope === "review" && !me.isAdmin) return NextResponse.json({ error: "Само директорът одобрява." }, { status: 403 });
  const where: Prisma.ParentPostWhereInput =
    scope === "review" ? { kindergartenId: me.kindergartenId, status: { in: ["PENDING", "APPROVED"] } } : { authorId: me.id };
  const rows = await prisma.parentPost.findMany({ where, include: PARENT_POST_INCLUDE, orderBy: [{ status: "desc" }, { createdAt: "desc" }], take: 200 });
  const group = me.groupId ? await prisma.group.findUnique({ where: { id: me.groupId }, select: { id: true, name: true, ageGroup: true, slug: true } }) : null;
  return NextResponse.json({
    posts: rows.map((r) => toParentPostView(r, me.id)),
    group: group ? { id: group.id, slug: group.slug, label: groupLabel(group) } : null,
    isAdmin: me.isAdmin,
  });
}

/** Нова публикация: учителят — за своята група (чака одобрение); директорът — за всяка група или градината (веднага). */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json(AUTH_REQUIRED, { status: 401 });
  const me = await postMember(session.userId);
  if (!me) return NextResponse.json({ error: "Профилът не е в екипа на градината." }, { status: 403 });
  const rate = await checkRateLimit(`parent-post:${me.id}`, 20);
  if (!rate.allowed) return NextResponse.json({ error: "Твърде много публикации за минута." }, { status: 429 });

  const parsed = PostFields.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Невалидни данни." }, { status: 400 });
  const d = parsed.data;

  let groupId = d.groupId;
  if (!me.isAdmin) {
    if (!me.groupId) {
      return NextResponse.json({ error: "Директорът още не ви е сложил в група — помолете го от „Управление на екипа“." }, { status: 400 });
    }
    groupId = me.groupId; // учителят пише само за своята група
  } else if (groupId) {
    const g = await prisma.group.findUnique({ where: { id: groupId }, select: { kindergartenId: true } });
    if (!g || g.kindergartenId !== me.kindergartenId) return NextResponse.json({ error: "Групата не е намерена." }, { status: 400 });
  }
  const printable =
    d.printable !== undefined && isPrintable(d.printable) && (d.printable.type === "letter" || d.printable.type === "verses") ? d.printable : null;
  if ((await prisma.parentPost.count({ where: { authorId: me.id, status: "PENDING" } })) >= 30) {
    return NextResponse.json({ error: "Имате много чакащи публикации. Изчакайте директора да ги прегледа." }, { status: 400 });
  }

  const now = new Date();
  const row = await prisma.parentPost.create({
    data: {
      kindergartenId: me.kindergartenId,
      groupId,
      authorId: me.id,
      kind: d.kind,
      title: d.title,
      body: d.body,
      eventDate: d.eventDate ? new Date(`${d.eventDate}T12:00:00.000Z`) : null,
      ...(printable ? { printable: JSON.parse(JSON.stringify(printable)) as Prisma.InputJsonValue } : {}),
      // Публикацията на директора не чака одобрение
      ...(me.isAdmin ? { status: "APPROVED" as const, publishedAt: now, reviewedAt: now, reviewedById: me.id } : {}),
    },
    include: PARENT_POST_INCLUDE,
  });
  return NextResponse.json({ post: toParentPostView(row, me.id) }, { status: 201 });
}
