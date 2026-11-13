import { Download } from "lucide-react";

/** GDPR (чл. 15 и 20): учителят сам сваля копие на всичките си данни като JSON файл. */
export function ExportDataSection() {
  return (
    <section aria-labelledby="export-data-title" className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 id="export-data-title" className="flex items-center gap-2 text-lg font-bold text-slate-900">
        <Download className="h-5 w-5 text-[#4d7a0a]" aria-hidden /> Моите данни
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-slate-600">
        Свалете копие на всичко, което пазим за вас: профила, материалите, бележника, списъка с файловете ви в облака и
        обратната връзка. Файлът е във формат JSON и се отваря с всеки текстов редактор.
      </p>
      <a
        href="/api/account/export"
        download
        className="mt-5 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition-colors duration-150 hover:bg-slate-50 active:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4d7a0a] focus-visible:ring-offset-2"
      >
        <Download className="h-4 w-4" aria-hidden />
        Свали моите данни
      </a>
    </section>
  );
}
