'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import QRCode from 'qrcode';
import {
  BookMarked,
  Copy,
  Check,
  Sparkles,
  QrCode,
  Printer,
  Clock,
  Wand2,
  Lightbulb,
  X,
  RefreshCw,
  CheckCircle2,
  Download,
  Users,
} from 'lucide-react';
import { AgeGroup, GoldenPromptItem, PromptCategory } from '../types';
import { AGE_GROUP_LABELS } from '../services/aiEngine';
import { GOLDEN_PROMPTS, PROMPT_CATEGORIES } from '../services/goldenPromptsData';
import { SaveMaterialBar } from './SaveMaterialBar';

interface GoldenPromptsModuleProps {
  onTimeSaved: (minutes: number) => void;
  projectorMode: boolean;
}

const AGE_BUTTONS: { id: AgeGroup; label: string }[] = [
  { id: '1', label: '1-ва група (3-4 г.)' },
  { id: '2', label: '2-ра група (4-5 г.)' },
  { id: '3', label: '3-та група (5-6 г.)' },
  { id: '4', label: '4-та група (6-7 г.)' },
];

export const GoldenPromptsModule: React.FC<GoldenPromptsModuleProps> = ({
  onTimeSaved,
  projectorMode,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<PromptCategory>('all');
  const [selectedAge, setSelectedAge] = useState<AgeGroup>('3');
  const [customInputs, setCustomInputs] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const p of GOLDEN_PROMPTS) {
      initial[p.id] = p.defaultPlaceholderValue;
    }
    return initial;
  });

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [expandedResults, setExpandedResults] = useState<Record<string, boolean>>({});

  // QR Modal State
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [qrMode, setQrMode] = useState<'cheatsheet' | 'custom_url'>('custom_url');
  const [customUrl, setCustomUrl] = useState('https://vasilevvasil200630-ctrl.github.io/detski-ai-asistent/');
  // Адресът на сайта се взима в браузъра (при сървърното рендериране window липсва)
  useEffect(() => {
    if (window.location.origin.startsWith('http')) setCustomUrl(window.location.origin + '/prompts');
  }, []);
  const [qrSvgMarkup, setQrSvgMarkup] = useState<string>('');
  const qrDialogRef = useRef<HTMLDialogElement>(null);
  const qrTitleId = useId();

  const ageLabel = AGE_GROUP_LABELS[selectedAge].full;

  const filteredPrompts =
    selectedCategory === 'all'
      ? GOLDEN_PROMPTS
      : GOLDEN_PROMPTS.filter((p) => p.category === selectedCategory);

  // Build QR payload
  const qrPayload =
    qrMode === 'custom_url'
      ? customUrl.trim() || 'https://chatgpt.com/'
      : [
          '🪄 ЗЛАТНА ФОРМУЛА ЗА ДЕТСКИ УЧИТЕЛИ:',
          '1. РОЛЯ: Ти си методист по Наредба № 5 и „Златно ключе“ (Бит и техника).',
          '2. ГРУПА: Посочи възрастта (1-ва до 4-та група).',
          '3. ЗАДАЧА: План-конспект / Римувана игра / Приказка / Бележка за Viber.',
          '4. ФОРМАТ: По минути, със Знания, Умения и Отношения!',
        ].join('\n');

  useEffect(() => {
    let active = true;
    QRCode.toString(qrPayload, {
      type: 'svg',
      margin: 2,
      width: 320,
      color: {
        dark: '#1e1b4b',
        light: '#ffffff',
      },
    })
      .then((svg) => {
        if (active) setQrSvgMarkup(svg);
      })
      .catch((err) => {
        console.warn('QR generation error:', err);
      });
    return () => {
      active = false;
    };
  }, [qrPayload]);

  // Native Dialog open/close & mandatory light-dismiss fallback
  useEffect(() => {
    const dialog = qrDialogRef.current;
    if (!dialog) return;

    if (isQrOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isQrOpen && dialog.open) {
      dialog.close();
    }
  }, [isQrOpen]);

  useEffect(() => {
    const dialog = qrDialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      dialog.returnValue = '';
      setIsQrOpen(false);
    };

    dialog.addEventListener('close', handleClose);

    let cleanupFallback: (() => void) | undefined;
    if (typeof HTMLDialogElement !== 'undefined' && !('closedBy' in HTMLDialogElement.prototype)) {
      const handleBackdropClick = (event: MouseEvent) => {
        if (event.target !== dialog) return;
        const rect = dialog.getBoundingClientRect();
        const isDialogContent =
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width;

        if (isDialogContent) return;
        dialog.close();
      };

      dialog.addEventListener('click', handleBackdropClick);
      cleanupFallback = () => dialog.removeEventListener('click', handleBackdropClick);
    }

    return () => {
      dialog.removeEventListener('close', handleClose);
      if (cleanupFallback) cleanupFallback();
    };
  }, []);

  const handleCopyPrompt = async (item: GoldenPromptItem) => {
    const inputVal = customInputs[item.id] || item.defaultPlaceholderValue;
    const text = item.buildPromptText(ageLabel, inputVal);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleSimulatePrompt = async (item: GoldenPromptItem) => {
    if (expandedResults[item.id]) {
      setExpandedResults((prev) => ({ ...prev, [item.id]: false }));
      return;
    }
    setLoadingId(item.id);
    await new Promise((resolve) => setTimeout(resolve, 1400));
    setLoadingId(null);
    setExpandedResults((prev) => ({ ...prev, [item.id]: true }));
    onTimeSaved(item.savedMinutes);
  };

  const handlePrintAllPrompts = () => {
    const printWin = window.open('', '_blank', 'width=900,height=750');
    if (!printWin) {
      window.print();
      return;
    }
    const cardsHtml = GOLDEN_PROMPTS.map((p, idx) => {
      const val = customInputs[p.id] || p.defaultPlaceholderValue;
      const promptText = p.buildPromptText(ageLabel, val);
      return `
        <div class="card">
          <div class="cat">${p.categoryLabel} • Спестява ~${p.savedMinutes} мин.</div>
          <h2>${idx + 1}. ${p.title}</h2>
          <div class="prompt-box">${promptText.replace(/\n/g, '<br/>')}</div>
          <div class="why"><strong>💡 Защо работи този шаблон:</strong> ${p.whyItWorks}</div>
        </div>
      `;
    }).join('');

    printWin.document.write(`
      <!doctype html>
      <html lang="bg">
      <head>
        <meta charset="UTF-8" />
        <title>Златна шпаргалка с AI промптове за детски учители</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; padding: 32px; color: #1e293b; max-width: 820px; margin: 0 auto; }
          h1 { font-size: 24px; color: #0f172a; margin-bottom: 4px; }
          .sub { color: #475569; font-size: 14px; margin-bottom: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }
          .card { border: 1px solid #cbd5e1; border-radius: 12px; padding: 16px 20px; margin-bottom: 18px; page-break-inside: avoid; }
          .cat { font-size: 12px; font-weight: 700; color: #6d28d9; text-transform: uppercase; margin-bottom: 4px; }
          h2 { font-size: 17px; margin: 4px 0 10px 0; color: #0f172a; }
          .prompt-box { background: #f8fafc; border-left: 4px solid #8b5cf6; padding: 12px; font-size: 13.5px; line-height: 1.55; margin-bottom: 10px; }
          .why { font-size: 12.5px; color: #475569; }
        </style>
      </head>
      <body>
        <h1>🪄 Наръчник със „Златни промптове“ за детския учител</h1>
        <div class="sub">Практическа квалификация: „Изкуственият интелект в работата на учителя в детската градина“ (${ageLabel})</div>
        ${cardsHtml}
        <script>window.onload = () => { window.print(); }</script>
      </body>
      </html>
    `);
    printWin.document.close();
  };

  return (
    <section aria-label="Библиотека със златни промптове и QR код за залата" className="space-y-8">
      {/* Hero Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-56 h-56 rounded-full bg-white/15 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-white/25 text-white backdrop-blur-sm">
              <BookMarked className="w-3.5 h-3.5" />
              Модул 3 • Практически наръчник за учителите
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold mt-2">
              📚 „Библиотека със златни промптове“ + Подарък за залата
            </h2>
            <p className="text-amber-50 text-sm sm:text-base mt-1 max-w-2xl">
              Готови, изпитани шаблони (промптове) за ChatGPT, Gemini и Claude. Копирайте с 1 клик,
              персонализирайте на живо или покажете големия QR код на проектора за колегите в залата!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsQrOpen(true)}
              className="inline-flex items-center gap-2.5 px-5 py-3.5 rounded-2xl font-extrabold text-sm sm:text-base bg-white text-slate-900 hover:bg-amber-50 shadow-xl hover:scale-[1.02] transition-all"
            >
              <QrCode className="w-5 h-5 text-rose-600" />
              <span>📱 Покажи QR код за залата</span>
            </button>

            <button
              type="button"
              onClick={handlePrintAllPrompts}
              className="inline-flex items-center gap-2 px-4 py-3.5 rounded-2xl font-extrabold text-sm bg-black/20 hover:bg-black/30 text-white border border-white/25 backdrop-blur-sm transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>🖨️ Принтирай шпаргалка</span>
            </button>
          </div>
        </div>
      </div>

      {/* Visual 4-Step Formula Box for Teaching Prompt Engineering to Kindergarten Teachers */}
      <div className="rounded-3xl bg-white/95 p-6 sm:p-7 border-2 border-amber-200/80 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h3 className="font-display text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-amber-600" />
            <span>Тайната формула на перфектния учителски промпт (4 стъпки):</span>
          </h3>
          <span className="text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full">
            Покажете тази формула на екрана по време на обучението
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
            <div className="text-xs font-black uppercase text-emerald-800">Стъпка 1: РОЛЯ</div>
            <div className="font-extrabold text-slate-900 mt-1">„Ти си методист по ДОС...“</div>
            <p className="text-xs text-slate-600 mt-1">
              Задайте професионална роля: детски психолог, логопед, музикален педагог или методист.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200">
            <div className="text-xs font-black uppercase text-indigo-800">Стъпка 2: КОНТЕКСТ</div>
            <div className="font-extrabold text-slate-900 mt-1">„За 3-та група (5-6 г.)...“</div>
            <p className="text-xs text-slate-600 mt-1">
              Посочете възрастовата група, настроението на децата и наличните материали.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
            <div className="text-xs font-black uppercase text-amber-800">Стъпка 3: ЗАДАЧА</div>
            <div className="font-extrabold text-slate-900 mt-1">„Създай приказка / сценарий...“</div>
            <p className="text-xs text-slate-600 mt-1">
              Опишете конкретната тема, празник или казус с родител.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200">
            <div className="text-xs font-black uppercase text-rose-800">Стъпка 4: ФОРМАТ</div>
            <div className="font-extrabold text-slate-900 mt-1">„В 4-стишни рими / по минути“</div>
            <p className="text-xs text-slate-600 mt-1">
              Кажете как да изглежда резултатът: таблица, Знания/Умения/Отношения или списък.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Bar: Age Group + Prompt Categories */}
      <div className="rounded-3xl bg-white/95 p-5 sm:p-6 border-2 border-indigo-100 shadow-md space-y-5">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2 text-sm font-extrabold text-slate-800">
            <Users className="w-5 h-5 text-indigo-600" />
            <span>Автоматично адаптирай всички промптове за група:</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {AGE_BUTTONS.map((ab) => (
              <button
                key={ab.id}
                type="button"
                onClick={() => setSelectedAge(ab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold border-2 transition-all ${
                  selectedAge === ab.id
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-slate-50 hover:bg-indigo-50 text-slate-700 border-slate-200'
                }`}
              >
                {ab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {PROMPT_CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold border-2 transition-all flex items-center gap-1.5 ${
                  active
                    ? 'bg-gradient-to-r from-amber-500 to-indigo-500 text-white border-amber-500 shadow-sm'
                    : 'bg-slate-50 hover:bg-amber-50 text-slate-700 border-slate-200'
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Golden Prompts Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredPrompts.map((item) => {
          const customVal = customInputs[item.id] ?? item.defaultPlaceholderValue;
          const fullPromptText = item.buildPromptText(ageLabel, customVal);
          const isCopied = copiedId === item.id;
          const isLoading = loadingId === item.id;
          const isExpanded = !!expandedResults[item.id];
          const sampleOutput = item.buildSampleResult(ageLabel, customVal);

          return (
            <article
              key={item.id}
              className="print-card rounded-2xl bg-white border-2 border-slate-200/90 hover:border-amber-300 shadow-lg hover:shadow-xl transition-all flex flex-col justify-between overflow-hidden"
            >
              <div className="p-5 sm:p-6 space-y-4">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-100 text-indigo-900 border border-indigo-200">
                    {item.categoryLabel}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <Clock className="w-3.5 h-3.5" />
                    Спестява ~{item.savedMinutes} мин.
                  </span>
                </div>

                <h4
                  className={`font-display font-extrabold text-slate-900 leading-snug ${
                    projectorMode ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'
                  }`}
                >
                  {item.title}
                </h4>

                {/* Interactive Variable Input */}
                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-1.5">
                  <label
                    htmlFor={`input-${item.id}`}
                    className="block text-xs font-extrabold uppercase tracking-wider text-amber-900"
                  >
                    ✏️ Персонализирай темата / ситуацията на живо:
                  </label>
                  <input
                    id={`input-${item.id}`}
                    type="text"
                    value={customVal}
                    onChange={(e) =>
                      setCustomInputs((prev) => ({ ...prev, [item.id]: e.target.value }))
                    }
                    className="w-full px-3.5 py-2 rounded-lg border border-amber-300 bg-white text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Live Generated Prompt Box */}
                <div className="p-4 rounded-2xl bg-slate-900 text-slate-100 font-mono text-xs sm:text-sm leading-relaxed relative">
                  <div className="text-[11px] font-sans font-extrabold uppercase tracking-wider text-amber-300 mb-1.5 flex items-center justify-between">
                    <span>Готов промпт за копиране (включва {AGE_GROUP_LABELS[selectedAge].short}):</span>
                  </div>
                  <p className="whitespace-pre-line font-sans text-slate-100">{fullPromptText}</p>
                </div>

                {/* Why It Works Pedagogical Note */}
                <div className="flex items-start gap-2 text-xs sm:text-sm text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                  <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-slate-800">Защо работи:</strong> {item.whyItWorks}
                  </span>
                </div>

                {/* Simulated AI Result Preview when clicked */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-50 via-emerald-50/70 to-white border-2 border-emerald-300 space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-emerald-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Демонстрационен AI резултат по този промпт
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedResults((prev) => ({ ...prev, [item.id]: false }))
                        }
                        className="text-xs font-bold text-slate-500 hover:text-slate-800"
                      >
                        Скрий
                      </button>
                    </div>
                    <h5 className="font-display font-extrabold text-slate-900 text-base">
                      {sampleOutput.title}
                    </h5>
                    <div className="space-y-2 text-xs sm:text-sm text-slate-800 leading-relaxed">
                      {sampleOutput.content.map((line, i) => (
                        <p key={i} className="whitespace-pre-line bg-white/80 p-3 rounded-xl border border-emerald-100">
                          {line}
                        </p>
                      ))}
                    </div>
                    <p className="text-xs font-bold text-emerald-900 italic">
                      💡 Методически трик: {sampleOutput.tip}
                    </p>
                  </div>
                )}
              </div>

              {/* Card Actions Footer */}
              <div className="no-print px-5 py-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center gap-2.5">
                {/* Промптът с темата на учителя се пази като помощен материал за групата */}
                <SaveMaterialBar
                  compact
                  className="order-last w-full"
                  material={{
                    kind: 'MATERIAL',
                    title: `${item.title}: ${customVal}`.slice(0, 140),
                    ageGroup: selectedAge,
                    content: { text: fullPromptText },
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleCopyPrompt(item)}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold border-2 transition-all flex items-center justify-center gap-1.5 ${
                    isCopied
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200'
                  }`}
                >
                  {isCopied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Копирано в клипборда!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>📋 Копирай промпта</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleSimulatePrompt(item)}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold bg-gradient-to-r from-indigo-600 to-indigo-600 hover:from-indigo-700 hover:to-indigo-700 text-white shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-70"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>AI генерира...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-200" />
                      <span>{isExpanded ? 'Скрий AI резултата' : '✨ Виж AI резултат'}</span>
                    </>
                  )}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* Native <dialog> Modal for Big Projector QR Code */}
      <dialog
        ref={qrDialogRef}
        {...({ closedby: 'any' } as React.DialogHTMLAttributes<HTMLDialogElement>)}
        aria-labelledby={qrTitleId}
        className="ai-modal w-full max-w-2xl rounded-3xl bg-white p-0 text-slate-800 shadow-2xl border-2 border-amber-300 m-auto"
      >
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-rose-500 text-white flex items-center justify-center shadow-md shrink-0">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h3 id={qrTitleId} className="font-display text-xl sm:text-2xl font-extrabold text-slate-900">
                  📱 Сканирайте от екрана: Подарък за колегите
                </h3>
                <p className="text-sm text-slate-600">
                  Насочете камерата на телефона си към проектора, за да запазите формулата или линка!
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => qrDialogRef.current?.close()}
              aria-label="Затвори QR прозореца"
              autoFocus
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Mode Toggle for QR Content */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-slate-100 p-1.5 rounded-2xl">
            <button
              type="button"
              onClick={() => setQrMode('cheatsheet')}
              className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all ${
                qrMode === 'cheatsheet'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🪄 QR: Златната 4-стъпкова формула (Офлайн текст)
            </button>
            <button
              type="button"
              onClick={() => setQrMode('custom_url')}
              className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all ${
                qrMode === 'custom_url'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🔗 QR: Линк към сайт / презентация
            </button>
          </div>

          {qrMode === 'custom_url' && (
            <div>
              <label
                htmlFor="qr-custom-url"
                className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1"
              >
                Въведете линк, който учителите да отворят на телефоните си:
              </label>
              <input
                id="qr-custom-url"
                type="text"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:border-amber-500"
              />
            </div>
          )}

          {/* Large Centered QR Code for Projector */}
          <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-gradient-to-b from-amber-50/70 to-rose-50/50 border-2 border-dashed border-amber-300">
            <div
              className="w-64 h-64 sm:w-72 sm:h-72 bg-white p-3 rounded-2xl shadow-lg border border-slate-200 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
              dangerouslySetInnerHTML={{ __html: qrSvgMarkup }}
            />
            <p className="mt-4 text-center text-sm sm:text-base font-extrabold text-slate-800 max-w-md">
              {qrMode === 'cheatsheet'
                ? 'Сканирането записва директно в телефона „4-те стъпки за златен учителски промпт“!'
                : `Сканирането отваря директно: ${customUrl}`}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handlePrintAllPrompts}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold bg-amber-100 hover:bg-amber-200 text-amber-900 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Принтирай / Запази PDF със Златните промптове</span>
            </button>
            <button
              type="button"
              onClick={() => qrDialogRef.current?.close()}
              className="px-6 py-2.5 rounded-xl text-sm font-extrabold bg-slate-900 hover:bg-slate-800 text-white"
            >
              Готово
            </button>
          </div>
        </div>
      </dialog>
    </section>
  );
};
