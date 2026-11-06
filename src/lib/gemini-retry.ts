/**
 * Унифициран AI response helper за МатураПлюс.
 *
 * Стратегия на generateSafeAIResponse:
 *   1. Опит с primary модел
 *   2. При 503 / 429 / high demand / timeout — retry със същия модел
 *      + exponential backoff (1s, 2s) до 2 retry опита (3 общо)
 *   3. Ако всички retry-та fail-нат (или грешката не е transient, напр. 404 за
 *      retire-нат модел) — по един опит с fallback модела и MODEL_LAST_RESORT
 *   4. Ако и те fail-нат — throw последната грешка (caller прави mock)
 *
 * Ако isJson=true:
 *   - Задава responseMimeType: application/json към Gemini config
 *   - След получаване прави regex извличане на JSON и JSON.parse
 *   - Връща както rawText, така и parsed обект
 *
 * Този helper е унифицирано API за всички AI endpoints.
 * Ниско-нивовият callGeminiWithRetry остава за backwards compat.
 */

import type { ThinkingLevel, GoogleGenAI } from "@google/genai";
import { MODEL_FALLBACK, MODEL_LAST_RESORT, cleanAndParseJson } from "@/lib/gemini-client";

export type GeminiCallFn<T> = (model: string) => Promise<T>;

function isTransient(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return (
    msg.includes("503") ||
    msg.includes("service unavailable") ||
    msg.includes("high demand") ||
    msg.includes("overloaded") ||
    msg.includes("429") ||
    msg.includes("rate limit") ||
    msg.includes("resource_exhausted") ||
    msg.includes("quota") ||
    msg.includes("timeout") ||
    msg.includes("fetch failed") ||
    msg.includes("econnreset") ||
    msg.includes("etimedout")
  );
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Ниско-нивова retry обвивка. Ползвана вътрешно от generateSafeAIResponse
 * + от legacy call sites. Backoffs: 1.5s, 3s, 4.5s (по спецификация).
 */
/** Под този остатък до крайния срок нов опит няма смисъл — няма да завърши навреме. */
const MIN_ATTEMPT_MS = 3000;

export class GeminiDeadlineError extends Error {
  constructor() {
    super("Gemini deadline exceeded (timeout)");
    this.name = "GeminiDeadlineError";
  }
}

export async function callGeminiWithRetry<T>(
  primaryModel: string,
  fallbackModel: string,
  call: GeminiCallFn<T>,
  // Краен срок (epoch ms): без нови опити и паузи след него — за пътища с лимит на Vercel
  options: { deadline?: number } = {},
): Promise<T> {
  const backoffs = [1500, 3000, 4500];
  let lastErr: unknown;
  const remaining = () => (options.deadline ? options.deadline - Date.now() : Infinity);

  for (let attempt = 0; attempt <= backoffs.length; attempt++) {
    if (remaining() < MIN_ATTEMPT_MS) break;
    try {
      return await call(primaryModel);
    } catch (err) {
      lastErr = err;
      if (!isTransient(err) || attempt === backoffs.length) break;
      const delay = backoffs[attempt]!;
      if (delay + MIN_ATTEMPT_MS > remaining()) break;
      console.warn(
        `[gemini-retry] ${primaryModel} transient error, retry in ${delay}ms (attempt ${attempt + 1}):`,
        err instanceof Error ? err.message : err,
      );
      await sleep(delay);
    }
  }

  // Fallback chain: the caller's fallback, then the lite alias as a last resort.
  // Covers both retired models (404) and sustained overload on the primary.
  const chain = [fallbackModel, MODEL_LAST_RESORT].filter(
    (m, i, arr): m is string => Boolean(m) && m !== primaryModel && arr.indexOf(m) === i,
  );
  for (const model of chain) {
    if (remaining() < MIN_ATTEMPT_MS) break;
    try {
      console.warn(`[gemini-retry] falling back to ${model}`);
      return await call(model);
    } catch (err) {
      lastErr = err;
    }
  }

  // Без нито един опит (срокът е изтекъл) lastErr е празен
  throw lastErr instanceof Error ? lastErr : new GeminiDeadlineError();
}

export type GenerateSafeParams = {
  client: GoogleGenAI;
  model: string;
  prompt: string;
  systemInstruction?: string;
  isJson?: boolean;
  maxOutputTokens?: number;
  fallbackModel?: string;
  /** Краен срок (epoch ms) за всички опити; всяко повикване се прекъсва (abortSignal) при него. */
  deadline?: number;
  /** Таван за едно повикване към модела при зададен deadline. */
  perCallTimeoutMs?: number;
  /** Колко да „мисли“ моделът; LOW = бърз отговор (както в МатураПлюс). */
  thinkingLevel?: ThinkingLevel;
};

export type GenerateSafeResult<T = unknown> = {
  rawText: string;
  parsed?: T;
  modelUsed: string;
};

/**
 * Основен унифициран helper за AI generation в МатураПлюс.
 *
 * Пример:
 *   const { parsed } = await generateSafeAIResponse<QuizQuestion[]>({
 *     client, model: MODEL_FLASH,
 *     systemInstruction: SYSTEM_PROMPT,
 *     prompt: userMessage,
 *     isJson: true,
 *   });
 *
 * При isJson=true parsing стратегията е:
 *   1. cleanAndParseJson (5 стратегии — markdown fences, brackets, regex)
 *   2. Ако fail-не — простия regex `/\{[\s\S]*\}|\[[\s\S]*\]/` + JSON.parse
 *   3. Ако и той fail-не — parsed е undefined, caller решава fallback
 *
 * НЕ хвърля при parse fail — просто parsed=undefined; caller проверява.
 * ХВЪРЛЯ САМО ако всички retry + fallback модел fail-нат при API call.
 */
export async function generateSafeAIResponse<T = unknown>(
  params: GenerateSafeParams,
): Promise<GenerateSafeResult<T>> {
  const {
    client,
    model,
    prompt,
    systemInstruction,
    isJson = false,
    maxOutputTokens = 4096,
    fallbackModel = MODEL_FALLBACK,
    deadline,
    perCallTimeoutMs = 25_000,
    thinkingLevel,
  } = params;

  let modelUsed = model;
  const response = await callGeminiWithRetry(
    model,
    fallbackModel,
    async (m) => {
      modelUsed = m;
      // При краен срок всяко повикване се прекъсва навреме, вместо Vercel да убие функцията
      const abortSignal = deadline
        ? AbortSignal.timeout(Math.max(1000, Math.min(perCallTimeoutMs, deadline - Date.now())))
        : undefined;
      return client.models.generateContent({
        model: m,
        contents: prompt,
        config: {
          ...(systemInstruction ? { systemInstruction } : {}),
          maxOutputTokens,
          ...(thinkingLevel ? { thinkingConfig: { thinkingLevel } } : {}),
          ...(isJson ? { responseMimeType: "application/json" as const } : {}),
          ...(abortSignal ? { abortSignal } : {}),
        },
      });
    },
    { deadline },
  );

  const rawText = response.text ?? "";

  if (!isJson) {
    return { rawText, modelUsed };
  }

  // JSON parsing: try robust helper first, then simple regex fallback
  let parsed: T | undefined;
  try {
    parsed = cleanAndParseJson<T>(rawText);
  } catch {
    const match = rawText.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (match) {
      try {
        parsed = JSON.parse(match[0]) as T;
      } catch {
        // parsed остава undefined
      }
    }
  }

  return { rawText, parsed, modelUsed };
}
