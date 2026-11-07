/**
 * По модела на МатураПлюс (src/lib/seo.ts): лични страници на учителите. Търсачките не ги
 * обхождат (robots.ts) и не ги индексират (X-Robots-Tag в next.config.ts).
 * Без path alias-и — файлът се импортира и от next.config.ts.
 */
export const PRIVATE_PAGE_ROUTES = ["/library", "/hub", "/profile", "/login", "/register", "/forgot-password", "/reset-password"] as const;

/** Публичните страници с уникално съдържание — за sitemap.xml. */
export const PUBLIC_PAGE_ROUTES = [
  { path: "/", priority: 1.0, changeFrequency: "weekly" },
  { path: "/games", priority: 0.9, changeFrequency: "weekly" },
  { path: "/dos", priority: 0.9, changeFrequency: "weekly" },
  { path: "/prompts", priority: 0.8, changeFrequency: "monthly" },
  { path: "/holidays", priority: 0.8, changeFrequency: "monthly" },
  { path: "/naredba5", priority: 0.8, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
] as const;
