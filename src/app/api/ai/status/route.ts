import { NextResponse } from "next/server";
import { hasGeminiKey } from "@/lib/ai-route";

/** Дали сървърът има AI ключ — за индикатора в горната лента. */
export async function GET() {
  return NextResponse.json({ ai: hasGeminiKey() });
}
