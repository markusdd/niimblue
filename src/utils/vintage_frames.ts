import type { LabelShape } from "$/types";

/** Original vector silhouettes inspired by traditional printed label cartouches. */
export const VINTAGE_FRAME_KINDS = [
  "cartouche",
  "baroque",
  "cameo",
  "rococo",
  "ribbon-plaque",
  "scroll-plaque",
] as const;
export type VintageFrameKind = (typeof VINTAGE_FRAME_KINDS)[number];
const n = (v: number) => String(Math.round(v * 1000) / 1000);

// All commands use coordinate pairs, so curves can be mapped directly into the
// actual paper box. Strokes remain physical pixel widths, independent of aspect.
const contours: Record<VintageFrameKind, string> = {
  cartouche:
    "M 10 9 C 20 0 31 18 42 8 Q 47 5 50 0 Q 53 5 58 8 C 69 18 80 0 90 9 Q 94 12 94 22 L 98 22 L 98 30 L 100 30 C 96 39 96 43 100 50 C 96 57 96 61 100 70 L 98 70 L 98 78 L 94 78 Q 94 88 90 91 C 80 100 69 82 58 92 Q 53 95 50 100 Q 47 95 42 92 C 31 82 20 100 10 91 Q 6 88 6 78 L 2 78 L 2 70 L 0 70 C 4 61 4 57 0 50 C 4 43 4 39 0 30 L 2 30 L 2 22 L 6 22 Q 6 12 10 9 Z",
  baroque:
    "M 14 19 L 14 12 C 22 5 32 9 40 10 C 43 10 43 0 50 0 C 57 0 57 10 60 10 C 68 9 78 5 86 12 L 86 19 Q 94 19 94 28 C 100 36 100 64 94 72 Q 94 81 86 81 L 86 88 C 78 95 68 91 60 90 C 57 90 57 100 50 100 C 43 100 43 90 40 90 C 32 91 22 95 14 88 L 14 81 Q 6 81 6 72 C 0 64 0 36 6 28 Q 6 19 14 19 Z",
  cameo:
    "M 12 23 C 12 12 28 10 38 10 C 42 10 41 0 50 0 C 59 0 58 10 62 10 C 72 10 88 12 88 23 C 100 28 100 72 88 77 C 88 88 72 90 62 90 C 58 90 59 100 50 100 C 41 100 42 90 38 90 C 28 90 12 88 12 77 C 0 72 0 28 12 23 Z",
  rococo:
    "M 10 8 C 20 0 35 22 50 0 C 65 22 80 0 90 8 C 99 14 87 30 94 35 Q 100 42 100 50 Q 100 58 94 65 C 87 70 99 86 90 92 C 80 100 65 78 50 100 C 35 78 20 100 10 92 C 1 86 13 70 6 65 Q 0 58 0 50 Q 0 42 6 35 C 13 30 1 14 10 8 Z",
  "ribbon-plaque":
    "M 13 0 C 35 9 65 9 87 0 Q 87 12 94 12 L 94 36 C 100 36 100 64 94 64 L 94 88 Q 87 88 87 100 C 65 91 35 91 13 100 Q 13 88 6 88 L 6 64 C 0 64 0 36 6 36 L 6 12 Q 13 12 13 0 Z",
  "scroll-plaque":
    "M 13 0 C 35 9 65 9 87 0 Q 87 12 94 12 L 94 36 C 84 38 84 62 94 64 L 94 88 Q 87 88 87 100 C 65 91 35 91 13 100 Q 13 88 6 88 L 6 64 C 16 62 16 38 6 36 L 6 12 Q 13 12 13 0 Z",
};
function mapped(d: string, x: number, y: number, width: number, height: number): string {
  let coordinate = 0;
  return d.replace(/-?\d+(?:\.\d+)?/g, (value) =>
    n(++coordinate % 2 ? x + (Number(value) * width) / 100 : y + (Number(value) * height) / 100),
  );
}
const path = (d: string, stroke: number) =>
  `<path d="${d}" fill="none" stroke="#000" stroke-width="${n(stroke)}" stroke-linecap="round" stroke-linejoin="round"/>`;

