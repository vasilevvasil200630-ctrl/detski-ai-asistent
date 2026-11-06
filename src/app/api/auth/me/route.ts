import { NextResponse } from "next/server";
import { getCurrentTeacher } from "@/lib/teacher";

export async function GET() {
  try {
    const user = await getCurrentTeacher();
    return NextResponse.json({ user: user ?? null });
  } catch (error) {
    // Без база (напр. локално без DATABASE_URL) сайтът работи като за гост
    console.warn("[auth/me] неуспешно четене на профила:", error instanceof Error ? error.message : error);
    return NextResponse.json({ user: null });
  }
}
