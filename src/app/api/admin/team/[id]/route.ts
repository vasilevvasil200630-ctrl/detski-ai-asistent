import { NextResponse } from "next/server";
import { KG } from "@/config/kindergarten";
import { SEATS_FULL_MESSAGE } from "@/lib/allowed-emails";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { revokeEmailTokens } from "@/lib/auth/email-tokens";
import { checkRateLimit } from "@/lib/rate-limit";
import { deleteUserAccount } from "@/lib/account-deletion";
import { generateTempPassword, requireAdmin, unusablePassword } from "@/lib/team-admin";
import { groupLabel } from "@/lib/parents-shared";

const ActionSchema = z.discriminatedUnion("action", [
  /** Права: администратор (директор/заместник) или учител */
  z.object({ action: z.literal("role"), role: z.enum(["ADMIN", "TEACHER"]) }),
  /** Длъжност, група — напр. когато колега смени групата си */
  z.object({
    action: z.literal("update"),
    jobTitle: z.string().trim().min(2, "Длъжността е твърде кратка.").max(60).optional(),
    groupName: z.string().trim().max(80).optional(),
    ageGroup: z.enum(["1", "2", "3", "4"]).optional(),
    /** Групата в градината (null — без група); тогава възрастта и името идват от групата */
    groupId: z.string().min(1).max(40).nullable().optional(),
  }),
  /** Нова временна парола (когато учителката е забравила своята) */
  z.object({ action: z.literal("resetPassword") }),
  /** Премахване от екипа: без достъп, споделените ѝ материали и файлове остават в градината */
  z.object({ action: z.literal("remove") }),
  /** Връщане в екипа с нова временна парола */
  z.object({ action: z.literal("restore") }),
]);

const NOT_FOUND = { error: "Колегата не е намерен в екипа." };

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;
  const { me } = auth;
  const { id } = await params;

  const rate = await checkRateLimit(`team-admin:${me.id}`, 30);
  if (!rate.allowed) return NextResponse.json({ error: "Твърде много действия за минута." }, { status: 429 });

  const parsed = ActionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Невалидно действие." }, { status: 400 });
  const body = parsed.data;

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, kindergartenId: true, removedFromKindergartenId: true },
  });
  const inTeam = target?.kindergartenId === me.kindergartenId;
  const removedFromTeam = !target?.kindergartenId && target?.removedFromKindergartenId === me.kindergartenId;

  if (body.action === "restore") {
    if (!target || !removedFromTeam) return NextResponse.json(NOT_FOUND, { status: 404 });
    // Връщането заема място — таванът е директор и 8 учители
    const members = await prisma.user.count({ where: { kindergartenId: me.kindergartenId } });
    if (members >= KG.maxMembers) return NextResponse.json({ error: SEATS_FULL_MESSAGE }, { status: 409 });
    const tempPassword = generateTempPassword();
    await prisma.user.update({
      where: { id },
      data: {
        kindergartenId: me.kindergartenId,
        kgRole: "TEACHER",
        removedAt: null,
        removedFromKindergartenId: null,
        passwordHash: await hashPassword(tempPassword),
        mustChangePassword: true,
      },
    });
    return NextResponse.json({ ok: true, tempPassword });
  }

  if (!target || !inTeam) return NextResponse.json(NOT_FOUND, { status: 404 });
  // Себе си директорът променя от „Моят профил“ — иначе може да остане градина без администратор
  if (target.id === me.id && body.action !== "update") {
    return NextResponse.json({ error: "Това не може да се направи за собствения профил. Сменете паролата си от „Моят профил“." }, { status: 400 });
  }

  switch (body.action) {
    case "role":
      await prisma.user.update({ where: { id }, data: { kgRole: body.role } });
      return NextResponse.json({ ok: true });
    case "update": {
      const { jobTitle, groupName, ageGroup, groupId } = body;
      let fromGroup: { groupId: string | null; ageGroup?: string; groupName?: string } | null = null;
      if (groupId !== undefined) {
        if (groupId === null) fromGroup = { groupId: null };
        else {
          const g = await prisma.group.findUnique({ where: { id: groupId }, select: { kindergartenId: true, name: true, ageGroup: true } });
          if (!g || g.kindergartenId !== me.kindergartenId) return NextResponse.json({ error: "Групата не е намерена." }, { status: 400 });
          fromGroup = { groupId, ageGroup: g.ageGroup, groupName: groupLabel(g) };
        }
      }
      await prisma.user.update({
        where: { id },
        data: {
          ...(jobTitle ? { jobTitle } : {}),
          ...(groupName !== undefined ? { groupName } : {}),
          ...(ageGroup ? { ageGroup } : {}),
          ...(fromGroup ?? {}),
        },
      });
      return NextResponse.json({ ok: true });
    }
    case "resetPassword": {
      const tempPassword = generateTempPassword();
      // Новата парола сменя отпечатъка в сесията: входовете на всички устройства спират
      await prisma.user.update({ where: { id }, data: { passwordHash: await hashPassword(tempPassword), mustChangePassword: true } });
      await revokeEmailTokens("reset", id);
      return NextResponse.json({ ok: true, tempPassword });
    }
    case "remove":
      await prisma.user.update({
        where: { id },
        data: {
          kindergartenId: null,
          kgRole: "TEACHER",
          removedAt: new Date(),
          removedFromKindergartenId: me.kindergartenId,
          passwordHash: await hashPassword(unusablePassword()),
          mustChangePassword: false,
        },
      });
      await revokeEmailTokens("reset", id);
      return NextResponse.json({ ok: true });
  }
}

/** Изтриване завинаги — само на вече премахнат от екипа профил (с всичко, което е създал). */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;
  const { me } = auth;
  const { id } = await params;

  const target = await prisma.user.findUnique({ where: { id }, select: { kindergartenId: true, removedFromKindergartenId: true } });
  if (!target || target.kindergartenId || target.removedFromKindergartenId !== me.kindergartenId) {
    return NextResponse.json({ error: "Първо премахнете колегата от екипа." }, { status: 400 });
  }
  await deleteUserAccount(id);
  return NextResponse.json({ ok: true });
}
