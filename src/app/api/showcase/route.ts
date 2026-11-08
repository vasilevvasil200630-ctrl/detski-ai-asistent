import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { AUTH_REQUIRED } from "@/lib/teacher";
import { checkRateLimit } from "@/lib/rate-limit";
import { MAX_OPEN_PROPOSALS, ShowcaseFields, SHOWCASE_INCLUDE, snapshotContent, toShowcaseView, validShowcaseImages } from "@/lib/showcase";

/** Моите предложения за витрината. */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json(AUTH_REQUIRED, { status: 401 });
  const rows = await prisma.showcaseItem.findMany({
    where: { authorId: session.userId },
    include: SHOWCASE_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ items: rows.map((r) => toShowcaseView(r, { forPublic: false })) });
}

const ProposeBody = ShowcaseFields.extend({ materialId: z.string().min(1).max(40) });

/** Предлагане на свой материал за витрината — чака одобрение от директора. */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json(AUTH_REQUIRED, { status: 401 });
  const rate = await checkRateLimit(`showcase-propose:${session.userId}`, 10);
  if (!rate.allowed) return NextResponse.json({ error: "Твърде много предложения за минута." }, { status: 429 });

  const parsed = ProposeBody.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Невалидни данни." }, { status: 400 });
  const body = parsed.data;

  const me = await prisma.user.findUnique({ where: { id: session.userId }, select: { id: true, kindergartenId: true } });
  if (!me?.kindergartenId) return NextResponse.json({ error: "Профилът не е в екипа на градината." }, { status: 403 });
  const kindergartenId = me.kindergartenId;

  const material = await prisma.material.findUnique({ where: { id: body.materialId } });
  if (!material || material.authorId !== me.id) return NextResponse.json({ error: "Материалът не е намерен." }, { status: 404 });
  const content = snapshotContent(material.content);
  if (!content) return NextResponse.json({ error: "Този материал не може да се покаже на витрината." }, { status: 400 });

  const open = await prisma.showcaseItem.count({ where: { authorId: me.id, status: { not: "APPROVED" } } });
  if (open >= MAX_OPEN_PROPOSALS) return NextResponse.json({ error: "Имате много неодобрени предложения. Изчакайте директора." }, { status: 400 });

  const images = await validShowcaseImages(body.imageIds, { id: me.id, kindergartenId }, body.noChildren);
  if (!images.ok) return NextResponse.json({ error: images.error }, { status: 400 });

  const row = await prisma.showcaseItem.create({
    data: {
      kindergartenId,
      authorId: me.id,
      materialId: material.id,
      kind: material.kind,
      title: body.title,
      story: body.story,
      ageGroup: material.ageGroup,
      direction: material.direction,
      holiday: material.holiday,
      content,
      imageIds: images.ids,
      allowPrint: body.allowPrint,
    },
    include: SHOWCASE_INCLUDE,
  });
  return NextResponse.json({ item: toShowcaseView(row, { forPublic: false }) }, { status: 201 });
}
