import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { AUTH_REQUIRED } from "@/lib/teacher";
import { CreateMaterialBody, ListMaterialsQuery, MATERIAL_INCLUDE, sanitizeContent, toSavedMaterial } from "@/lib/materials";

/**
 * Библиотеката на учителя.
 * scope=mine — моите материали (по възрастови групи, видове, празници);
 * scope=shared — споделените в моята детска градина (от колеги и от мен).
 */
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ materials: [], guest: true });

  const url = new URL(request.url);
  const q = ListMaterialsQuery.safeParse(Object.fromEntries(url.searchParams));
  if (!q.success) return NextResponse.json({ error: "Невалиден филтър." }, { status: 400 });

  const me = await prisma.user.findUnique({ where: { id: session.userId }, select: { kindergartenId: true } });
  if (!me) return NextResponse.json(AUTH_REQUIRED, { status: 401 });
  if (q.data.scope === "shared" && !me.kindergartenId) return NextResponse.json({ materials: [], noKindergarten: true });

  const rows = await prisma.material.findMany({
    where: {
      ...(q.data.scope === "mine"
        ? { authorId: session.userId }
        : { kindergartenId: me.kindergartenId!, shared: true }),
      ...(q.data.ageGroup ? { ageGroup: q.data.ageGroup } : {}),
      ...(q.data.kind ? { kind: q.data.kind } : {}),
      ...(q.data.holiday ? { holiday: q.data.holiday } : {}),
    },
    include: MATERIAL_INCLUDE,
    orderBy: { createdAt: "desc" },
    take: 300,
  });
  const liked = await prisma.materialLike.findMany({
    where: { userId: session.userId, materialId: { in: rows.map((r) => r.id) } },
    select: { materialId: true },
  });
  const likedIds = new Set(liked.map((l) => l.materialId));
  return NextResponse.json({ materials: rows.map((r) => toSavedMaterial(r, session.userId, likedIds)) });
}

/** Запазване на материал в моя профил (и по желание споделяне с колегите). */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json(AUTH_REQUIRED, { status: 401 });

  const rate = await checkRateLimit(`material-save:${session.userId}`, 60);
  if (!rate.allowed) return NextResponse.json({ error: "Твърде много записи за минута." }, { status: 429 });

  const parsed = CreateMaterialBody.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Невалидни данни." }, { status: 400 });
  }
  const body = parsed.data;
  const content = sanitizeContent(body.kind, body.content);
  if (!content.ok) return NextResponse.json({ error: content.error }, { status: 400 });

  const me = await prisma.user.findUnique({ where: { id: session.userId }, select: { kindergartenId: true } });
  if (!me) return NextResponse.json(AUTH_REQUIRED, { status: 401 });
  const shared = Boolean(body.shared);
  if (shared && !me.kindergartenId) {
    return NextResponse.json({ error: "За да споделяш, профилът трябва да е свързан с детска градина." }, { status: 400 });
  }

  const row = await prisma.material.create({
    data: {
      authorId: session.userId,
      kindergartenId: me.kindergartenId,
      kind: body.kind,
      title: body.title,
      ageGroup: body.ageGroup,
      direction: body.direction ?? null,
      core: body.core ?? null,
      holiday: body.holiday ?? null,
      ...(body.meta ? { meta: JSON.parse(JSON.stringify(body.meta)) } : {}),
      content: content.value,
      shared,
      sharedAt: shared ? new Date() : null,
    },
    include: MATERIAL_INCLUDE,
  });
  return NextResponse.json({ material: toSavedMaterial(row, session.userId, new Set()) }, { status: 201 });
}
