import type { LabelShape } from "$/types";

/** Original geometric frame geometry; all strokes use the label's design pixels. */
export const ART_DECO_FRAME_KINDS = [
  "deco-mitre",
  "deco-terminals",
  "deco-diamonds",
  "deco-fan",
  "deco-marquee",
  "deco-linked",
  "deco-spire",
  "deco-arcade",
] as const;
export type ArtDecoFrameKind = (typeof ART_DECO_FRAME_KINDS)[number];
const n = (v: number) => String(Math.round(v * 1000) / 1000);
type Point = [number, number];
const line = (points: Point[], stroke: number, close = false, fill = "none") =>
  `<path d="${points.map(([x, y], i) => `${i ? "L" : "M"} ${n(x)} ${n(y)}`).join(" ")}${close ? " Z" : ""}" fill="${fill}" stroke="#000" stroke-width="${n(stroke)}" stroke-linecap="round" stroke-linejoin="miter"/>`;
const rect = (x: number, y: number, w: number, h: number, sw: number, r = 0) =>
  `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${n(r)}" fill="none" stroke="#000" stroke-width="${n(sw)}"/>`;
const dot = (x: number, y: number, r: number, sw: number) =>
  `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="#fff" stroke="#000" stroke-width="${n(sw)}"/>`;
const diamond = (x: number, y: number, rx: number, ry: number, sw: number) =>
  line(
    [
      [x, y - ry],
      [x + rx, y],
      [x, y + ry],
      [x - rx, y],
    ],
    sw,
    true,
    "#fff",
  );
const octagon = (x: number, y: number, w: number, h: number, cut: number, sw: number) =>
  line(
    [
      [x + cut, y],
      [x + w - cut, y],
      [x + w, y + cut],
      [x + w, y + h - cut],
      [x + w - cut, y + h],
      [x + cut, y + h],
      [x, y + h - cut],
      [x, y + cut],
    ],
    sw,
    true,
  );

function corners(w: number, h: number, pad: number, drawing: string): string {
  return [
    [pad, pad, 1, 1],
    [w - pad, pad, -1, 1],
    [w - pad, h - pad, -1, -1],
    [pad, h - pad, 1, -1],
  ]
    .map(([x, y, sx, sy]) => `<g transform="translate(${n(x)} ${n(y)}) scale(${sx} ${sy})">${drawing}</g>`)
    .join("");
}
function fan(x: number, y: number, radius: number, sw: number): string {
  const points = Array.from(
    { length: 25 },
    (_, i): Point => [
      x + Math.cos(Math.PI + (i * Math.PI) / 24) * radius,
      y + Math.sin(Math.PI + (i * Math.PI) / 24) * radius,
    ],
  );
  let result = line(points, sw);
  for (let i = 0; i <= 6; i++) {
    const angle = Math.PI + (i * Math.PI) / 6;
    result += line(
      [
        [x, y],
        [x + Math.cos(angle) * radius, y + Math.sin(angle) * radius],
      ],
      sw,
    );
  }
  return result;
}

