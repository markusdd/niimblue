import type { LabelShape } from "$/types";

/** Original curved and architectural Art Deco additions. */
export const ARCHITECTURAL_DECO_FRAMES = [
  "deco-quadrant",
  "deco-orbit",
  "deco-scalloped",
  "deco-portal",
  "deco-hexagon",
  "deco-ziggurat",
  "deco-bowtie",
  "deco-fluted",
] as const;
export type ArchitecturalDecoFrame = (typeof ARCHITECTURAL_DECO_FRAMES)[number];
const n = (v: number) => String(Math.round(v * 1000) / 1000);
type Point = [number, number];
const path = (d: string, sw: number, fill = "none") =>
  `<path d="${d}" fill="${fill}" stroke="#000" stroke-width="${n(sw)}" stroke-linecap="round" stroke-linejoin="miter"/>`;
const poly = (pts: Point[], sw: number, close = false) =>
  path(pts.map(([x, y], i) => `${i ? "L" : "M"} ${n(x)} ${n(y)}`).join(" ") + (close ? " Z" : ""), sw);
const rect = (x: number, y: number, w: number, h: number, sw: number) =>
  `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" fill="none" stroke="#000" stroke-width="${n(sw)}"/>`;
const dot = (x: number, y: number, r: number, sw: number) =>
  `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="#fff" stroke="#000" stroke-width="${n(sw)}"/>`;
const quadrant = (r: number, sw: number) => path(`M ${n(r)} 0 A ${n(r)} ${n(r)} 0 0 1 0 ${n(r)}`, sw);
const repeatCorners = (w: number, h: number, p: number, motif: string) =>
  [
    [p, p, 1, 1],
    [w - p, p, -1, 1],
    [w - p, h - p, -1, -1],
    [p, h - p, 1, -1],
  ]
    .map(([x, y, sx, sy]) => `<g transform="translate(${n(x)} ${n(y)}) scale(${sx} ${sy})">${motif}</g>`)
    .join("");
const mirrorBottom = (w: number, h: number, motif: string) =>
  motif + `<g transform="translate(${n(w)} ${n(h)}) rotate(180)">${motif}</g>`;

function circular(kind: ArchitecturalDecoFrame, w: number, h: number, u: number, sw: number): string {
  const cx = w / 2,
    cy = h / 2,
    r = u * 0.414,
    g = u * 0.025,
    thin = sw * 0.66;
  const ring = (radius: number) =>
    `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(radius)}" fill="none" stroke="#000" stroke-width="${n(thin)}"/>`;
  const rotate = (angle: number, body: string) =>
    `<g transform="translate(${n(cx)} ${n(cy)}) rotate(${angle})">${body}</g>`;
  let result = ring(r) + ring(r - g);
  if (kind === "deco-quadrant" || kind === "deco-orbit" || kind === "deco-portal") {
    for (let q = 0; q < 4; q++) {
      for (const radius of [r - g * 2.4, r - g * 3.5]) {
        const pts = Array.from({ length: 29 }, (_, i): Point => {
          const a = ((q * 90 + 22 + (i * 46) / 28) * Math.PI) / 180;
          return [cx + Math.cos(a) * radius, cy + Math.sin(a) * radius];
        });
        result += poly(pts, thin);
      }
      if (kind === "deco-quadrant")
        for (let i = 0; i < 5; i++) {
          const a = ((q * 90 + 22 + (i * 46) / 4) * Math.PI) / 180;
          result += poly(
            [
              [cx + Math.cos(a) * (r - g * 3.5), cy + Math.sin(a) * (r - g * 3.5)],
              [cx + Math.cos(a) * (r - g), cy + Math.sin(a) * (r - g)],
            ],
            thin,
          );
        }
      if (kind === "deco-orbit") result += rotate(q * 90, rect(-u * 0.025, -r - u * 0.018, u * 0.05, u * 0.05, thin));
    }
  } else if (kind === "deco-scalloped") {
    for (const angle of [0, 180]) {
      const cr = u * 0.039,
        base = -u * 0.335;
      let motif = poly(
        [
          [-u * 0.15, base],
          [u * 0.15, base],
        ],
        sw * 1.4,
      );
      for (const x of [-u * 0.078, 0, u * 0.078]) {
        motif += path(`M ${n(x - cr)} ${n(base)} A ${n(cr)} ${n(cr)} 0 0 1 ${n(x + cr)} ${n(base)}`, thin);
        motif += path(
          `M ${n(x - cr * 0.62)} ${n(base)} A ${n(cr * 0.62)} ${n(cr * 0.62)} 0 0 1 ${n(x + cr * 0.62)} ${n(base)}`,
          thin,
        );
      }
      result += rotate(angle, motif);
    }
  } else if (kind === "deco-ziggurat") {
    const top = -u * 0.38,
      step = u * 0.025;
    let motif = "";
    for (let i = 0; i < 3; i++)
      motif += poly(
        [
          [-u * (0.1 + i * 0.028), top + i * step],
          [-u * (0.075 + i * 0.014), top + (i + 1) * step],
          [u * (0.075 + i * 0.014), top + (i + 1) * step],
          [u * (0.1 + i * 0.028), top + i * step],
        ],
        thin,
        true,
      );
    result += rotate(0, motif) + rotate(180, motif);
  } else if (kind === "deco-fluted") {
    for (const angle of [90, 270])
      for (let i = -5; i <= 5; i++) {
        const a = (angle * Math.PI) / 180 + i * 0.055;
        result += poly(
          [
            [cx + Math.cos(a) * (r - g * 0.25), cy + Math.sin(a) * (r - g * 0.25)],
            [cx + Math.cos(a) * (r + u * 0.018), cy + Math.sin(a) * (r + u * 0.018)],
          ],
          thin,
        );
      }
  } else {
    for (let q = 0; q < 4; q++) {
      const len = u * 0.08;
      const motif =
        kind === "deco-hexagon"
          ? poly(
              [
                [-len / 2, -r + g],
                [0, -r - u * 0.018],
                [len / 2, -r + g],
              ],
              thin,
            )
          : poly(
              [
                [-len / 2, -r - g * 0.2],
                [0, -r + g * 0.7],
                [len / 2, -r - g * 0.2],
              ],
              thin,
            );
      result += rotate(q * 90, motif);
    }
  }
  return result;
}

