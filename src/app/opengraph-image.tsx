import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// По модела на МатураПлюс (src/app/opengraph-image.tsx): картинка при споделяне във Viber,
// Facebook и Messenger (1200×630), генерира се при build. Noto Sans покрива кирилицата.
export const alt = "Учителски облак на ДГ „Пролет“, с. Ягодово";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const AMBER = "#ff5300";
const YELLOW = "#faca04";
const GREEN = "#4d7a0a";
const INK = "#0f172a";
const MUTED = "#334155";


export default async function OpengraphImage() {
  const [regular, bold, logo] = await Promise.all([
    readFile(join(process.cwd(), "public/fonts/NotoSans.ttf")),
    readFile(join(process.cwd(), "public/fonts/NotoSans-Bold.ttf")),
    // Логото от официалния сайт на градината
    readFile(join(process.cwd(), "public/brand/prolet-logo.png")),
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
          borderTop: `16px solid ${YELLOW}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`data:image/png;base64,${logo.toString("base64")}`} width={92} height={100} alt="" />
          <div style={{ display: "flex", fontSize: 48, fontWeight: 700 }}>
            <span style={{ color: GREEN }}>ДГ „Пролет“</span>
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