function roundFrame(kind: ArtDecoFrameKind, w: number, h: number, u: number, sw: number): string {
  const cx = w / 2,
    cy = h / 2,
    r = u * 0.414,
    g = u * 0.026,
    detail = sw * 0.68;
  const ring = (radius: number) =>
    `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(radius)}" fill="none" stroke="#000" stroke-width="${n(detail)}"/>`;
  const rotated = (angle: number, drawing: string) =>
    `<g transform="translate(${n(cx)} ${n(cy)}) rotate(${angle})">${drawing}</g>`;
  if (kind === "deco-terminals") {
    let result = ring(r);
    for (let q = 0; q < 4; q++) {
      const radius = r - g;
      const pts = Array.from({ length: 25 }, (_, i): Point => {
        const a = ((q * 90 + 12 + (i * 66) / 24) * Math.PI) / 180;
        return [cx + Math.cos(a) * radius, cy + Math.sin(a) * radius];
      });
      result +=
        line(pts, detail) +
        dot(pts[0][0], pts[0][1], sw * 1.15, detail) +
        dot(pts[24][0], pts[24][1], sw * 1.15, detail);
    }
    return result;
  }
  let result = ring(r) + ring(r - g);
  if (kind === "deco-fan") {
    const motif = fan(0, -u * 0.29, u * 0.075, detail);
    return result + rotated(0, motif) + rotated(180, motif);
  }
  for (let i = 0; i < 4; i++) {
    let motif = "";
    if (kind === "deco-diamonds") motif = diamond(0, -r, u * 0.035, u * 0.035, detail);
    else if (kind === "deco-spire") motif = diamond(0, -r + u * 0.006, u * 0.026, u * 0.05, detail);
    else if (kind === "deco-linked")
      motif =
        rect(-u * 0.022, -r - u * 0.02, u * 0.044, u * 0.044, detail) +
        rect(-u * 0.012, -r - u * 0.01, u * 0.044, u * 0.044, detail);
    else if (kind === "deco-mitre")
      motif = line(
        [
          [-u * 0.038, -r + g],
          [0, -r - u * 0.012],
          [u * 0.038, -r + g],
        ],
        detail,
      );
    else if (kind === "deco-marquee")
      motif = line(
        [
          [-u * 0.035, -r + g],
          [-u * 0.035, -r + u * 0.005],
          [u * 0.035, -r + u * 0.005],
          [u * 0.035, -r + g],
        ],
        detail,
      );
    else motif = rect(-u * 0.046, -r - u * 0.008, u * 0.092, u * 0.045, detail, u * 0.02);
    result += rotated(i * 90, motif);
  }
  return result;
}

