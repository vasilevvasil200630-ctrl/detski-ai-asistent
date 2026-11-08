import "server-only";
import { prisma } from "@/lib/prisma";
import { deleteBlobs } from "@/lib/cloud/storage";

/**
 * По модела на МатураПлюс (src/lib/account-deletion.ts): изтрива профила и личните данни на
 * учителя (GDPR, чл. 17) в една транзакция — или всичко, или нищо.
 *
 * - Материалите на учителя (включително споделените) се изтриват; харесванията им — каскадно.
 * - Копията, които колегите са си запазили, остават техни.
 * - Файловете, качени в облака на градината (и споделените), се изтриват от хранилището;
 *   личният бележник — каскадно.
 * - Детската градина остава за колегите. Ако учителят е бил единственият администратор,
 *   администратор става най-старият останал колега.
 */
export async function deleteUserAccount(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { kgRole: true, kindergartenId: true } });
  if (!user) return;
  const files = await prisma.cloudFile.findMany({ where: { uploaderId: userId }, select: { blobPathname: true } });

  const ops = [
    prisma.material.deleteMany({ where: { authorId: userId } }),
    prisma.bankGame.deleteMany({ where: { authorId: userId } }),
    prisma.cloudFile.deleteMany({ where: { uploaderId: userId } }),
    // Обратната връзка остава (до 2 години), но вече без връзка с профила
    prisma.feedback.updateMany({ where: { userId }, data: { userId: null } }),
    prisma.verificationToken.deleteMany({ where: { identifier: { in: [`reset:${userId}`] } } }),
    // Харесванията (MaterialLike, BankGameLike) се трият каскадно заедно с профила
    prisma.user.delete({ where: { id: userId } }),
  ];

  if (user.kgRole === "ADMIN" && user.kindergartenId) {
    const otherAdmin = await prisma.user.findFirst({
      where: { kindergartenId: user.kindergartenId, kgRole: "ADMIN", NOT: { id: userId } },
      select: { id: true },
    });
    const successor = otherAdmin
      ? null
      : await prisma.user.findFirst({
          where: { kindergartenId: user.kindergartenId, NOT: { id: userId } },
          orderBy: { createdAt: "asc" },
          select: { id: true },
        });
    if (successor) ops.push(prisma.user.update({ where: { id: successor.id }, data: { kgRole: "ADMIN" } }));
  }

  await prisma.$transaction(ops);
  await deleteBlobs(files.map((f) => f.blobPathname));
}
