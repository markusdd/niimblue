import type { LabelShape } from "$/types";
import { DECORATIVE_ORNAMENTS } from "../data/decorative_ornaments";

/** Original vector silhouettes inspired by traditional printed label cartouches. */
export const VINTAGE_FRAME_KINDS = [
  "cartouche",
  "baroque",
  "cameo",
  "rococo",
  "ribbon-plaque",
  "scroll-plaque",
  "royal-crest",
  "acanthus",
  "laurel-plaque",
  "fleur-scroll",
  "filigree",
  "rose-cartouche",
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
  "royal-crest":
    "M 13 7 C 20 2 29 5 37 8 Q 43 10 46 3 Q 50 -2 54 3 Q 57 10 63 8 C 71 5 80 2 87 7 Q 94 12 92 23 C 99 30 99 70 92 77 Q 94 88 87 93 C 80 98 71 95 63 92 Q 57 90 54 97 Q 50 102 46 97 Q 43 90 37 92 C 29 95 20 98 13 93 Q 6 88 8 77 C 1 70 1 30 8 23 Q 6 12 13 7 Z",
  acanthus:
    "M 9 13 C 15 7 22 10 26 16 C 31 9 38 8 44 13 Q 50 19 56 13 C 62 8 69 9 74 16 C 79 10 86 7 92 13 Q 98 20 94 28 L 94 72 Q 98 80 92 87 C 86 93 79 90 74 84 C 69 91 62 92 56 87 Q 50 81 44 87 C 38 92 31 91 26 84 C 22 90 15 93 9 87 Q 2 80 6 72 L 6 28 Q 2 20 9 13 Z",
  "laurel-plaque":
    "M 12 8 Q 18 3 24 8 Q 31 3 38 8 Q 50 12 62 8 Q 69 3 76 8 Q 82 3 88 8 Q 96 14 92 24 L 92 76 Q 96 86 88 92 Q 82 97 76 92 Q 69 97 62 92 Q 50 88 38 92 Q 31 97 24 92 Q 18 97 12 92 Q 4 86 8 76 L 8 24 Q 4 14 12 8 Z",
  "fleur-scroll":
    "M 8 14 C 12 7 21 8 25 14 C 30 5 40 7 45 13 Q 50 19 55 13 C 60 7 70 5 75 14 C 79 8 88 7 92 14 Q 98 22 93 30 L 93 70 Q 98 78 92 86 C 88 93 79 92 75 86 C 70 95 60 93 55 87 Q 50 81 45 87 C 40 93 30 95 25 86 C 21 92 12 93 8 86 Q 2 78 7 70 L 7 30 Q 2 22 8 14 Z",
  filigree:
    "M 10 12 C 17 4 27 6 33 12 Q 40 18 45 10 Q 50 1 55 10 Q 60 18 67 12 C 73 6 83 4 90 12 Q 98 20 92 29 C 99 36 99 64 92 71 Q 98 80 90 88 C 83 96 73 94 67 88 Q 60 82 55 90 Q 50 99 45 90 Q 40 82 33 88 C 27 94 17 96 10 88 Q 2 80 8 71 C 1 64 1 36 8 29 Q 2 20 10 12 Z",
  "rose-cartouche":
    "M 11 9 C 20 2 31 8 37 12 Q 43 16 46 7 C 48 0 52 0 54 7 Q 57 16 63 12 C 69 8 80 2 89 9 Q 98 16 91 27 C 100 34 100 66 91 73 Q 98 84 89 91 C 80 98 69 92 63 88 Q 57 84 54 93 C 52 100 48 100 46 93 Q 43 84 37 88 C 31 92 20 98 11 91 Q 2 84 9 73 C 0 66 0 34 9 27 Q 2 16 11 9 Z",
};
function mapped(d: string, x: number, y: number, width: number, height: number): string {
  let coordinate = 0;
  return d.replace(/-?\d+(?:\.\d+)?/g, (value) =>
    n(++coordinate % 2 ? x + (Number(value) * width) / 100 : y + (Number(value) * height) / 100),
  );
}
function mappedOriented(
  d: string,
  x: number,
  y: number,
  width: number,
  height: number,
  flipX = false,
  flipY = false,
): string {
  let coordinate = 0;
  return d.replace(/-?\d+(?:\.\d+)?/g, (value) => {
    const horizontal = ++coordinate % 2 === 1;
    const point = Number(value);
    return n(
      horizontal
        ? x + ((flipX ? 100 - point : point) * width) / 100
        : y + ((flipY ? 100 - point : point) * height) / 100,
    );
  });
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

const ornateKinds: readonly VintageFrameKind[] = [
  "royal-crest",
  "acanthus",
  "laurel-plaque",
  "fleur-scroll",
  "filigree",
  "rose-cartouche",
];

/** Paired scrolls, engraved foliage and a central device form an open text banner. */
function ornaments(
  kind: VintageFrameKind,
  x: number,
  y: number,
  width: number,
  height: number,
  stroke: number,
): string {
  const wings: Record<string, string> = {
    "royal-crest":
      "M 2 73 C 15 93 21 22 34 49 C 44 71 30 94 27 73 C 25 60 38 58 39 72 M 7 70 C 19 66 21 10 32 26 C 41 39 28 55 24 38 M 32 50 C 39 42 41 32 43 20",
    acanthus:
      "M 2 77 C 19 88 18 28 34 46 C 44 59 34 83 28 69 C 24 59 34 54 37 62 M 11 65 C 7 45 18 27 24 38 C 29 47 21 55 17 47 M 28 47 C 26 24 35 12 39 26 C 42 36 35 43 33 35",
    "laurel-plaque":
      "M 2 77 C 19 77 27 30 43 20 M 8 72 C 12 62 17 56 21 57 M 22 50 C 25 39 29 32 33 31 M 34 31 C 36 20 40 17 44 15",
    "fleur-scroll":
      "M 2 78 C 13 83 20 34 31 45 C 43 57 31 86 27 68 C 25 59 35 53 37 62 M 11 65 C 7 46 19 19 27 30 C 34 39 25 51 21 43 M 31 44 C 40 44 44 32 41 22 C 37 12 32 20 36 26",
    filigree:
      "M 2 76 C 11 96 27 7 38 25 C 49 43 24 94 20 70 C 16 47 43 9 43 37 C 43 64 11 88 10 61 C 10 48 24 40 26 52 C 29 70 34 86 41 67 M 4 84 C 22 84 29 36 40 43",
    "rose-cartouche":
      "M 2 78 C 18 80 18 26 33 43 C 44 56 34 82 28 67 C 24 56 35 52 37 61 M 11 66 C 6 47 16 29 23 37 C 29 45 21 54 17 47 M 29 43 C 32 27 38 26 42 33",
  };
  const leaves =
    "M 11 63 C 5 50 10 32 16 32 C 21 47 16 57 11 63 Z M 21 54 C 15 38 22 18 28 19 C 30 35 27 46 21 54 Z M 31 43 C 31 24 38 13 42 16 C 42 30 38 38 31 43 Z M 18 69 C 20 83 27 91 32 83 C 29 74 25 69 18 69 Z";
  // Emblems are paths rather than text or raster images, so they remain editable.
  const emblemPaths: Record<string, string> = {
    acanthus:
      "M 50 95 C 34 71 10 67 12 32 C 28 39 34 49 37 61 C 30 35 37 16 50 4 C 63 16 70 35 63 61 C 66 49 72 39 88 32 C 90 67 66 71 50 95 Z M 50 22 L 50 81 M 22 46 L 42 70 M 78 46 L 58 70",
    "laurel-plaque":
      "M 50 92 C 22 80 13 47 23 17 C 35 32 35 51 31 57 C 46 55 45 73 50 80 M 50 92 C 78 80 87 47 77 17 C 65 32 65 51 69 57 C 54 55 55 73 50 80",
    "fleur-scroll":
      "M 50 94 C 42 77 33 72 21 69 C 37 62 35 48 18 42 C 34 40 43 47 46 57 C 39 33 44 18 50 4 C 56 18 61 33 54 57 C 57 47 66 40 82 42 C 65 48 63 62 79 69 C 67 72 58 77 50 94 Z M 34 70 L 66 70",
    filigree:
      "M 50 61 C 15 6 8 25 18 43 C 35 72 80 30 82 24 C 94 5 60 17 50 61 C 37 95 67 95 50 61 M 50 61 C 75 13 96 48 74 63 C 53 77 12 31 18 24 M 24 72 C 40 85 60 85 76 72",
  };
  const bandH = height * 0.18;
  const band = (top: number, invert: boolean) => {
    let body = "";
    for (const mirror of [false, true]) {
      body += path(
        mappedOriented(wings[kind], x + width * 0.05, top, width * 0.9, bandH, mirror, invert),
        stroke * 0.6,
      );
      if (kind !== "filigree")
        body += `<path d="${mappedOriented(leaves, x + width * 0.05, top, width * 0.9, bandH, mirror, invert)}" fill="#000" stroke="none"/>`;
    }
    const emblemW = Math.min(width * 0.21, bandH * 1.8);
    const emblemX = x + (width - emblemW) / 2;
    if (kind === "royal-crest" && invert) {
      body += path(
        mappedOriented(
          "M 50 12 C 34 34 19 18 23 42 C 27 62 45 49 50 83 C 55 49 73 62 77 42 C 81 18 66 34 50 12 Z M 50 26 L 50 68",
          emblemX,
          top,
          emblemW,
          bandH,
          false,
          invert,
        ),
        stroke * 0.6,
      );
    } else if (kind === "royal-crest" || kind === "rose-cartouche") {
      const device = DECORATIVE_ORNAMENTS.find(
        (item) => item.id === (kind === "royal-crest" ? "crown-finial" : "rose-medallion"),
      )!;
      const [, , vw, vh] = device.viewBox.split(" ").map(Number);
      const scale = Math.min(emblemW / vw, bandH / vh);
      const drawing = device.svg.replace(/<svg[^>]*>/, "").replace(/<\/svg>$/, "");
      body += `<g transform="translate(${n(x + width / 2 - (vw * scale) / 2)} ${n(top + (invert ? bandH : 0))}) scale(${n(scale)} ${n(invert ? -scale : scale)})" fill="none" stroke="#000" stroke-width="${n((stroke * 0.55) / scale)}" stroke-linecap="round" stroke-linejoin="round">${drawing}</g>`;
    } else {
      body += path(mappedOriented(emblemPaths[kind], emblemX, top, emblemW, bandH, false, invert), stroke * 0.6);
    }
    return body;
  };
  return band(y + height * 0.025, false) + band(y + height * 0.795, true);
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
  } else if (!(ornateKinds as readonly string[]).includes(kind)) {
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
  if ((ornateKinds as readonly string[]).includes(kind)) {
    result += ornaments(kind, cx - radius * 0.55, cy - radius * 0.83, radius * 1.1, radius * 1.66, stroke);
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
    if ((ornateKinds as readonly string[]).includes(kind)) {
      const radius = shape === "rounded_rect" ? Math.min(boxW, boxH) * 0.075 : 0;
      const rounded = (x: number, y: number, width: number, height: number, r: number) =>
        `M ${n(x + r)} ${n(y)} L ${n(x + width - r)} ${n(y)} Q ${n(x + width)} ${n(y)} ${n(x + width)} ${n(y + r)} L ${n(x + width)} ${n(y + height - r)} Q ${n(x + width)} ${n(y + height)} ${n(x + width - r)} ${n(y + height)} L ${n(x + r)} ${n(y + height)} Q ${n(x)} ${n(y + height)} ${n(x)} ${n(y + height - r)} L ${n(x)} ${n(y + r)} Q ${n(x)} ${n(y)} ${n(x + r)} ${n(y)} Z`;
      drawing = path(rounded(margin, margin, boxW, boxH, radius), stroke);
      drawing += path(
        rounded(margin + gap, margin + gap, boxW - gap * 2, boxH - gap * 2, radius * 0.74),
        stroke * 0.45,
      );
      drawing += path(
        `M ${n(margin + boxW * 0.08)} ${n(margin + boxH * 0.22)} L ${n(w - margin - boxW * 0.08)} ${n(margin + boxH * 0.22)} M ${n(margin + boxW * 0.08)} ${n(margin + boxH * 0.78)} L ${n(w - margin - boxW * 0.08)} ${n(margin + boxH * 0.78)}`,
        stroke * 0.5,
      );
    } else {
      drawing = path(mapped(contours[kind], margin, margin, boxW, boxH), stroke);
      drawing += path(
        mapped(contours[kind], margin + gap, margin + gap, boxW - gap * 2, boxH - gap * 2),
        stroke * 0.45,
      );
    }
    if ((ornateKinds as readonly string[]).includes(kind)) {
      drawing += ornaments(kind, margin, margin, boxW, boxH, stroke);
    }
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
