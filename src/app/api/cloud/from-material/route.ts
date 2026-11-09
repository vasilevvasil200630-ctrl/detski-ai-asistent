import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { AUTH_REQUIRED } from "@/lib/teacher";
import { checkRateLimit } from "@/lib/rate-limit";
import { sanitizeContent } from "@/lib/materials";
import { buildDocx, buildPlanDocx, docxFileName } from "@/lib/docx-export";
import { canSee, planMember, PLAN_INCLUDE, toPlanView } from "@/lib/plans";
import {
  blobPathFor,
  CLOUD_FILE_INCLUDE,
  cloudDriver,
  cloudMember,
  cloudUsage,
  deleteBlobs,
  putBlob,
  safeFileName,
  toCloudFileItem,
} from "@/lib/cloud/storage";
import { folderLabel, type CloudFolderId } from "@/lib/cloud/folders";
import { isPrintable } from "@/services/printables";
import { AGE_SHORT, directionLabel } from "@/services/materialText";
import type { AgeGroup, MaterialKind } from "@/types";

export const runtime = "nodejs";

const DIRECTION = z.enum(["bel", "world", "math", "art", "music", "construct", "pe", "bdp"]);
const Body = z.discriminatedUnion("source", [
  z.object({
    source: z.literal("material"),
    kind: z.enum(["GAME", "LESSON", "MATERIAL"]),
    title: z.string().trim().min(1).max(140),
    ageGroup: z.enum(["1", "2", "3", "4"]),
    direction: DIRECTION.nullish(),
    content: z.unknown(),
    shared: z.boolean(),
  }),
  z.object({ source: z.literal("plan"), planId: z.string().min(1).max(40), shared: z.boolean() }),
]);

const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/** Папката в облака според вида: конспекти и игри → планове, листове → работни листове и т.н. */
function folderFor(kind: MaterialKind, content: unknown): CloudFolderId {
  const printable = content && typeof content === "object" ? (content as { printable?: unknown }).printable : null;
  if (isPrintable(printable)) return printable.type === "worksheet" ? "worksheets" : printable.type === "verses" ? "songs" : "parents";
  return kind === "MATERIAL" ? "other" : "plans";
}

/**
 * „В облака“: създава Word файл от току-що генерирания материал (или от тематичното разпределение)
 * и го записва в общия облак на градината — споделен с колегите или само за мен.
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json(AUTH_REQUIRED, { status: 401 });
  const me = await cloudMember(session.userId);
  if (!me) return NextResponse.json({ error: "Профилът не е в екипа на градината." }, { status: 403 });
  const rate = await checkRateLimit(`cloud-save:${me.id}`, 40);
  if (!rate.allowed) return NextResponse.json({ error: "Твърде много записи за минута. Изчакайте малко." }, { status: 429 });

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Невалидни данни." }, { status: 400 });
  const body = parsed.data;

  let buffer: Buffer;
  let title: string;
  let description: string;
  let folder: CloudFolderId;
  let ageGroup: AgeGroup;
  let direction: string | null = null;

  if (body.source === "material") {
    const content = sanitizeContent(body.kind, body.content);
    if (!content.ok) return NextResponse.json({ error: content.error }, { status: 400 });
    buffer = await buildDocx({ kind: body.kind, title: body.title, ageGroup: body.ageGroup, direction: body.direction ?? null, content: content.value });
    title = body.title;
    ageGroup = body.ageGroup;
    direction = body.direction ?? null;
    folder = folderFor(body.kind, content.value);
    const dir = directionLabel(body.direction ?? null);
    description = `Създадено в учителския облак · ${AGE_SHORT[ageGroup]}${dir ? ` · ${dir}` : ""}`;
  } else {
    const member = await planMember(session.userId);
    const row = await prisma.thematicPlan.findUnique({ where: { id: body.planId }, include: PLAN_INCLUDE });
    if (!member || !row || !canSee(row, member)) return NextResponse.json({ error: "Разпределението не е намерено." }, { status: 404 });
    const plan = toPlanView(row, member.id);
    buffer = await buildPlanDocx(plan);
    ageGroup = plan.ageGroup;
    title = `Тематично разпределение · ${plan.groupName || AGE_SHORT[ageGroup]} · ${plan.schoolYear}/${plan.schoolYear + 1}`;
    description = plan.approvedAt ? `Утвърдено от ${plan.approvedByName ?? "директора"}` : "Още не е утвърдено от директора";
    folder = "plans";
  }

  const bytes = new Uint8Array(buffer);
  const usage = await cloudUsage(me.kindergartenId);
  if (bytes.byteLength > usage.maxFileSize) return NextResponse.json({ error: "Файлът е твърде голям за облака." }, { status: 413 });
  if (usage.used + bytes.byteLength > usage.quota) {
    return NextResponse.json({ error: "Облакът на градината е пълен. Изтрийте стари файлове, за да освободите място." }, { status: 507 });
  }

  const fileName = safeFileName(docxFileName(title));
  let blobPathname: string | null = null;
  if (cloudDriver() === "blob") {
    blobPathname = blobPathFor(me.kindergartenId, me.id, fileName);
    try {
      await putBlob(blobPathname, bytes, DOCX);
    } catch (error) {
      console.error("[cloud/from-material] blob put failed:", error instanceof Error ? error.message : error);
      return NextResponse.json({ error: "Файлът не можа да се запише в облака. Опитайте отново." }, { status: 502 });
    }
  }

  try {
    const row = await prisma.cloudFile.create({
      data: {
        kindergartenId: me.kindergartenId,
        uploaderId: me.id,
        title: title.slice(0, 140),
        description,
        folder,
        ageGroup,
        direction,
        fileName,
        mimeType: DOCX,
        size: bytes.byteLength,
        storage: blobPathname ? "blob" : "db",
        blobPathname,
        shared: body.shared,
        ...(blobPathname ? {} : { data: { create: { bytes } } }),
      },
      include: CLOUD_FILE_INCLUDE,
    });
    return NextResponse.json({ file: toCloudFileItem(row, me), folderLabel: folderLabel(folder) }, { status: 201 });
  } catch (error) {
    await deleteBlobs([blobPathname]);
    throw error;
  }
}
