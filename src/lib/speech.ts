"use client";

// Копирано от МатураПлюс (src/lib/speech.ts): четене на глас с български глас, ако браузърът
// има такъв, и разпознаване на реч (диктуване) на български. Без LaTeX почистването.

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

export type SpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

export type SpeechRecognitionEvent = {
  resultIndex: number;
  results: {
    length: number;
    [i: number]: { isFinal: boolean; length: number; [j: number]: { transcript: string; confidence: number } };
  };
};

export type SpeechRecognitionErrorEvent = { error: string; message?: string };

type WindowWithSpeech = Window & {
  webkitSpeechRecognition?: SpeechRecognitionCtor;
  SpeechRecognition?: SpeechRecognitionCtor;
};

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as WindowWithSpeech;
  return !!(w.SpeechRecognition || w.webkitSpeechRecognition);
}

export function createSpeechRecognition(): SpeechRecognitionInstance | null {
  if (typeof window === "undefined") return null;
  const w = window as WindowWithSpeech;
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Ctor) return null;
  const rec = new Ctor();
  rec.lang = "bg-BG";
  rec.continuous = false;
  rec.interimResults = true;
  rec.maxAlternatives = 1;
  return rec;
}

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== "undefined" && typeof window.speechSynthesis !== "undefined";
}

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const existing = window.speechSynthesis.getVoices();
    if (existing.length > 0) {
      resolve(existing);
      return;
    }
    let done = false;
    const handler = () => {
      if (done) return;
      done = true;
      resolve(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.addEventListener("voiceschanged", handler, { once: true });
    setTimeout(handler, 1500);
  });
}

export async function getBulgarianVoice(): Promise<SpeechSynthesisVoice | null> {
  if (!isSpeechSynthesisSupported()) return null;
  const voices = await loadVoices();
  return (
    voices.find((v) => v.lang === "bg-BG" || v.lang === "bg_BG") ??
    voices.find((v) => v.lang.toLowerCase().startsWith("bg")) ??
    null
  );
}

export function cleanTextForSpeech(text: string): string {
  return text
    .replace(/[*_#>|„“"]/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

let currentUtterance: SpeechSynthesisUtterance | null = null;

/** Чете текста на глас. Връща false, ако браузърът не може. `rate` < 1 е по-бавно — за децата. */
export async function speak(text: string, onEnd?: () => void, rate = 1.0): Promise<boolean> {
  if (!isSpeechSynthesisSupported()) return false;
  stopSpeaking();
  const cleaned = cleanTextForSpeech(text);
  if (!cleaned) return false;
  const voice = await getBulgarianVoice();
  const utter = new SpeechSynthesisUtterance(cleaned);
  utter.lang = "bg-BG";
  utter.rate = rate;
  utter.pitch = 1.0;
  if (voice) utter.voice = voice;
  const finish = () => {
    if (currentUtterance === utter) currentUtterance = null;
    onEnd?.();
  };
  utter.onend = finish;
  utter.onerror = finish;
  currentUtterance = utter;
  window.speechSynthesis.speak(utter);
  return true;
}

export function stopSpeaking(): void {
  if (typeof window === "undefined") return;
  if (window.speechSynthesis?.speaking || window.speechSynthesis?.pending) window.speechSynthesis.cancel();
  currentUtterance = null;
}