export function artDecoFrameSvg(
  kind: ArtDecoFrameKind,
  width: number,
  height: number,
  shape: LabelShape = "rect",
): string {
  const w = Math.max(32, width),
    h = Math.max(32, height),
    u = Math.min(w, h);
  const sw = Math.max(1, u * 0.0085),
    thin = sw * 0.68,
    p = u * 0.078,
    g = u * 0.022,
    cut = u * 0.11;
  const bw = w - p * 2,
    bh = h - p * 2;
  let body = "";
  if (shape === "circle") body = roundFrame(kind, w, h, u, sw);
  else if (kind === "deco-mitre") {
    body =
      rect(p, p, bw, bh, sw) +
      rect(p + g * 1.5, p + g * 1.5, bw - g * 3, bh - g * 3, thin) +
      rect(p - g, p + g * 0.5, bw + g * 2, bh - g, thin) +
      rect(p + g * 0.5, p - g, bw - g, bh + g * 2, thin);
    body += corners(
      w,
      h,
      p,
      line(
        [
          [0, 0],
          [g, g],
        ],
        thin,
      ),
    );
  } else if (kind === "deco-terminals") {
    body = rect(p, p, bw, bh, thin);
    const len = Math.min(u * 0.2, bw * 0.28, bh * 0.28),
      step = g * 1.15;
    let motif =
      line(
        [
          [0, len],
          [0, 0],
          [len, 0],
        ],
        sw,
      ) +
      line(
        [
          [step, len - step],
          [step, step],
          [len - step, step],
        ],
        thin,
      );
    motif +=
      dot(0, len, sw * 1.1, thin) +
      dot(len, 0, sw * 1.1, thin) +
      dot(step, len - step, sw * 1.1, thin) +
      dot(len - step, step, sw * 1.1, thin);
    body += corners(w, h, p + g, motif);
  } else if (kind === "deco-diamonds") {
    body = rect(p, p, bw, bh, thin) + rect(p + g, p + g, bw - 2 * g, bh - 2 * g, thin);
    for (const [x, y] of [
      [w / 2, p],
      [w - p, h / 2],
      [w / 2, h - p],
      [p, h / 2],
    ]) {
      body += diamond(x, y, u * 0.045, u * 0.045, thin) + diamond(x, y, u * 0.024, u * 0.024, thin);
    }
  } else if (kind === "deco-fan") {
    body = octagon(p, p, bw, bh, cut, sw) + octagon(p + g, p + g, bw - g * 2, bh - g * 2, cut * 0.82, thin);
    let motif = line(
      [
        [0, cut],
        [0, 0],
        [cut, 0],
      ],
      thin,
    );
    for (let i = 1; i < 6; i++)
      motif += line(
        [
          [0, 0],
          [(cut * i) / 6, cut * (1 - i / 6)],
        ],
        thin,
      );
    body += corners(w, h, p, motif);
  } else if (kind === "deco-marquee") {
    body = octagon(p, p, bw, bh, cut * 0.8, sw) + octagon(p + g, p + g, bw - 2 * g, bh - 2 * g, cut * 0.55, thin);
    const size = u * 0.14;
    body += corners(
      w,
      h,
      p,
      line(
        [
          [0, size],
          [g, size],
          [g, g],
          [size, g],
          [size, 0],
        ],
        thin,
      ),
    );
    body += diamond(w / 2, p, u * 0.025, u * 0.035, thin) + diamond(w / 2, h - p, u * 0.025, u * 0.035, thin);
  } else if (kind === "deco-linked") {
    body = rect(p, p, bw, bh, thin);
    const size = u * 0.07;
    let motif = rect(-size * 0.28, -size * 0.28, size, size, sw) + rect(0, 0, size, size, thin);
    motif +=
      line(
        [
          [size * 0.25, size],
          [size * 0.25, u * 0.21],
        ],
        thin,
      ) + dot(size * 0.25, u * 0.21, sw * 1.15, thin);
    motif +=
      line(
        [
          [size, size * 0.25],
          [u * 0.21, size * 0.25],
        ],
        thin,
      ) + dot(u * 0.21, size * 0.25, sw * 1.15, thin);
    body += corners(w, h, p, motif);
  } else if (kind === "deco-spire") {
    body = octagon(p, p, bw, bh, cut, sw) + octagon(p + g, p + g, bw - g * 2, bh - g * 2, cut * 0.85, thin);
    body +=
      diamond(w / 2, p + g * 0.2, u * 0.045, u * 0.065, sw) + diamond(w / 2, h - p - g * 0.2, u * 0.045, u * 0.065, sw);
    const size = u * 0.15;
    body += corners(
      w,
      h,
      p,
      line(
        [
          [0, size],
          [0, 0],
          [size, 0],
        ],
        thin,
      ) +
        line(
          [
            [g, size],
            [g, g],
            [size, g],
          ],
          thin,
        ),
    );
  } else {
    // Rounded side bars and squared links recall architectural arcade details.
    body = octagon(p + g, p + g, bw - 2 * g, bh - 2 * g, cut * 0.8, sw);
    body +=
      rect(p, p + cut * 0.7, g, bh - cut * 1.4, thin, g / 2) +
      rect(w - p - g, p + cut * 0.7, g, bh - cut * 1.4, thin, g / 2);
    body +=
      rect(p + cut * 0.7, p, bw - cut * 1.4, g, thin, g / 2) +
      rect(p + cut * 0.7, h - p - g, bw - cut * 1.4, g, thin, g / 2);
    body += corners(
      w,
      h,
      p,
      rect(-g * 0.35, -g * 0.35, g * 1.8, g * 1.8, thin) +
        line(
          [
            [0, 0],
            [cut, cut],
          ],
          thin,
        ),
    );
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${n(w)}" height="${n(h)}" viewBox="0 0 ${n(w)} ${n(h)}"><rect width="${n(w)}" height="${n(h)}" fill="#000" opacity="0" stroke="none" stroke-width="0"/>${body}</svg>`;
}
