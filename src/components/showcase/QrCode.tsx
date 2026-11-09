"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

/**
 * QR код към страница от сайта. SVG-то идва от библиотеката qrcode (адресът е наш, не текст от
 * потребител), затова се вмъква директно.
 */
export function QrCode({ url, size = 160, className = "" }: { url: string; size?: number; className?: string }) {
  const [svg, setSvg] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    QRCode.toString(url, { type: "svg", margin: 1, width: size, errorCorrectionLevel: "M", color: { dark: "#0f172a", light: "#ffffff" } })
      .then((s) => active && setSvg(s))
      .catch(() => active && setSvg(null));
    return () => {
      active = false;
    };
  }, [url, size]);
  return (
    <div
      role="img"
      aria-label={`QR код към ${url}`}
      className={className}
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
    />
  );
}

/** Абсолютен адрес към страница от витрината (за QR кода и за печат). */
export function useAbsoluteUrl(path: string): string {
  const [url, setUrl] = useState(path);
  useEffect(() => setUrl(`${window.location.origin}${path}`), [path]);
  return url;
}
