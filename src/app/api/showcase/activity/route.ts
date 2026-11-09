import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { AUTH_REQUIRED } from "@/lib/teacher";
import { checkRateLimit } from "@/lib/rate-limit";
import { MAX_OPEN_PROPOSALS, ShowcaseFields, SHOWCASE_INCLUDE, toShowcaseView, validShowcaseImages } from "@/lib/showcase";

const ActivityBody = ShowcaseFields.extend({
  ageGroup: z.enum(["1", "2", "3", "4"]),
  direction: z.enum(["bel", "world", "math", "art", "music", "construct", "pe", "bdp"]).nullable().default(null),
});

/**
 * „Днес в групата“: дейност от деня без материал от библиотеката — разказ и снимки без деца.
 * Записва се и в „Моята библиотека“ (за портфолиото) и отива при директора за одобрение.
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json(AUTH_REQUIRED, { status: 401 });
  const rate = await checkRateLimit(`showcase-propose:${session.userId}`, 10);
  if (!rate.allowed) return NextResponse.json({ error: "Твърде много предложения за минута." }, { status: 429 });

  const parsed = ActivityBody.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Невалидни данни." }, { status: 400 });
  const body = parsed.data;

  const me = await prisma.user.findUnique({ where: { id: session.userId }, select: { id: true, kindergartenId: true } });
  if (!me?.kindergartenId) return NextResponse.json({ error: "Профилът не е в екипа на градината." }, { status: 403 });
  const kindergartenId = me.kindergartenId;

  const open = await prisma.showcaseItem.count({ where: { authorId: me.id, status: { not: "APPROVED" } } });
  if (open >= MAX_OPEN_PROPOSALS) return NextResponse.json({ error: "Имате много неодобрени предложения. Изчакайте директора." }, { status: 400 });

  const images = await validShowcaseImages(body.imageIds, { id: me.id, kindergartenId }, body.noChildren);
  if (!images.ok) return NextResponse.json({ error: images.error }, { status: 400 });

  const row = await prisma.$transaction(async (tx) => {
    const material = await tx.material.create({
      data: {
        authorId: me.id,
        kindergartenId,
        kind: "MATERIAL",
        title: body.title,
        ageGroup: body.ageGroup,
        direction: body.direction,
        content: { text: body.story },
        meta: { activity: true },
      },
    });
    return tx.showcaseItem.create({
      data: {
        kindergartenId,
        authorId: me.id,
        materialId: material.id,
        kind: "MATERIAL",
        title: body.title,
        story: body.story,
        ageGroup: body.ageGroup,
        direction: body.direction,
        content: { activity: true },
        imageIds: images.ids,
        allowPrint: false,
      },
      include: SHOWCASE_INCLUDE,
    });
  });
  return NextResponse.json({ item: toShowcaseView(row, { forPublic: false }) }, { status: 201 });
}
