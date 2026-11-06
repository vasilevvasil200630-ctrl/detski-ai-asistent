import crypto from "crypto";

// По модела на generateStudentCode() от МатураПлюс: код без двусмислени символи (0/O, 1/I).
export function generateJoinCode(): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "ДГ-";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(crypto.randomInt(0, chars.length));
  }
  return code;
}

/** Нормализира въведен код: главни букви, без интервали, приема и латинско „DG-“. */
export function normalizeJoinCode(raw: string): string {
  const s = raw.trim().toUpperCase().replace(/\s+/g, "");
  if (s.startsWith("DG-")) return `ДГ-${s.slice(3)}`;
  if (!s.startsWith("ДГ-") && /^[A-Z0-9]{6}$/.test(s)) return `ДГ-${s}`;
  return s;
}
