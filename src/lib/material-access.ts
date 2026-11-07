import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Материал, който учителят може да вижда: свой или споделен в неговата детска градина.
 * Споделените игри от банката се виждат и между градините (обхват „Всички градини“ в Хъба).
 */
export async function findVisibleMaterial(id: string, userId: string, opts: { anyKindergartenGames?: boolean } = {}) {
  const [me, material] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { kindergartenId: true } }),
    prisma.material.findUnique({ where: { id } }),
  ]);
  if (!me || !material) return null;
  if (material.authorId === userId) return material;
  if (!material.shared) return null;
  if (material.kindergartenId && material.kindergartenId === me.kindergartenId) return material;
  if (opts.anyKindergartenGames && material.kind === "GAME") return material;
  return null;
}
