/**
 * Ограничение на неуспешните опити за /api/auth/login.
 * 5 неуспешни опита / 15 минути / (ip, email) двойка.
 *
 * С Upstash Redis (UPSTASH_REDIS_REST_URL / _TOKEN) броенето е общо за всички
 * serverless инстанции. Без Redis (локална разработка) — sliding window в паметта.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

// Всеки неуспешен опит „харчи“ един токен; проверката само чете остатъка.
const failedLogins =
  redisUrl && redisToken
    ? new Ratelimit({
        // Един повторен опит — при недостъпен Redis входът не чака, а минава на лимит в паметта
        redis: new Redis({ url: redisUrl, token: redisToken, retry: { retries: 1, backoff: () => 100 } }),
        limiter: Ratelimit.slidingWindow(MAX_ATTEMPTS, "15 m"),
        prefix: "detski-ai:login-fail",
      })
    : null;

type Attempts = number[];
const attemptsByKey = new Map<string, Attempts>();

function keyFor(ip: string, email: string): string {
  return `${ip}:${email.toLowerCase()}`;
}

function pruneOld(list: Attempts, now: number): Attempts {
  const cutoff = now - WINDOW_MS;
  let firstFresh = 0;
  while (firstFresh < list.length && list[firstFresh]! < cutoff) firstFresh++;
  return firstFresh === 0 ? list : list.slice(firstFresh);
}

export type LoginRateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
};

export async function checkLoginRateLimit(
  ip: string,
  email: string,
): Promise<LoginRateLimitResult> {
  const key = keyFor(ip, email);
  const now = Date.now();

  if (failedLogins) {
    try {
      const { remaining, reset } = await failedLogins.getRemaining(key);
      return {
        allowed: remaining > 0,
        remaining,
        resetInSeconds: Math.max(1, Math.ceil((reset - now) / 1000)),
      };
    } catch (err) {
      console.warn("[auth] Upstash login limiter недостъпен → лимит в паметта:", err);
    }
  }

  const pruned = pruneOld(attemptsByKey.get(key) ?? [], now);
  attemptsByKey.set(key, pruned);

  if (pruned.length >= MAX_ATTEMPTS) {
    const oldest = pruned[0]!;
    const resetInSeconds = Math.max(
      1,
      Math.ceil((oldest + WINDOW_MS - now) / 1000),
    );
    return { allowed: false, remaining: 0, resetInSeconds };
  }

  return {
    allowed: true,
    remaining: MAX_ATTEMPTS - pruned.length,
    resetInSeconds: Math.ceil(WINDOW_MS / 1000),
  };
}

/**
 * Регистрирай неуспешен опит. Викай СЛЕД неуспешна проверка на парола,
 * не при валидационни грешки — иначе typo в имейл ще заключва невинни.
 */
export async function recordFailedLogin(ip: string, email: string): Promise<void> {
  const key = keyFor(ip, email);
  if (failedLogins) {
    try {
      await failedLogins.limit(key);
      return;
    } catch (err) {
      console.warn("[auth] Upstash login limiter недостъпен → лимит в паметта:", err);
    }
  }
  const now = Date.now();
  const pruned = pruneOld(attemptsByKey.get(key) ?? [], now);
  pruned.push(now);
  attemptsByKey.set(key, pruned);
}

/**
 * Изчисти броенето при успешен login. Иначе легитимен user който е
 * забравил паролата няколко пъти остава locked дори след правилен вход.
 */
export async function clearFailedLogins(ip: string, email: string): Promise<void> {
  const key = keyFor(ip, email);
  attemptsByKey.delete(key);
  if (failedLogins) {
    await failedLogins.resetUsedTokens(key).catch(() => {});
  }
}
