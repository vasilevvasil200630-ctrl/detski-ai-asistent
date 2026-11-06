import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentTeacher, AUTH_REQUIRED } from "@/lib/teacher";

/** Учителският екип на моята градина. */
export async function GET() {
  const me = await getCurrentTeacher();
  if (!me) return NextResponse.json(AUTH_REQUIRED, { status: 401 });
  if (!me.kindergarten) return NextResponse.json({ teachers: [] });

  const teachers = await prisma.user.findMany({
    where: { kindergartenId: me.kindergarten.id },
    select: { id: true, name: true, avatar: true, jobTitle: true, ageGroup: true, groupName: true, kgRole: true },
    orderBy: [{ kgRole: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json({ teachers });
}
