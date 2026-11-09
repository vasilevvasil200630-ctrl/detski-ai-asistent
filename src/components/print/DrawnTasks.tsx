import { halfShapePaths } from "@/services/printables/drawings";
import type { DiffCell, WorksheetTask } from "@/services/printables";

/**
 * Рисуваните задачи в работния лист: лабиринт, „Открий разликите“ и „Дорисувай половината“.
 * Всичко е SVG/HTML без картинки отвън — печата се чисто и в черно-бяло.
 * `compact` — когато в листа има и други задачи (всичко да се събере на една A4 страница).
 */

const INK = "#0f172a";
const SOFT = "#64748b";

export function MazeView({ task, compact }: { task: Extract<WorksheetTask, { kind: "maze" }>; compact?: boolean }) {
  const S = 40;
  const pad = 56;
  const m = 4;
  const W = task.cols * S;
  const H = task.rows * S;
  const lines: [number, number, number, number][] = [
    [0, 0, W, 0],
    [0, H, W, H],
    [0, S, 0, H],
    [W, 0, W, H - S],
  ];
  for (let i = 0; i < task.cols * task.rows; i++) {
    const x = i % task.cols;
    const y = Math.floor(i / task.cols);
    const w = Number(task.walls[i] ?? 3);
    if (w & 1 && x < task.cols - 1) lines.push([(x + 1) * S, y * S, (x + 1) * S, (y + 1) * S]);
    if (w & 2 && y < task.rows - 1) lines.push([x * S, (y + 1) * S, (x + 1) * S, (y + 1) * S]);
  }
  return (
    <svg
      viewBox={`0 0 ${W + pad * 2} ${H + m * 2}`}
      className="mx-auto block h-auto w-full"
      style={{ maxHeight: compact ? "52mm" : "80mm" }}
      role="img"
      aria-label={`Лабиринт от ${task.start.w} до ${task.end.w}`}
    >
      <g transform={`translate(${pad} ${m})`} stroke={INK} strokeWidth={4} strokeLinecap="round">
        {lines.map(([x1, y1, x2, y2], i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />
        ))}
      </g>
      <text className="print-emoji" x={pad / 2} y={m + S / 2} fontSize={S * 0.85} textAnchor="middle" dominantBaseline="central">
        {task.start.e}
      </text>
      <text className="print-emoji" x={pad + W + pad / 2} y={m + H - S / 2} fontSize={S * 0.85} textAnchor="middle" dominantBaseline="central">
        {task.end.e}
      </text>
    </svg>
  );
}

/** Леко разместване и завъртане по номера на клетката — еднакво в двете картинки, за да прилича на сцена. */
function jitter(i: number): string {
  const dx = ((i * 29) % 5) - 2;
  const dy = ((i * 17) % 5) - 2;
  const rot = (((i * 53) % 9) - 4) * 3;
  return `translate(${dx * 3}px, ${dy * 3}px) rotate(${rot}deg)`;
}

function Scene({ cells, cols, compact, label }: { cells: DiffCell[]; cols: number; compact?: boolean; label: string }) {
  const tall = cells.length / cols >= 4;
  return (
    <div className="rounded-2xl border-2 border-slate-400 p-2" role="img" aria-label={label}>
      <div className="grid" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {cells.map((c, i) => (
          <span key={i} className={`grid place-items-center ${compact ? "h-9" : tall ? "h-[12.5mm]" : "h-[15mm]"}`}>
            {c && (
              <span
                className={`print-emoji inline-block leading-none ${c.big ? (compact ? "text-[2.2rem]" : "text-[3.4rem]") : compact ? "text-xl" : "text-[2.1rem]"}`}
                style={{ transform: jitter(i) }}
                aria-hidden
              >
                {c.e}
              </span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

export function DifferencesView({ task, compact }: { task: Extract<WorksheetTask, { kind: "differences" }>; compact?: boolean }) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-4">
        <Scene cells={task.left} cols={task.cols} compact={compact} label="Първата картинка" />
        <Scene cells={task.right} cols={task.cols} compact={compact} label="Втората картинка — огради разликите" />
      </div>
      <p className="mt-3 flex items-center gap-2 text-sm font-semibold">
        Намерих:
        {Array.from({ length: task.count }, (_, i) => (
          <span key={i} className="inline-block h-6 w-6 rounded-full border-2 border-slate-400" aria-hidden />
        ))}
      </p>
    </div>
  );
}

const points = (pts: [number, number][]) => pts.map(([x, y]) => `${x},${y}`).join(" ");

export function HalfView({ task, compact }: { task: Extract<WorksheetTask, { kind: "half" }>; compact?: boolean }) {
  const { w, h, left, right } = halfShapePaths(task.shape);
  const grid = task.mode === "grid";
  return (
    <svg
      viewBox={`-1 -1 ${w + 2} ${h + 2}`}
      className="mx-auto block h-auto w-full"
      style={{ maxHeight: compact ? "48mm" : "82mm" }}
      role="img"
      aria-label={grid ? "Половин рисунка в мрежа от точки" : "Половин рисунка, другата половина е на пунктир"}
    >
      {grid && (
        <>
          {Array.from({ length: (w + 1) * (h + 1) }, (_, i) => (
            <circle key={i} cx={i % (w + 1)} cy={Math.floor(i / (w + 1))} r={0.07} fill={SOFT} />
          ))}
          <line x1={w / 2} y1={-0.6} x2={w / 2} y2={h + 0.6} stroke="#94a3b8" strokeWidth={0.05} strokeDasharray="0.3 0.2" />
        </>
      )}
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        {left.map((pts, i) => (
          <polyline key={`l${i}`} points={points(pts)} stroke={INK} strokeWidth={0.14} />
        ))}
        {!grid &&
          right.map((pts, i) => (
            <polyline key={`r${i}`} points={points(pts)} stroke={SOFT} strokeWidth={0.1} strokeDasharray="0.22 0.22" />
          ))}
      </g>
    </svg>
  );
}
