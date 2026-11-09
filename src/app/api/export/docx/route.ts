import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { AUTH_REQUIRED } from "@/lib/teacher";
import { checkRateLimit } from "@/lib/rate-limit";
import { sanitizeContent } from "@/lib/materials";
import { buildDocx, docxFileName } from "@/lib/docx-export";
import { contentDisposition } from "@/lib/cloud/storage";

export const runtime = "nodejs";

const Body = z.object({
  kind: z.enum(["GAME", "LESSON", "MATERIAL"]),
  title: z.string().trim().min(1).max(160),
  ageGroup: z.enum(["1", "2", "3", "4"]),
  direction: z.enum(["bel", "world", "math", "art", "music", "construct", "pe", "bdp"]).nullish(),
  content: z.unknown(),
});

/** Word файл от игра, план-конспект или материал (и от запазен, и от току-що създаден). */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json(AUTH_REQUIRED, { status: 401 });
  const rate = await checkRateLimit(`docx:${session.userId}`, 20);
  if (!rate.allowed) return NextResponse.json({ error: "Твърде много файлове за минута." }, { status: 429 });

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Невалидни данни." }, { status: 400 });
  // Същата проверка като при запазване в библиотеката — в документа влиза само почистено съдържание
  const content = sanitizeContent(parsed.data.kind, parsed.data.content);
  if (!content.ok) return NextResponse.json({ error: content.error }, { status: 400 });

  const buffer = await buildDocx({ ...parsed.data, direction: parsed.data.direction ?? null, content: content.value });
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": contentDisposition(docxFileName(parsed.data.title), false),
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
