import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { AUTH_REQUIRED } from "@/lib/teacher";
import { canSee, planMember, PLAN_INCLUDE, toPlanView } from "@/lib/plans";
import { buildPlanDocx } from "@/lib/docx-export";
import { contentDisposition } from "@/lib/cloud/storage";
import { AGE_SHORT } from "@/services/materialText";

export const runtime = "nodejs";

/** Тематичното разпределение като Word файл — за редакция, печат и подпис на директора. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json(AUTH_REQUIRED, { status: 401 });
  const me = await planMember(session.userId);
  const { id } = await params;
  const row = await prisma.thematicPlan.findUnique({ where: { id }, include: PLAN_INCLUDE });
  if (!me || !row || !canSee(row, me)) return NextResponse.json({ error: "Разпределението не е намерено." }, { status: 404 });
  const plan = toPlanView(row, me.id);
  const buffer = await buildPlanDocx(plan);
  const name = `Тематично разпределение ${AGE_SHORT[plan.ageGroup]} ${plan.schoolYear}-${plan.schoolYear + 1}.docx`;
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": contentDisposition(name, false),
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