function scroll(x: number, y: number, width: number, height: number, stroke: number): string {
  // Opposing curls finish toward the centre; the central text area stays clear.
  return path(
    mapped(
      "M 5 75 C 0 45 10 10 24 28 C 40 50 25 90 17 62 C 13 46 26 35 30 53 C 40 58 49 20 62 32 C 77 50 83 83 95 49",
      x,
      y,
      width,
      height,
    ),
    stroke,
  );
}
function circular(kind: VintageFrameKind, w: number, h: number, margin: number, stroke: number, gap: number): string {
  const cx = w / 2,
    cy = h / 2,
    radius = Math.min(w, h) / 2 - margin - stroke / 2;
  const amount = kind === "cameo" ? 0 : kind === "rococo" ? radius * 0.045 : radius * 0.022;
  const ring = (r: number, sw: number) => {
    const points = Array.from({ length: 241 }, (_, i) => {
      const angle = (i * Math.PI * 2) / 240;
      const reach = r - (amount * (1 + Math.cos(angle * 4))) / 2;
      return `${i ? "L" : "M"} ${n(cx + Math.cos(angle) * reach)} ${n(cy + Math.sin(angle) * reach)}`;
    });
    return path(points.join(" ") + " Z", sw);
  };
  let result = ring(radius, stroke) + ring(radius - gap, stroke * 0.45);
  if (kind === "scroll-plaque" || kind === "rococo") {
    const sw = radius * 0.45,
      sh = radius * 0.12;
    result += scroll(cx - sw / 2, cy - radius * 0.76, sw, sh, stroke * 0.43);
    result += `<g transform="translate(${n(w)} ${n(h)}) rotate(180)">${scroll(cx - sw / 2, cy - radius * 0.76, sw, sh, stroke * 0.43)}</g>`;
  } else {
    const y = cy - radius * 0.77;
    result += path(
      `M ${n(cx - radius * 0.12)} ${n(y)} Q ${n(cx)} ${n(y - radius * 0.055)} ${n(cx + radius * 0.12)} ${n(y)}`,
      stroke * 0.43,
    );
    result += path(
      `M ${n(cx - radius * 0.12)} ${n(h - y)} Q ${n(cx)} ${n(h - y + radius * 0.055)} ${n(cx + radius * 0.12)} ${n(h - y)}`,
      stroke * 0.43,
    );
  }
  return result;
}

export function vintageFrameSvg(
  kind: VintageFrameKind,
  width: number,
  height: number,
  shape: LabelShape = "rect",
): string {
  const w = Math.max(16, width),
    h = Math.max(16, height),
    unit = Math.min(w, h);
  const stroke = Math.max(1, unit * 0.012);
  const margin = unit * 0.06;
  const gap = Math.max(stroke * 1.6, unit * 0.022);
  let drawing: string;
  if (shape === "circle") drawing = circular(kind, w, h, margin, stroke, gap);
  else {
    const boxW = w - margin * 2,
      boxH = h - margin * 2;
    drawing = path(mapped(contours[kind], margin, margin, boxW, boxH), stroke);
    drawing += path(mapped(contours[kind], margin + gap, margin + gap, boxW - gap * 2, boxH - gap * 2), stroke * 0.45);
    if (kind === "scroll-plaque" || kind === "rococo") {
      const sw = boxW * 0.26,
        sh = Math.min(boxH * 0.09, unit * 0.07);
      const y = margin + boxH * 0.125;
      drawing += scroll(w / 2 - sw / 2, y, sw, sh, stroke * 0.43);
      drawing += `<g transform="translate(${n(w)} ${n(h)}) rotate(180)">${scroll(w / 2 - sw / 2, y, sw, sh, stroke * 0.43)}</g>`;
    } else if (kind === "ribbon-plaque") {
      const dots = (y: number) =>
        [-1, 0, 1]
          .map(
            (index) =>
              `<circle cx="${n(w / 2 + index * stroke * 1.8)}" cy="${n(y)}" r="${n(stroke * 0.35)}" fill="#000"/>`,
          )
          .join("");
      drawing += dots(margin + boxH * 0.15) + dots(h - margin - boxH * 0.15);
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${n(w)}" height="${n(h)}" viewBox="0 0 ${n(w)} ${n(h)}"><rect width="${n(w)}" height="${n(h)}" fill="#000" opacity="0" stroke="none" stroke-width="0"/>${drawing}</svg>`;
}
