import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * По модела на МатураПлюс (src/lib/account-deletion.ts): изтрива профила и личните данни на
 * учителя (GDPR, чл. 17) в една транзакция — или всичко, или нищо.
 *
 * - Материалите на учителя (включително споделените) се изтриват; харесванията им — каскадно.
 * - Копията, които колегите са си запазили, остават техни.
 * - Детската градина остава за колегите. Ако учителят е бил единственият администратор,
 *   администратор става най-старият останал колега.
 */
export async function deleteUserAccount(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { kgRole: true, kindergartenId: true } });
  if (!user) return;

  const ops = [
    prisma.material.deleteMany({ where: { authorId: userId } }),
    prisma.bankGame.deleteMany({ where: { authorId: userId } }),
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
}
