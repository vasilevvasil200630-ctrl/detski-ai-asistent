import type { MetadataRoute } from "next";
import { getBaseAppUrl } from "@/lib/email/config";
import { PUBLIC_PAGE_ROUTES } from "@/lib/seo";

// По модела на МатураПлюс (src/app/sitemap.ts): само публичните страници.
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseAppUrl();
  const lastModified = new Date();
  return PUBLIC_PAGE_ROUTES.map(({ path, priority, changeFrequency }) => ({
    url: `${baseUrl}${path === "/" ? "" : path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
