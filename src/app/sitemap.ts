import type { MetadataRoute } from "next";
import { getBaseAppUrl } from "@/lib/email/config";
import { PUBLIC_PAGE_ROUTES } from "@/lib/seo";
import { prisma } from "@/lib/prisma";
import { publicGroups } from "@/lib/parents";
import { publicShowcaseWhere } from "@/lib/showcase";

// Кешира се за 1 час — обновява се автоматично при нови групи и одобрени дейности.
export const revalidate = 3600;

/** Карта на публичните страници: статични маршрути + страниците на групите и одобрената витрина. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseAppUrl();
  const now = new Date();

  const entries: MetadataRoute.Sitemap = PUBLIC_PAGE_ROUTES.map(({ path, priority, changeFrequency }) => ({
    url: `${baseUrl}${path === "/" ? "" : path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));

  if (!process.env.DATABASE_URL) return entries;

  try {
    const [groups, items] = await Promise.all([
      publicGroups(),
      prisma.showcaseItem.findMany({
        where: publicShowcaseWhere(),
        select: { id: true, updatedAt: true, publishedAt: true },
        orderBy: { publishedAt: "desc" },
        take: 200,
      }),
    ]);

    for (const g of groups) {
      entries.push({
        url: `${baseUrl}/grupi/${g.slug}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.75,
      });
    }

    const months = new Set<string>();
    for (const item of items) {
      const updated = item.updatedAt ?? item.publishedAt ?? now;
      entries.push({
        url: `${baseUrl}/vitrina/${item.id}`,
        lastModified: updated,
        changeFrequency: "monthly",
        priority: 0.6,
      });
      if (item.publishedAt) months.add(item.publishedAt.toISOString().slice(0, 7));
    }

    for (const ym of months) {
      entries.push({
        url: `${baseUrl}/vitrina/mesec/${ym}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.55,
      });
    }
  } catch (err) {
    console.warn("[sitemap] DB unavailable, returning static routes only:", err instanceof Error ? err.message : err);
  }

  return entries;
}
