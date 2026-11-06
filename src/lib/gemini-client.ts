import { GoogleGenAI } from "@google/genai";

// Model IDs БЕЗ "models/" префикс — SDK-то го добавя автоматично.
//
// PRIMARY модели: gemini-3.8-flash (наличен за платформения ключ по ListModels).
export const MODEL_FLASH = "gemini-3.8-flash";
export const MODEL_PRO = "gemini-3.8-flash";
//
// FALLBACK — изпитаният gemini-3.6-flash (с него са калибрирани МОН промптовете).
// Конкретна версия, а не alias „gemini-flash-latest“: alias-ът може да сочи към същия
// претоварен модел и при 503 резервата няма да помогне.
export const MODEL_FALLBACK = "gemini-3.6-flash";
export const MODEL_LAST_RESORT = "gemini-3.5-flash-lite";

const platformKey = process.env.GEMINI_API_KEY ?? "";
const platformClient = platformKey ? new GoogleGenAI({ apiKey: platformKey }) : null;

if (!platformKey) {
  console.warn(
    "[gemini-client] GEMINI_API_KEY не е конфигуриран — AI маршрутите връщат демо резултати.",
  );
} else {
  // Без части от ключа в логовете — само че е зареден и каква е дължината му
  console.info(`[gemini-client] Platform GEMINI_API_KEY зареден (len ${platformKey.length})`);
}

export type ResolvedClient = {
  client: GoogleGenAI;
  usingUserKey: boolean;
};

export function resolveGeminiClient(request?: Request): ResolvedClient {
  void request;
  if (!platformClient) {
    throw new Error(
      "Възникна временна грешка при зареждане на анализа. Опитайте отново.",
    );
  }
  return { client: platformClient, usingUserKey: false };
}

export type ChatContentBlock =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

export type ChatMessage = {
  role: "user" | "model";
  parts: ChatContentBlock[];
};

export type ClientBlock =
  | { type: "text"; text: string }
  | {
      type: "image";
      source: { type: "base64"; media_type: string; data: string };
    };

export type ClientMessage = {
  role: "user" | "assistant";
  content: string | ClientBlock[];
};

export function convertClientMessages(messages: ClientMessage[]): ChatMessage[] {
  return messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: convertContent(m.content),
  }));
}

function convertContent(content: string | ClientBlock[]): ChatContentBlock[] {
  if (typeof content === "string") return [{ text: content }];
  return content.map((block) => {
    if (block.type === "text") return { text: block.text };
    return {
      inlineData: {
        mimeType: block.source.media_type,
        data: block.source.data,
      },
    };
  });
}

export function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const arrayStart = text.indexOf("[");
  const objectStart = text.indexOf("{");
  const starts = [arrayStart, objectStart].filter((v) => v !== -1);
  if (starts.length === 0) return text.trim();
  const start = Math.min(...starts);
  const openChar = text[start];
  const closeChar = openChar === "[" ? "]" : "}";
  const end = text.lastIndexOf(closeChar);
  if (end > start) return text.slice(start, end + 1);
  return text.trim();
}

/**
 * Robustly parse a Gemini text response as JSON.
 * Handles: raw JSON, markdown code fences (```json ... ```),
 * leading/trailing text, extra content after JSON, object-vs-array root.
 *
 * Strategy cascade:
 * 1) Strip fences, JSON.parse
 * 2) Extract substring between first `[` and last `]` (or `{` / `}`)
 *    → handles "Unexpected non-whitespace after JSON at position N"
 *    when Gemini appends garbage or a second JSON block
 * 3) Regex-match first complete { ... } or [ ... ]
 * 4) Try each root type independently
 *
 * Throws only if ALL strategies fail.
 */
export function cleanAndParseJson<T = unknown>(rawText: string): T {
  const cleaned = rawText
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  // Strategy 1: direct parse of cleaned text
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // continue
  }

  // Strategy 2: array — extract first [ to last ]
  const firstBracket = cleaned.indexOf("[");
  const lastBracket = cleaned.lastIndexOf("]");
  if (firstBracket !== -1 && lastBracket > firstBracket) {
    const arraySlice = cleaned.substring(firstBracket, lastBracket + 1);
    try {
      return JSON.parse(arraySlice) as T;
    } catch {
      // continue
    }
  }

  // Strategy 3: object — extract first { to last }
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const objectSlice = cleaned.substring(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(objectSlice) as T;
    } catch {
      // continue
    }
  }

  // Strategy 4: greedy regex — първи complete { … } или [ … ]
  const objMatch = cleaned.match(/\{[\s\S]*\}/);
  const arrMatch = cleaned.match(/\[[\s\S]*\]/);
  const candidate =
    objMatch && arrMatch
      ? (objMatch.index ?? 0) < (arrMatch.index ?? 0)
        ? objMatch[0]
        : arrMatch[0]
      : (objMatch?.[0] ?? arrMatch?.[0]);
  if (candidate) {
    try {
      return JSON.parse(candidate) as T;
    } catch {
      // fall through
    }
  }

  // Strategy 5: extractJson (backwards compat)
  try {
    return JSON.parse(extractJson(cleaned)) as T;
  } catch {
    throw new Error(
      `No parseable JSON found. First 200 chars: ${cleaned.slice(0, 200)}`,
    );
  }
}

export function isBillingOrQuotaError(error: unknown): boolean {
  if (!error) return false;
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return (
    message.includes("quota") ||
    message.includes("billing") ||
    message.includes("rate limit") ||
    message.includes("resource_exhausted") ||
    message.includes("permission_denied") ||
    message.includes("api key not valid") ||
    message.includes("api_key_invalid")
  );
}
