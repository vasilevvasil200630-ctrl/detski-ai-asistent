import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/team-admin";
import { PARENT_POST_INCLUDE, toParentPostView } from "@/lib/parents";

const ReviewBody = z.discriminatedUnion("action", [
  z.object({ action: z.literal("approve") }),
  /** Връщане за промяна или скриване на публикувано — с бележка към учителя */
  z.object({ action: z.literal("return"), note: z.string().trim().min(3, "Напишете на колегата какво да промени.").max(500) }),
]);

/** Директорът одобрява, връща или скрива публикация за родителите. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;
  const { me } = auth;
  const { id } = await params;
  const parsed = ReviewBody.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Невалидно действие." }, { status: 400 });
  const row = await prisma.parentPost.findUnique({ where: { id }, select: { kindergartenId: true, author: { select: { kindergartenId: true } } } });
  if (!row || row.kindergartenId !== me.kindergartenId) return NextResponse.json({ error: "Публикацията не е намерена." }, { status: 404 });
  if (parsed.data.action === "approve" && row.author.kindergartenId !== me.kindergartenId) {
    return NextResponse.json({ error: "Авторът вече не е в екипа." }, { status: 400 });
  }
  const now = new Date();
  const updated = await prisma.parentPost.update({
    where: { id },
    data:
      parsed.data.action === "approve"
        ? { status: "APPROVED", publishedAt: now, reviewNote: null, reviewedAt: now, reviewedById: me.id }
        : { status: "RETURNED", publishedAt: null, reviewNote: parsed.data.note, reviewedAt: now, reviewedById: me.id },
    include: PARENT_POST_INCLUDE,
  });
  return NextResponse.json({ post: toParentPostView(updated, me.id) });
}
