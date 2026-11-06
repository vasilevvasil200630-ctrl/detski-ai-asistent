import "server-only";
import { ThinkingLevel } from "@google/genai";
import { MODEL_FLASH, resolveGeminiClient } from "@/lib/gemini-client";
import { generateSafeAIResponse } from "@/lib/gemini-retry";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

/**
 * Краен срок за всички AI опити. По-кратък от изчакването в браузъра (40 s в aiEngine.ts),
 * за да стигне отговорът (истински или демо) до учителя, преди браузърът да се откаже.
 */
export const AI_DEADLINE_MS = 34_000;
/** Таван за един опит: първият модел получава почти целия срок, резервният — остатъка. */
const PER_CALL_TIMEOUT_MS = 28_000;

export function hasGeminiKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

/**
 * Лимит за AI заявки по IP. По-висок таван: на практикума цялата зала излиза
 * в интернет от един IP (както училищният NAT в МатураПлюс).
 */
export async function checkAiRateLimit(request: Request) {
  return checkRateLimit(`ai:${getClientIp(request)}`, 60);
}

/** Вика Gemini с повторни опити и резервни модели. Връща суровия JSON или undefined. */
export async function askGeminiJson(prompt: string, maxOutputTokens = 6000): Promise<unknown> {
  const { client } = resolveGeminiClient();
  const { parsed, rawText } = await generateSafeAIResponse({
    client,
    model: MODEL_FLASH,
    prompt,
    isJson: true,
    maxOutputTokens,
    deadline: Date.now() + AI_DEADLINE_MS,
    perCallTimeoutMs: PER_CALL_TIMEOUT_MS,
    // Без ограничение моделът „мисли“ над 25 s за три игри; LOW отговаря за секунди
    thinkingLevel: ThinkingLevel.LOW,
  });
  return parsed ?? rawText;
}
