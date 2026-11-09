import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/team-admin";
import { buildMonthlyReport } from "@/lib/reports";

/** Месечният отчет за екипа — само за директора. ?ym=ГГГГ-ММ (по подразбиране — текущият месец). */
export async function GET(request: Request) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;
  const ym = new URL(request.url).searchParams.get("ym") ?? new Date().toISOString().slice(0, 7);
  const report = await buildMonthlyReport(auth.me.kindergartenId, ym);
  if (!report) return NextResponse.json({ error: "Невалиден месец." }, { status: 400 });
  return NextResponse.json({ report }, { headers: { "Cache-Control": "no-store" } });
}
