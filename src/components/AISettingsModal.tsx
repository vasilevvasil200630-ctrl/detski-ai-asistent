import React, { useEffect, useId, useRef } from 'react';
import {
  ShieldCheck,
  KeyRound,
  Sparkles,
  CheckCircle2,
  X,
  Info,
  Cpu,
} from 'lucide-react';
import { AISettings, AIProvider } from '../types';

interface AISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AISettings;
  onSaveSettings: (newSettings: AISettings) => void;
}

export const AISettingsModal: React.FC<AISettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [draft, setDraft] = React.useState<AISettings>(settings);

  useEffect(() => {
    setDraft(settings);
  }, [settings, isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  // Mandatory light-dismiss fallback for browsers without native dialog[closedby="any"]
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      dialog.returnValue = '';
      onClose();
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
  }, [onClose]);

  const handleProviderChange = (provider: AIProvider) => {
    setDraft((prev) => ({
      ...prev,
      provider,
      model: provider === 'gemini' ? 'gemini-2.5-flash' : 'gpt-4o-mini',
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(draft);
    dialogRef.current?.close();
  };

  return (
    <dialog
      ref={dialogRef}
      {...({ closedby: 'any' } as React.DialogHTMLAttributes<HTMLDialogElement>)}
      aria-labelledby={titleId}
      className="ai-modal w-full max-w-2xl rounded-3xl bg-white p-0 text-slate-800 shadow-2xl border-2 border-violet-200 m-auto"
    >
      <form onSubmit={handleSave} className="p-6 sm:p-8">
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 text-white flex items-center justify-center shadow-md shrink-0">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h2 id={titleId} className="font-display text-xl sm:text-2xl font-extrabold text-slate-900">
                ⚙️ Настройки на AI Двигателя
              </h2>
              <p className="text-sm text-slate-600">
                Изберете режим на работа за практикума и живата демонстрация
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Затвори настройките"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Mode Selection Cards */}
        <div className="mt-6 space-y-4">
          <label
            className={`flex items-start gap-4 p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all ${
              draft.mode === 'demo'
                ? 'border-emerald-500 bg-emerald-50/70 shadow-sm'
                : 'border-slate-200 hover:border-emerald-300 bg-white'
            }`}
          >
            <input
              type="radio"
              name="aiMode"
              checked={draft.mode === 'demo'}
              onChange={() => setDraft((prev) => ({ ...prev, mode: 'demo' }))}
              autoFocus
              className="mt-1.5 w-5 h-5 accent-emerald-600 shrink-0"
            />
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  Симулиран Демо Режим (Без ключ - 100% сигурност при презентация)
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-200/80 text-emerald-900">
                  Препоръчано за зала
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                Работи мигновено <strong>без интернет и без API ключ</strong>. Вграденият интелигентен
                педагогически генератор анализира избраните филтри и <strong>всяка тема, казана от публиката</strong>,
                като я вплита динамично в план-конспекта по ДОС, авторската приказка и бележката за родителите.
              </p>
            </div>
          </label>

          <label
            className={`flex items-start gap-4 p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all ${
              draft.mode === 'api'
                ? 'border-violet-500 bg-violet-50/70 shadow-sm'
                : 'border-slate-200 hover:border-violet-300 bg-white'
            }`}
          >
            <input
              type="radio"
              name="aiMode"
              checked={draft.mode === 'api'}
              onChange={() => setDraft((prev) => ({ ...prev, mode: 'api' }))}
              className="mt-1.5 w-5 h-5 accent-violet-600 shrink-0"
            />
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg text-slate-900 flex items-center gap-1.5">
                  <KeyRound className="w-5 h-5 text-violet-600" />
                  Реален AI API Ключ (Жива връзка с Gemini / OpenAI)
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                Използва реален облачен AI модел чрез вашия личен API ключ. При прекъсване на интернета в залата
                системата <strong>автоматично превключва към Демо двигателя</strong>, за да не прекъсне презентацията ви!
              </p>
            </div>
          </label>
        </div>

        {/* API Key Configuration Panel */}
        {draft.mode === 'api' && (
          <div className="mt-5 p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                  AI Доставчик
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleProviderChange('gemini')}
                    className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold border-2 transition-all ${
                      draft.provider === 'gemini'
                        ? 'bg-violet-600 text-white border-violet-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-violet-300'
                    }`}
                  >
                    Google Gemini
                  </button>
                  <button
                    type="button"
                    onClick={() => handleProviderChange('openai')}
                    className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold border-2 transition-all ${
                      draft.provider === 'openai'
                        ? 'bg-violet-600 text-white border-violet-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-violet-300'
                    }`}
                  >
                    OpenAI (GPT-4o)
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="ai-model-input"
                  className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5"
                >
                  Модел
                </label>
                <input
                  id="ai-model-input"
                  type="text"
                  value={draft.model}
                  onChange={(e) => setDraft((prev) => ({ ...prev, model: e.target.value }))}
                  placeholder={draft.provider === 'gemini' ? 'gemini-2.5-flash' : 'gpt-4o-mini'}
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 bg-white text-sm font-semibold text-slate-800 focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="ai-api-key-input"
                className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Вашият API Ключ ({draft.provider === 'gemini' ? 'AIzaSy...' : 'sk-...'})
              </label>
              <input
                id="ai-api-key-input"
                type="password"
                value={draft.apiKey}
                onChange={(e) => setDraft((prev) => ({ ...prev, apiKey: e.target.value }))}
                placeholder={
                  draft.provider === 'gemini'
                    ? 'Поставете вашия Google Gemini API ключ тук...'
                    : 'Поставете вашия OpenAI API ключ тук...'
                }
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-sm font-mono text-slate-800 focus:outline-none focus:border-violet-500"
              />
              <p className="mt-1.5 text-xs text-slate-500 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                Ключът се съхранява само локално във вашия браузър за текущата сесия.
              </p>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Вградена защита срещу грешки при демонстрация на живо</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Отказ
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-extrabold text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-md transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              Запази настройките
            </button>
          </div>
        </div>
      </form>
    </dialog>
  );
};
