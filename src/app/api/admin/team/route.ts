import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, TEAM_MEMBER_SELECT } from "@/lib/team-admin";

/** Екипът на градината за директора: активните учители и премахнатите от екипа. */
export async function GET() {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;
  const { me } = auth;

  const [kg, members, removed] = await Promise.all([
    prisma.kindergarten.findUnique({ where: { id: me.kindergartenId }, select: { name: true, joinCode: true, teacherSignupOpen: true } }),
    prisma.user.findMany({
      where: { kindergartenId: me.kindergartenId },
      select: TEAM_MEMBER_SELECT,
      orderBy: [{ kgRole: "asc" }, { createdAt: "asc" }],
    }),
    prisma.user.findMany({
      where: { kindergartenId: null, removedFromKindergartenId: me.kindergartenId },
      select: TEAM_MEMBER_SELECT,
      orderBy: { removedAt: "desc" },
    }),
  ]);

  const view = (u: (typeof members)[number]) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    avatar: u.avatar,
    jobTitle: u.jobTitle,
    ageGroup: u.ageGroup,
    groupName: u.groupName,
    groupId: u.groupId,
    role: u.kgRole,
    me: u.id === me.id,
    mustChangePassword: u.mustChangePassword,
    joinedAt: u.createdAt.toISOString(),
    removedAt: u.removedAt?.toISOString() ?? null,
    materials: u._count.materials,
    files: u._count.cloudFiles,
  });

  return NextResponse.json({ kindergarten: kg, members: members.map(view), removed: removed.map(view) });
}
