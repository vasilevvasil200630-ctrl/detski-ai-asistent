"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { createSpeechRecognition, isSpeechRecognitionSupported, type SpeechRecognitionInstance } from "@/lib/speech";

// Копирано от МатураПлюс (src/components/VoiceMic.tsx): диктуване на темата на български.

type Props = {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  className?: string;
};

export function VoiceMic({ onTranscript, disabled, className }: Props) {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognitionInstance | null>(null);
  const interimRef = useRef("");
  const finalRef = useRef("");

  useEffect(() => {
    setSupported(isSpeechRecognitionSupported());
    return () => {
      try {
        recRef.current?.abort();
      } catch {
        // ignore
      }
    };
  }, []);

  const toggle = useCallback(() => {
    if (recording) {
      try {
        recRef.current?.stop();
      } catch {
        // ignore
      }
      setRecording(false);
      return;
    }
    setError(null);
    const rec = createSpeechRecognition();
    if (!rec) {
      setError("Браузърът не поддържа диктуване.");
      return;
    }
    interimRef.current = "";
    finalRef.current = "";
    rec.onstart = () => setRecording(true);
    rec.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) finalRef.current += result[0].transcript;
        else interim += result[0].transcript;
      }
      interimRef.current = interim;
    };
    rec.onerror = (event) => {
      if (event.error === "no-speech") setError("Не чух нищо. Опитайте пак.");
      else if (event.error === "not-allowed" || event.error === "service-not-allowed") setError("Разрешете достъп до микрофона в браузъра.");
      else if (event.error !== "aborted") setError("Диктуването не успя. Опитайте пак.");
      setRecording(false);
    };
    rec.onend = () => {
      setRecording(false);
      const combined = `${finalRef.current} ${interimRef.current}`.trim();
      if (combined) onTranscript(combined.charAt(0).toUpperCase() + combined.slice(1));
    };
    try {
      rec.start();
      recRef.current = rec;
    } catch {
      setError("Микрофонът не можа да се включи.");
      setRecording(false);
    }
  }, [recording, onTranscript]);

  // Без поддръжка (напр. Firefox) бутонът не се показва изобщо
  if (!supported) return null;

  const label = recording ? "Спри диктуването" : "Кажете темата на глас";
  return (
    <span className={`relative inline-flex ${className ?? ""}`}>
      <button
        type="button"
        onClick={toggle}
        disabled={disabled}
        aria-label={label}
        aria-pressed={recording}
        title={label}
        className={`relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a4b82] disabled:cursor-not-allowed disabled:opacity-50 ${
          recording ? "border-rose-600 bg-rose-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        }`}
      >
        {recording ? <MicOff className="h-4 w-4" aria-hidden /> : <Mic className="h-4 w-4" aria-hidden />}
        {recording && (
          <span className="absolute -right-1 -top-1 flex h-3 w-3" aria-hidden>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75 motion-reduce:hidden" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-rose-500" />
          </span>
        )}
      </button>
      {error && (
        <span role="alert" className="absolute left-0 top-full z-10 mt-1 whitespace-nowrap rounded-md bg-white px-2 py-1 text-xs text-rose-700 shadow-sm ring-1 ring-rose-200">
          {error}
        </span>
      )}
    </span>
  );
}
