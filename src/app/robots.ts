import type { MetadataRoute } from "next";
import { getBaseAppUrl } from "@/lib/email/config";
import { PRIVATE_PAGE_ROUTES } from "@/lib/seo";

// Копирано от МатураПлюс (src/app/robots.ts).
export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseAppUrl();

  // Preview/development deploy-ите на Vercel не се индексират изобщо
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: { userAgent: "*", allow: "/", disallow: [...PRIVATE_PAGE_ROUTES, "/api/"] },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
