import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { folderLabel } from "@/lib/cloud/folders";
import { AUTH_REQUIRED } from "@/lib/teacher";

export const runtime = "nodejs";

/**
 * GET /api/account/export — копие на всичките данни на влезлия учител в един JSON файл
 * (GDPR, чл. 15 и чл. 20: право на достъп и преносимост). Самите файлове от облака
 * не се вграждат: за всеки има линк за сваляне.
 */
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json(AUTH_REQUIRED, { status: 401 });

  const rate = await checkRateLimit(`account-export:${session.userId}`, 5);
  if (!rate.allowed) return NextResponse.json({ error: "Твърде много опити. Опитайте пак след минута." }, { status: 429 });

  const userId = session.userId;
  const [user, materials, bankGames, materialLikes, gameLikes, files, notes, feedback] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        name: true,
        jobTitle: true,
        avatar: true,
        ageGroup: true,
        groupName: true,
        kgRole: true,
        createdAt: true,
        kindergarten: { select: { name: true, city: true } },
      },
    }),
    prisma.material.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: "asc" },
      select: {
        kind: true,
        title: true,
        ageGroup: true,
        direction: true,
        core: true,
        holiday: true,
        meta: true,
        content: true,
        shared: true,
        sharedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.bankGame.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: "asc" },
      select: { ageGroup: true, mood: true, location: true, resources: true, game: true, createdAt: true },
    }),
    prisma.materialLike.findMany({ where: { userId }, select: { createdAt: true, material: { select: { title: true } } } }),
    prisma.bankGameLike.findMany({ where: { userId }, select: { gameId: true } }),
    prisma.cloudFile.findMany({
      where: { uploaderId: userId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        title: true,
        description: true,
        folder: true,
        ageGroup: true,
        direction: true,
        fileName: true,
        mimeType: true,
        size: true,
        shared: true,
        downloads: true,
        createdAt: true,
      },
    }),
    prisma.note.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: { title: true, body: true, color: true, pinned: true, dueDate: true, done: true, createdAt: true, updatedAt: true },
    }),
    prisma.feedback.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: { type: true, rating: true, message: true, email: true, page: true, createdAt: true },
    }),
  ]);
  if (!user) return NextResponse.json(AUTH_REQUIRED, { status: 401 });

  const origin = new URL(request.url).origin;
  const data = {
    about:
      "Копие на данните ви от учителския облак на ДГ „Пролет“. Паролата не е включена (пази се само като необратим хеш). Файловете от облака се свалят от линковете, докато сте влезли в профила си.",
    exportedAt: new Date().toISOString(),
    profile: user,
    materials,
    bankGames,
    likes: { materials: materialLikes.map((l) => ({ title: l.material.title, likedAt: l.createdAt })), bankGames: gameLikes.length },
    cloudFiles: files.map(({ id, folder, ...f }) => ({
      ...f,
      folder: folderLabel(folder),
      downloadUrl: `${origin}/api/cloud/files/${id}/download`,
    })),
    notes,
    feedback,
  };

  const day = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="moite-danni-${day}.json"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
