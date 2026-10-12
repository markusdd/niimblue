import type { LabelSplit, TailPosition } from "$/types";

/** Clockwise quarter-turns of the design relative to the roll's feed. */
export type QuarterTurns = 0 | 1 | 2 | 3;

export const normalizeTurns = (value: number | undefined): QuarterTurns => {
  if (value === undefined || !Number.isFinite(value)) return 0;
  return (((Math.round(value) % 4) + 4) % 4) as QuarterTurns;
};

/** Swap the two sides when the design is turned onto its long edge. */
export const swapIfOdd = (width: number, height: number, turns: number | undefined): { width: number; height: number } => {
  if (normalizeTurns(turns) % 2 === 1) return { width: height, height: width };
  return { width, height };
};

const TAIL_ORDER: TailPosition[] = ["top", "right", "bottom", "left"];

export const rotateTail = (pos: TailPosition, deltaTurns: number | undefined): TailPosition => {
  const index = TAIL_ORDER.indexOf(pos);
  const start = index < 0 ? 1 : index;
  return TAIL_ORDER[(start + normalizeTurns(deltaTurns)) % 4];
};

export const rotateSplit = (split: LabelSplit, deltaTurns: number | undefined): LabelSplit => {
  if (split === "none" || normalizeTurns(deltaTurns) % 2 === 0) return split;
  return split === "vertical" ? "horizontal" : "vertical";
};

export type WorkingEdge = "top" | "right" | "bottom" | "left";

/** Where the printer's feed edge sits after the design has been turned clockwise. */
export const workingEdge = (direction: "left" | "top", turns: number | undefined): WorkingEdge => {
  const start = direction === "top" ? 0 : 3;
  return TAIL_ORDER[(start + normalizeTurns(turns)) % 4];
};

/**
 * Center of an object after the canvas turns 90° clockwise.
 * `x`/`y` are in the old canvas, whose size is `oldW` × `oldH`.
 */
export const rotatePointCw = (
  x: number,
  y: number,
  oldW: number,
  oldH: number,
): { x: number; y: number } => {
  const dx = x - oldW / 2;
  const dy = y - oldH / 2;
  return { x: oldH / 2 - dy, y: oldW / 2 + dx };
};

/**
 * Design pixel that shows physical pixel (`px`, `py`) after `turns` clockwise
 * quarter-turns. Physical size is `physicalW` × `physicalH`.
 */
export const designPixel = (
  px: number,
  py: number,
  physicalW: number,
  physicalH: number,
  turns: number | undefined,
): { x: number; y: number } => {
  const n = normalizeTurns(turns);
  if (n === 1) return { x: physicalH - 1 - py, y: px };
  if (n === 2) return { x: physicalW - 1 - px, y: physicalH - 1 - py };
  if (n === 3) return { x: py, y: physicalW - 1 - px };
  return { x: px, y: py };
};

/** Turn a design bitmap back to the roll's feed orientation. */
export const unrotateCanvas = (source: HTMLCanvasElement, turns: number | undefined): HTMLCanvasElement => {
  const n = normalizeTurns(turns);
  if (n === 0 || source.width < 1 || source.height < 1) return source;
  const srcCtx = source.getContext("2d", { willReadFrequently: true });
  if (!srcCtx) return source;
  const src = srcCtx.getImageData(0, 0, source.width, source.height);
  const physicalW = n % 2 === 1 ? source.height : source.width;
  const physicalH = n % 2 === 1 ? source.width : source.height;
  const out = document.createElement("canvas");
  out.width = physicalW;
  out.height = physicalH;
  const dst = new ImageData(physicalW, physicalH);
  for (let py = 0; py < physicalH; py++) {
    for (let px = 0; px < physicalW; px++) {
      const sample = designPixel(px, py, physicalW, physicalH, n);
      const si = (sample.y * source.width + sample.x) * 4;
      const di = (py * physicalW + px) * 4;
      dst.data[di] = src.data[si];
      dst.data[di + 1] = src.data[si + 1];
      dst.data[di + 2] = src.data[si + 2];
      dst.data[di + 3] = src.data[si + 3];
    }
  }
  const ctx = out.getContext("2d");
  if (!ctx) return source;
  ctx.putImageData(dst, 0, 0);
  return out;
};
