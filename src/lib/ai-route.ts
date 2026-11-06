import "server-only";
import { MODEL_FLASH, resolveGeminiClient } from "@/lib/gemini-client";
import { generateSafeAIResponse } from "@/lib/gemini-retry";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

/** Vercel спира функцията след maxDuration — AI опитите приключват по-рано и минават на демо. */
export const AI_DEADLINE_MS = 45_000;

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
  });
  return parsed ?? rawText;
}
