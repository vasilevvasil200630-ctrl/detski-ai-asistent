import "server-only";
import type { NoteItem } from "@/lib/notes-shared";

/**
 * Календарни файлове (iCalendar, RFC 5545) за задачите от бележника: телефонът напомня сам,
 * без писма. Задача без час е целодневна, напомнянето е в 8:00; задача с час — час преди
 * (или толкова дни преди, колкото е избрано). Часът е българският (Europe/Sofia).
 */

const CRLF = "\r\n";

/** Софийската часова зона — за да е верен часът и на телефон в друга зона. */
const VTIMEZONE = [
  "BEGIN:VTIMEZONE",
  "TZID:Europe/Sofia",
  "BEGIN:STANDARD",
  "DTSTART:19701025T040000",
  "TZOFFSETFROM:+0300",
  "TZOFFSETTO:+0200",
  "TZNAME:EET",
  "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
  "END:STANDARD",
  "BEGIN:DAYLIGHT",
  "DTSTART:19700329T030000",
  "TZOFFSETFROM:+0200",
  "TZOFFSETTO:+0300",
  "TZNAME:EEST",
  "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
  "END:DAYLIGHT",
  "END:VTIMEZONE",
];

export function escapeText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Реди над 75 байта се пренасят (кирилицата е по 2 байта — не цепим буква). */
export function foldLine(line: string): string {
  const out: string[] = [];
  let cur = "";
  let bytes = 0;
  for (const ch of line) {
    const b = Buffer.byteLength(ch);
    if (bytes + b > (out.length ? 74 : 75)) {
      out.push(cur);
      cur = "";
      bytes = 0;
    }
    cur += ch;
    bytes += b;
  }
  out.push(cur);
  return out.join(`${CRLF} `);
}

const ymd = (iso: string) => iso.replace(/-/g, "");
const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/** „ГГГГ-ММ-ДД“ + „ЧЧ:ММ“ + минути → местно „ГГГГММДДTЧЧММSS“ (без часова зона). */
function localPlus(dateIso: string, time: string, minutes: number): string {
  const d = new Date(Date.UTC(+dateIso.slice(0, 4), +dateIso.slice(5, 7) - 1, +dateIso.slice(8, 10), +time.slice(0, 2), +time.slice(3, 5) + minutes));
  return stamp(d).replace("Z", "");
}

/** Кога звъни: целодневната започва в 0:00, затова „в деня“ е +8 ч., а „1 ден преди“ — −16 ч. (8:00 предния ден). */
export function alarmTrigger(remindDays: number, timed: boolean): string {
  if (timed) return remindDays === 0 ? "-PT1H" : `-P${remindDays}D`;
  if (remindDays === 0) return "PT8H";
  return remindDays === 1 ? "-PT16H" : `-P${remindDays - 1}DT16H`;
}

export function noteSummary(n: Pick<NoteItem, "title" | "body">): string {
  return (n.title || n.body.split(/\r?\n/).find((l) => l.trim()) || "Задача").trim().slice(0, 160);
}

function eventLines(n: NoteItem, appUrl: string): string[] {
  if (!n.dueDate) return [];
  const summary = noteSummary(n);
  const description = [n.title ? n.body.trim() : "", `Моят бележник: ${appUrl}/notebook`].filter(Boolean).join("\n\n");
  const lines = [
    "BEGIN:VEVENT",
    `UID:note-${n.id}@detski-ai-asistent`,
    `DTSTAMP:${stamp(new Date(n.updatedAt))}`,
    `LAST-MODIFIED:${stamp(new Date(n.updatedAt))}`,
  ];
  if (n.dueTime) {
    lines.push(`DTSTART;TZID=Europe/Sofia:${localPlus(n.dueDate, n.dueTime, 0)}`, `DTEND;TZID=Europe/Sofia:${localPlus(n.dueDate, n.dueTime, 60)}`);
  } else {
    lines.push(`DTSTART;VALUE=DATE:${ymd(n.dueDate)}`, `DTEND;VALUE=DATE:${localPlus(n.dueDate, "00:00", 24 * 60).slice(0, 8)}`);
  }
  lines.push(`SUMMARY:${escapeText(summary)}`, `DESCRIPTION:${escapeText(description)}`, "TRANSP:TRANSPARENT");
  if (n.remindDays !== null) {
    lines.push("BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${escapeText(summary)}`, `TRIGGER:${alarmTrigger(n.remindDays, Boolean(n.dueTime))}`, "END:VALARM");
  }
  lines.push("END:VEVENT");
  return lines;
}

/** Цял календар (абонамент или един файл) от задачите. */
export function buildCalendar(notes: NoteItem[], appUrl: string, name = "Моят бележник"): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ДГ Пролет//Учителски облак//BG",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(name)}`,
    "X-WR-TIMEZONE:Europe/Sofia",
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
    "X-PUBLISHED-TTL:PT1H",
    ...VTIMEZONE,
    ...notes.flatMap((n) => eventLines(n, appUrl)),
    "END:VCALENDAR",
  ];
  return lines.map(foldLine).join(CRLF) + CRLF;
}

export const ICS_HEADERS = {
  "Content-Type": "text/calendar; charset=utf-8",
  "Cache-Control": "private, no-store",
  "X-Robots-Tag": "noindex, nofollow",
  "Referrer-Policy": "no-referrer",
};
