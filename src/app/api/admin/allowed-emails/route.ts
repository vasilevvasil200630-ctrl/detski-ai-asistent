import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/team-admin";
import { normalizeEmail } from "@/lib/allowed-emails";
import { KG } from "@/config/kindergarten";

/**
 * Списъкът с разрешени имейли — само за директора. Първият добавен имейл включва списъка; тогава в
 * него влизат и имейлите на всички вече регистрирани, за да не изгуби никой достъп.
 */

async function listView(kindergartenId: string) {
  const [rows, users] = await Promise.all([
    prisma.allowedEmail.findMany({ where: { kindergartenId }, orderBy: { createdAt: "asc" }, select: { email: true, createdAt: true } }),
    prisma.user.findMany({ where: { kindergartenId }, select: { email: true, name: true, kgRole: true } }),
  ]);
  const byEmail = new Map(users.map((u) => [u.email.toLowerCase(), u]));
  return rows.map((r) => {
    const u = byEmail.get(r.email);
    return { email: r.email, addedAt: r.createdAt.toISOString(), name: u?.name ?? null, admin: u?.kgRole === "ADMIN" };
  });
}

export async function GET() {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;
  return NextResponse.json({ emails: await listView(auth.me.kindergartenId), max: KG.maxMembers }, { headers: { "Cache-Control": "no-store" } });
}

const AddBody = z.object({ emails: z.string().max(5000) });
const EmailSchema = z.string().email();

/** Добавя един или няколко имейла (разделени със запетая, интервал или нов ред). */
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;
  const parsed = AddBody.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Невалидни данни." }, { status: 400 });

  const parts = [...new Set(parsed.data.emails.split(/[\s,;]+/).map(normalizeEmail).filter(Boolean))];
  const invalid = parts.filter((e) => !EmailSchema.safeParse(e).success);
  if (!parts.length) return NextResponse.json({ error: "Въведете поне един имейл." }, { status: 400 });
  if (invalid.length) return NextResponse.json({ error: `Невалиден имейл: ${invalid.slice(0, 3).join(", ")}` }, { status: 400 });
  if (parts.length > 100) return NextResponse.json({ error: "Наведнъж — до 100 имейла." }, { status: 400 });

  const kindergartenId = auth.me.kindergartenId;
  try {
    await prisma.$transaction(async (tx) => {
      // Първият имейл включва списъка: добавят се и всички вече регистрирани, за да не изгубят достъп
      const current = await tx.allowedEmail.findMany({ where: { kindergartenId }, select: { email: true } });
      const members = current.length === 0 ? await tx.user.findMany({ where: { kindergartenId }, select: { email: true } }) : [];
      const all = [...new Set([...members.map((m) => normalizeEmail(m.email)), ...parts])];
      // Таванът: списъкът са местата — директор и 8 учители
      const after = new Set([...current.map((c) => c.email), ...all]);
      if (after.size > KG.maxMembers) throw new Error(`SEATS:${KG.maxMembers - current.length - (current.length === 0 ? members.length : 0)}`);
      await tx.allowedEmail.createMany({ data: all.map((email) => ({ kindergartenId, email })), skipDuplicates: true });
    });
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("SEATS:")) {
      const free = Math.max(0, Number(err.message.slice(6)));
      return NextResponse.json(
        { error: `Местата са ${KG.maxMembers} (директор и ${KG.maxMembers - 1} учители). Свободни: ${free}. Махнете имейл, за да освободите място.` },
        { status: 400 },
      );
    }
    throw err;
  }
  return NextResponse.json({ emails: await listView(kindergartenId), max: KG.maxMembers });
}

/** Маха имейл от списъка: учител с този имейл губи достъп веднага. Своя имейл директорът не може да махне. */
export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;
  const email = normalizeEmail(new URL(request.url).searchParams.get("email") ?? "");
  if (!email) return NextResponse.json({ error: "Липсва имейл." }, { status: 400 });

  const me = await prisma.user.findUnique({ where: { id: auth.me.id }, select: { email: true } });
  if (me && normalizeEmail(me.email) === email) {
    return NextResponse.json({ error: "Своя имейл не можете да махнете от списъка." }, { status: 400 });
  }
  await prisma.allowedEmail.deleteMany({ where: { kindergartenId: auth.me.kindergartenId, email } });
  return NextResponse.json({ emails: await listView(auth.me.kindergartenId), max: KG.maxMembers });
}
