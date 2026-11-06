import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const WINDOW = "1 m" as const;
const LIMIT = 10;

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

/** Таймаут към Upstash: при недостъпен Redis проверката не бива да бави заявката. */
const UPSTASH_TIMEOUT_MS = 1500;

/** Един повторен опит вместо 5 с нарастващо чакане (по подразбиране в @upstash/redis). */
function upstashRedis(): Redis {
  return new Redis({ url: url!, token: token!, retry: { retries: 1, backoff: () => 100 } });
}

const ratelimit =
  url && token
    ? new Ratelimit({
        redis: upstashRedis(),
        limiter: Ratelimit.slidingWindow(LIMIT, WINDOW),
        analytics: true,
        prefix: "detski-ai",
        timeout: UPSTASH_TIMEOUT_MS,
      })
    : null;

let warnedOnce = false;
function warnMissingUpstash() {
  if (warnedOnce) return;
  warnedOnce = true;
  console.warn(
    "[rate-limit] UPSTASH_REDIS_REST_URL / _TOKEN not set — burst limits counted in instance memory. " +
      "Daily per-user limits still enforced via Postgres.",
  );
}

let lastUpstashErrorLog = 0;
/** Грешка от Upstash (недостъпен, изчерпан лимит) — логва най-много веднъж в минута. */
function warnUpstashError(err: unknown) {
  const now = Date.now();
  if (now - lastUpstashErrorLog < 60_000) return;
  lastUpstashErrorLog = now;
  console.warn(
    "[rate-limit] Upstash грешка → временен лимит в паметта на инстанцията:",
    err instanceof Error ? err.message : err,
  );
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
};

// Лимитери на минута с таван, различен от LIMIT (напр. по-високият таван по IP)
const minuteLimiters = new Map<number, Ratelimit>();
function minuteLimiter(limit: number): Ratelimit | null {
  if (limit === LIMIT) return ratelimit;
  if (!url || !token) return null;
  let limiter = minuteLimiters.get(limit);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: upstashRedis(),
      limiter: Ratelimit.slidingWindow(limit, WINDOW),
      prefix: `matura-ai:m${limit}`,
      timeout: UPSTASH_TIMEOUT_MS,
    });
    minuteLimiters.set(limit, limiter);
  }
  return limiter;
}

export async function checkRateLimit(key: string, limit: number = LIMIT): Promise<RateLimitResult> {
  const limiter = minuteLimiter(limit);
  if (!limiter) {
    // Без Upstash лимитът не се изключва — брои се в паметта на инстанцията
    warnMissingUpstash();
    return memoryLimit(`burst${limit}:${key}`, limit, 60_000);
  }
  try {
    const result = await limiter.limit(key);
    // При таймаут библиотеката пропуска заявката — тогава броим в паметта
    if (result.reason === "timeout") throw new Error("Upstash timeout");
    return {
      allowed: result.success,
      remaining: result.remaining,
      resetInSeconds: Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)),
    };
  } catch (err) {
    // Upstash е недостъпен — без 500 за потребителя; лимитът продължава в паметта
    warnUpstashError(err);
    return memoryLimit(`burst${limit}:${key}`, limit, 60_000);
  }
}

/**
 * Таван по IP за действия на ученици: цял клас в компютърен кабинет излиза в интернет
 * от един IP (училищен NAT) — ~30 ученици по няколко заявки в минута.
 */
export const CLASSROOM_IP_LIMIT = 120;

/**
 * Лимит на минута основно по потребител (сесия или подписан гостов id) и по-висок таван
 * по IP. Само по IP (10/мин) спираше цял клас след 10-ата заявка; само по потребител
 * може да се заобиколи с изтриване на бисквитките — таванът по IP пази от това.
 */
export async function checkUserRateLimit(scope: string, userId: string, ip: string): Promise<RateLimitResult> {
  const perUser = await checkRateLimit(`${scope}:u:${userId}`);
  if (!perUser.allowed) return perUser;
  return checkRateLimit(`${scope}:ip:${ip}`, CLASSROOM_IP_LIMIT);
}

type LongWindow = "1 h" | "1 d";
const WINDOW_MS: Record<LongWindow, number> = { "1 h": 60 * 60 * 1000, "1 d": 24 * 60 * 60 * 1000 };
const windowedLimiters = new Map<string, Ratelimit>();
const memoryHits = new Map<string, number[]>();

/**
 * Лимит с по-дълъг прозорец (напр. „3 имейла на ден“) — за действия, които
 * изпращат имейли или дават точки. С Upstash е общ за всички инстанции;
 * без Redis (локално) или при грешка в Upstash се пази в паметта на процеса.
 */
export async function checkWindowedLimit(
  key: string,
  limit: number,
  window: LongWindow,
): Promise<RateLimitResult> {
  if (url && token) {
    const id = `${limit}/${window}`;
    let limiter = windowedLimiters.get(id);
    if (!limiter) {
      limiter = new Ratelimit({
        redis: upstashRedis(),
        limiter: Ratelimit.slidingWindow(limit, window),
        prefix: `matura-ai:w:${id}`,
        timeout: UPSTASH_TIMEOUT_MS,
      });
      windowedLimiters.set(id, limiter);
    }
    try {
      const result = await limiter.limit(key);
      // При таймаут библиотеката пропуска заявката — дневните лимити минават в паметта
      if (result.reason === "timeout") throw new Error("Upstash timeout");
      return {
        allowed: result.success,
        remaining: result.remaining,
        resetInSeconds: Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)),
      };
    } catch (err) {
      // Дневните лимити (имейли, точки) не се изключват — продължават в паметта
      warnUpstashError(err);
    }
  }

  return memoryLimit(`${limit}/${window}:${key}`, limit, WINDOW_MS[window]);
}

/** Sliding window в паметта на процеса — без Redis или при грешка в Upstash. */
function memoryLimit(bucket: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const hits = (memoryHits.get(bucket) ?? []).filter((t) => t > now - windowMs);
  if (hits.length >= limit) {
    memoryHits.set(bucket, hits);
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds: Math.max(1, Math.ceil((hits[0]! + windowMs - now) / 1000)),
    };
  }
  hits.push(now);
  memoryHits.set(bucket, hits);
  return { allowed: true, remaining: limit - hits.length, resetInSeconds: Math.ceil(windowMs / 1000) };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}
