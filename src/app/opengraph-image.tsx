import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// По модела на МатураПлюс (src/app/opengraph-image.tsx): картинка при споделяне във Viber,
// Facebook и Messenger (1200×630), генерира се при build. Noto Sans покрива кирилицата.
export const alt = "Учителски облак на ДГ „Пролет“, с. Ягодово";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const NAVY = "#0a4b82";
const AMBER = "#f59e0b";
const INK = "#0f172a";
const MUTED = "#334155";

const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="16" y="46" width="68" height="44" rx="10" fill="#0a4b82"/><rect x="16" y="46" width="68" height="12" rx="6" fill="#083861"/><rect x="45" y="46" width="10" height="44" fill="#f59e0b"/><path d="M12 40L50 30L88 40L86 48H14Z" fill="#0e5e9e"/><path d="M50 4l4.6 9.4 10.4 1.5-7.5 7.3 1.8 10.3L50 27.6l-9.3 4.9 1.8-10.3-7.5-7.3 10.4-1.5z" fill="#f59e0b" stroke="#b45309" stroke-width="1.5" stroke-linejoin="round"/><path d="M70 22c8-1 13 3 14 9-7 1-12-2-14-9z" fill="#1ea858"/><path d="M30 22c-8-1-13 3-14 9 7 1 12-2 14-9z" fill="#1ea858" opacity="0.75"/></svg>`;

export default async function OpengraphImage() {
  const [regular, bold] = await Promise.all([
    readFile(join(process.cwd(), "public/fonts/NotoSans.ttf")),
    readFile(join(process.cwd(), "public/fonts/NotoSans-Bold.ttf")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#ffffff",
          fontFamily: "Noto Sans",
          color: INK,
          borderTop: `16px solid ${NAVY}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`data:image/svg+xml;utf8,${encodeURIComponent(ICON_SVG)}`} width={80} height={80} alt="" />
          <div style={{ display: "flex", fontSize: 48, fontWeight: 700 }}>
            <span style={{ color: NAVY }}>ДГ</span>
            <span style={{ color: "#1ea858" }}>&nbsp;„Пролет“</span>
            <span style={{ color: MUTED, fontWeight: 400 }}>&nbsp;· с. Ягодово</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", fontSize: 68, fontWeight: 700, lineHeight: 1.1 }}>
            Учителският облак на ДГ „Пролет“
          </div>
          <div style={{ display: "flex", fontSize: 32, color: MUTED, lineHeight: 1.4 }}>
            Игри, работни листове, стихчета, писма до родителите и грамоти — създадени и готови за печат
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 26, color: MUTED }}>
          <div style={{ display: "flex", width: 14, height: 14, borderRadius: 999, background: AMBER }} />
          Съобразено с Наредба № 5 за предучилищното образование
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Noto Sans", data: regular, style: "normal", weight: 400 },
        { name: "Noto Sans", data: bold, style: "normal", weight: 700 },
      ],
    },
  );
}
