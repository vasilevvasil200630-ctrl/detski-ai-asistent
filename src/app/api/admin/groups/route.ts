import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/team-admin";
import { slugify } from "@/lib/parents-shared";
import { GroupFields, toGroupView } from "@/lib/parents";

const TEACHERS = { teachers: { where: { removedAt: null }, select: { id: true, name: true, avatar: true, jobTitle: true }, orderBy: { name: "asc" as const } } };

/** Групите на градината (за директора). */
export async function GET() {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;
  const rows = await prisma.group.findMany({
    where: { kindergartenId: auth.me.kindergartenId },
    orderBy: [{ ageGroup: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    include: TEACHERS,
  });
  return NextResponse.json({ groups: rows.map(toGroupView) });
}

/** Нова група: адресът на страницата ѝ се прави от името (латиница), без да се повтаря. */
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;
  const parsed = GroupFields.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Невалидни данни." }, { status: 400 });
  const kgId = auth.me.kindergartenId;
  if ((await prisma.group.count({ where: { kindergartenId: kgId } })) >= 20) {
    return NextResponse.json({ error: "Групите са твърде много." }, { status: 400 });
  }
  const base = slugify(parsed.data.name);
  let slug = base;
  for (let n = 2; await prisma.group.findUnique({ where: { kindergartenId_slug: { kindergartenId: kgId, slug } } }); n++) slug = `${base}-${n}`;
  const row = await prisma.group.create({ data: { kindergartenId: kgId, name: parsed.data.name, ageGroup: parsed.data.ageGroup, slug }, include: TEACHERS });
  return NextResponse.json({ group: toGroupView(row) }, { status: 201 });
}
