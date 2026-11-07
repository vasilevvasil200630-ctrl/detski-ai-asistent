import { NextResponse } from "next/server";
import { getSession, deleteSession } from "@/lib/auth/session";
import { deleteUserAccount } from "@/lib/account-deletion";
import { AUTH_REQUIRED } from "@/lib/teacher";

// Копирано от МатураПлюс (src/app/api/account/route.ts), без бисквитките на NextAuth.

export const runtime = "nodejs";

/** Думата, която учителят пише, за да потвърди изтриването. */
const CONFIRM_WORD = "ИЗТРИЙ";

/** DELETE /api/account — изтрива профила на влезлия учител и неговите материали (GDPR, чл. 17). */
export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json(AUTH_REQUIRED, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { confirm?: unknown };
  if (typeof body.confirm !== "string" || body.confirm.trim().toLocaleUpperCase("bg-BG") !== CONFIRM_WORD) {
    return NextResponse.json({ error: `За да потвърдите, напишете „${CONFIRM_WORD}“.` }, { status: 400 });
  }

  try {
    await deleteUserAccount(session.userId);
  } catch (err) {
    console.error("[account] Изтриването не успя:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Профилът не беше изтрит. Опитайте отново или ни пишете за помощ." }, { status: 500 });
  }

  await deleteSession();
  console.log("[account] Профил изтрит по искане на учителя.");
  return NextResponse.json({ ok: true });
}
