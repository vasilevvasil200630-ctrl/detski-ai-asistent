/**
 * По модела на МатураПлюс (src/lib/seo.ts). Облакът е затворен за учителите на ДГ „Пролет“:
 * търсачките виждат само началната страница и правните страници; всичко друго не се
 * обхожда (robots.ts) и не се индексира (X-Robots-Tag в next.config.ts).
 * Без path alias-и — файлът се импортира и от next.config.ts.
 */
export const PRIVATE_PAGE_ROUTES = [
  "/games",
  "/materials",
  "/dos",
  "/prompts",
  "/holidays",
  "/naredba5",
  "/library",
  "/hub",
  "/cloud",
  "/notebook",
  "/profile",
  "/print",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
] as const;

/** Публичните страници — за sitemap.xml. */
export const PUBLIC_PAGE_ROUTES = [
  { path: "/", priority: 1.0, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
] as const;
