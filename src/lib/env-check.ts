/**
 * Проверка на настройките при старт на сървъра (вика се от src/instrumentation.ts).
 * Всяка липсваща настройка се обяснява в логовете на Vercel.
 * Никога не хвърля: предупреждава, но не спира сайта.
 */

type EnvRule = {
  /** Поне една от изброените трябва да е зададена (за стари/алтернативни имена). */
  names: string[];
  /** Какво не работи без нея. */
  effect: string;
  required: boolean;
  /** Допълнителна проверка на стойността. */
  valid?: (value: string) => boolean;
  invalidHint?: string;
};

const RULES: EnvRule[] = [
  { names: ["DATABASE_URL"], effect: "базата данни е недостъпна — входът и колективната банка не работят", required: true },
  {
    names: ["SESSION_SECRET"],
    effect: "входът на учителите не работи",
    required: true,
    valid: (v) => v.length >= 32,
    invalidHint: "трябва да е поне 32 символа",
  },
  { names: ["GEMINI_API_KEY"], effect: "AI генерацията е изключена — сайтът работи само с вградения демо двигател", required: false },
  { names: ["UPSTASH_REDIS_REST_URL"], effect: "лимитите на заявките се броят отделно във всяка инстанция (по-слабо)", required: false },
  { names: ["UPSTASH_REDIS_REST_TOKEN"], effect: "лимитите на заявките се броят отделно във всяка инстанция (по-слабо)", required: false },
];

export type EnvProblem = { names: string[]; effect: string; required: boolean; hint?: string };

/** Връща липсващите/невалидните настройки (чиста функция — тества се без сървър). */
export function findEnvProblems(env: Record<string, string | undefined>): EnvProblem[] {
  const problems: EnvProblem[] = [];
  for (const rule of RULES) {
    const value = rule.names.map((n) => env[n]?.trim()).find((v) => v);
    if (!value) {
      problems.push({ names: rule.names, effect: rule.effect, required: rule.required });
    } else if (rule.valid && !rule.valid(value)) {
      problems.push({ names: rule.names, effect: rule.effect, required: rule.required, hint: rule.invalidHint });
    }
  }
  return problems;
}

/** Логва само проблемите при старт: задължителните — като грешка, препоръчителните — като предупреждение. */
export function reportEnvProblems(env: Record<string, string | undefined> = process.env): void {
  try {
    const problems = findEnvProblems(env);
    for (const p of problems) {
      const name = p.names.join(" / ");
      const line = `[env] ${name}${p.hint ? ` — ${p.hint}` : " липсва"} → ${p.effect}`;
      if (p.required) console.error(line);
      else console.warn(line);
    }
    // Без съобщение, когато всичко е наред — проверката тръгва при всяко „събуждане“ на сървъра
  } catch {
    // Проверката никога не бива да спре сървъра
  }
}
