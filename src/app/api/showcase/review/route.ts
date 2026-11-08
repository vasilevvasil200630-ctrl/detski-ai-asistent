import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/team-admin";
import { SHOWCASE_INCLUDE, toShowcaseView } from "@/lib/showcase";

/** За директора: предложенията, които чакат, и всичко на витрината на градината. */
export async function GET() {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;
  const rows = await prisma.showcaseItem.findMany({
    where: { kindergartenId: auth.me.kindergartenId, status: { in: ["PENDING", "APPROVED"] } },
    include: SHOWCASE_INCLUDE,
    orderBy: [{ createdAt: "desc" }],
  });
  const view = rows.map((r) => toShowcaseView(r, { forPublic: false }));
  return NextResponse.json({
    pending: view.filter((v) => v.status === "PENDING").reverse(),
    published: view.filter((v) => v.status === "APPROVED"),
  });
}
