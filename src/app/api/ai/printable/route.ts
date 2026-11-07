import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { AUTH_REQUIRED } from "@/lib/teacher";
import { askGeminiJson, checkAiRateLimit, hasGeminiKey } from "@/lib/ai-route";
import { extractJson } from "@/services/aiValidation";
import { buildDemoPrintable, buildPrintablePrompt, normalizePrintable, type PrintableRequest } from "@/services/printables";

export const maxDuration = 60;

const AGE = z.enum(["1", "2", "3", "4"]);
const TOPIC = z.string().trim().max(120).default("");

const Params = z.discriminatedUnion("type", [
  z.object({ type: z.literal("worksheet"), ageGroup: AGE, direction: z.enum(["bel", "world", "math", "art", "music", "construct", "pe", "bdp"]), topic: TOPIC }),
  z.object({ type: z.literal("verses"), ageGroup: AGE, kind: z.enum(["poem", "riddles", "counting", "tongue"]), topic: TOPIC }),
  z.object({
    type: z.literal("letter"),
    ageGroup: AGE,
    kind: z.enum(["invitation", "notice", "thanks", "request"]),
    topic: TOPIC,
    date: z.string().trim().max(40).optional(),
    time: z.string().trim().max(20).optional(),
    place: z.string().trim().max(80).optional(),
    extra: z.string().trim().max(500).optional(),
    groupName: z.string().trim().max(80).optional(),
  }),
]);

/** Материал за печат: работен лист, стихчета/гатанки/броилки или писмо до родителите. */
export async function POST(request: Request) {
  if (!(await getSession())) return NextResponse.json(AUTH_REQUIRED, { status: 401 });
  const parsed = Params.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Невалидни параметри." }, { status: 400 });
  const req = parsed.data as PrintableRequest;
  const demo = buildDemoPrintable(req);

  if (!hasGeminiKey()) return NextResponse.json({ item: demo, source: "demo" });
  const rate = await checkAiRateLimit(request);
  if (!rate.allowed) return NextResponse.json({ item: demo, source: "demo", limited: true });

  try {
    const raw = await askGeminiJson(buildPrintablePrompt(req), 5000);
    const item = normalizePrintable(typeof raw === "string" ? extractJson(raw) : raw, req, demo);
    return NextResponse.json({ item, source: "ai" });
  } catch (error) {
    console.warn("[ai/printable] fallback to demo:", error instanceof Error ? error.message : error);
    return NextResponse.json({ item: demo, source: "demo" });
  }
}