export function architecturalDecoSvg(
  kind: ArchitecturalDecoFrame,
  width: number,
  height: number,
  shape: LabelShape = "rect",
): string {
  const w = Math.max(32, width),
    h = Math.max(32, height),
    u = Math.min(w, h),
    sw = Math.max(1, u * 0.0085),
    thin = sw * 0.66,
    g = u * 0.024;
  const p = u * 0.08,
    bw = w - 2 * p,
    bh = h - 2 * p;
  let body = "";
  if (shape === "circle") body = circular(kind, w, h, u, sw);
  else if (kind === "deco-quadrant" || kind === "deco-orbit" || kind === "deco-portal") {
    body = rect(p, p, bw, bh, kind === "deco-portal" ? sw * 1.5 : thin);
    const r = u * 0.18;
    let motif = quadrant(r, sw) + quadrant(r * 0.69, thin) + quadrant(r * 0.4, thin);
    if (kind === "deco-quadrant") {
      for (let i = 1; i < 6; i++) {
        const a = (i * Math.PI) / 12;
        motif += poly(
          [
            [Math.cos(a) * r * 0.69, Math.sin(a) * r * 0.69],
            [Math.cos(a) * r, Math.sin(a) * r],
          ],
          thin,
        );
        motif += dot(Math.cos(a) * (r + g * 0.4), Math.sin(a) * (r + g * 0.4), sw * 0.4, thin);
      }
    } else if (kind === "deco-orbit") {
      motif += rect(-g * 0.25, r * 0.72, g * 1.5, g * 1.5, thin) + rect(r * 0.72, -g * 0.25, g * 1.5, g * 1.5, thin);
      motif += poly(
        [
          [g * 0.4, r * 0.69],
          [g * 0.4, g * 0.4],
          [r * 0.69, g * 0.4],
        ],
        thin,
      );
    } else {
      motif += poly(
        [
          [0, r + g],
          [g, r + g],
          [g, g],
          [r + g, g],
          [r + g, 0],
        ],
        thin,
      );
      motif += poly(
        [
          [0, r + g * 2],
          [g * 2, r + g * 2],
          [g * 2, g * 2],
          [r + g * 2, g * 2],
          [r + g * 2, 0],
        ],
        thin,
      );
      body += rect(p + g * 0.45, p + g * 0.45, bw - g * 0.9, bh - g * 0.9, thin);
    }
    body += repeatCorners(w, h, p, motif);
  } else if (kind === "deco-scalloped") {
    const bar = p + u * 0.075,
      cr = u * 0.052;
    body =
      rect(p, p + u * 0.065, bw, bh - u * 0.13, sw) +
      rect(p + g, p + u * 0.065 + g, bw - g * 2, bh - u * 0.13 - g * 2, thin);
    let motif =
      poly(
        [
          [p - g, bar],
          [w - p + g, bar],
        ],
        sw * 1.6,
      ) +
      poly(
        [
          [p, bar - g],
          [w - p, bar - g],
        ],
        thin,
      );
    for (const x of [w / 2 - cr * 2, w / 2, w / 2 + cr * 2]) {
      motif += path(`M ${n(x - cr)} ${n(bar - g)} A ${n(cr)} ${n(cr)} 0 0 1 ${n(x + cr)} ${n(bar - g)}`, sw);
      motif += path(
        `M ${n(x - cr * 0.6)} ${n(bar - g)} A ${n(cr * 0.6)} ${n(cr * 0.6)} 0 0 1 ${n(x + cr * 0.6)} ${n(bar - g)}`,
        thin,
      );
    }
    body += mirrorBottom(w, h, motif);
  } else if (kind === "deco-hexagon") {
    const slope = u * 0.075;
    const outline = (x: number, y: number, width: number, height: number) =>
      poly(
        [
          [x, y + slope],
          [w / 2, y],
          [x + width, y + slope],
          [x + width, y + height - slope],
          [w / 2, y + height],
          [x, y + height - slope],
        ],
        thin,
        true,
      );
    body =
      outline(p, p, bw, bh) +
      outline(p + g, p + g, bw - g * 2, bh - g * 2) +
      rect(p - g * 0.5, p + slope, bw + g, bh - 2 * slope, thin);
  } else if (kind === "deco-ziggurat") {
    const bar = p + u * 0.065;
    body = rect(p, bar, bw, h - bar * 2, sw) + rect(p + g, bar + g, bw - g * 2, h - bar * 2 - g * 2, thin);
    let motif = "";
    for (let i = 0; i < 3; i++) {
      const span = u * (0.18 - i * 0.045),
        y = p + u * 0.008 + i * g * 0.72;
      motif += poly(
        [
          [w / 2 - span, y],
          [w / 2 + span, y],
          [w / 2 + span - g, bar + g * 0.4],
          [w / 2 - span + g, bar + g * 0.4],
        ],
        thin,
        true,
      );
    }
    body += mirrorBottom(w, h, motif);
  } else if (kind === "deco-bowtie") {
    const py = p + u * 0.06;
    body = rect(p, py, bw, h - py * 2, sw) + rect(p + g, py + g, bw - g * 2, h - py * 2 - g * 2, thin);
    const motif =
      poly(
        [
          [p + g, p],
          [w / 2, py + g * 0.4],
          [w - p - g, p],
          [w - p - g, py + g * 0.4],
          [p + g, py + g * 0.4],
        ],
        thin,
        true,
      ) +
      poly(
        [
          [p + g * 2, p + g * 0.5],
          [w / 2, py + g * 0.4],
          [w - p - g * 2, p + g * 0.5],
        ],
        thin,
      );
    body += mirrorBottom(w, h, motif);
  } else {
    const inset = u * 0.04;
    const outline = (x: number, y: number, width: number, height: number) =>
      path(
        `M ${n(x + inset)} ${n(y)} L ${n(x + width - inset)} ${n(y)} Q ${n(x + width + inset)} ${n(y + height / 2)} ${n(x + width - inset)} ${n(y + height)} L ${n(x + inset)} ${n(y + height)} Q ${n(x - inset)} ${n(y + height / 2)} ${n(x + inset)} ${n(y)} Z`,
        thin,
      );
    body = outline(p, p, bw, bh) + outline(p + g, p + g, bw - g * 2, bh - g * 2);
    for (let i = 1; i <= 15; i++) {
      const y = p + (bh * i) / 16;
      // Match the quadratic bow's x position; short flutes stay outside it.
      const t = i / 16,
        x = p + inset * (1 - 4 * t * (1 - t));
      body +=
        poly(
          [
            [x - g * 0.65, y],
            [x + g * 0.2, y],
          ],
          thin,
        ) +
        poly(
          [
            [w - x - g * 0.2, y],
            [w - x + g * 0.65, y],
          ],
          thin,
        );
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${n(w)}" height="${n(h)}" viewBox="0 0 ${n(w)} ${n(h)}"><rect width="${n(w)}" height="${n(h)}" fill="#000" opacity="0" stroke="none" stroke-width="0"/>${body}</svg>`;
}
