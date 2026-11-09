import type { LabelShape } from "$/types";

/** Original monochrome HUD geometry. Filled accents use the real ribbon colour. */
export const CYBER_FRAME_KINDS = [
  "cyber-hud",
  "cyber-ruler",
  "cyber-chevron",
  "cyber-armour",
  "cyber-telemetry",
  "cyber-module",
  "cyber-docking",
  "cyber-signal",
  "cyber-reactor",
  "cyber-vector",
  "cyber-terminal",
  "cyber-aperture",
  "cyber-overdrive",
] as const;
export type CyberFrameKind = (typeof CYBER_FRAME_KINDS)[number];
const n = (v: number) => String(Math.round(v * 1000) / 1000);
type Point = [number, number];
const poly = (pts: Point[], sw: number, close = false, fill = "none") =>
  `<path d="${pts.map(([x, y], i) => `${i ? "L" : "M"} ${n(x)} ${n(y)}`).join(" ")}${close ? " Z" : ""}" fill="${fill}" stroke="#000" stroke-width="${n(sw)}" stroke-linejoin="miter" stroke-linecap="square"/>`;
const box = (x: number, y: number, w: number, h: number, fill = "black", stroke = 0) =>
  `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" fill="${fill}" stroke="#000" stroke-width="${n(stroke)}"/>`;
const chamfer = (x: number, y: number, w: number, h: number, c: number, sw: number) =>
  poly(
    [
      [x + c, y],
      [x + w - c, y],
      [x + w, y + c],
      [x + w, y + h - c],
      [x + w - c, y + h],
      [x + c, y + h],
      [x, y + h - c],
      [x, y + c],
    ],
    sw,
    true,
  );
function ticks(
  x: number,
  y: number,
  length: number,
  count: number,
  size: number,
  sw: number,
  vertical = false,
): string {
  return Array.from({ length: count }, (_, i) => {
    const along = ((i + 0.5) * length) / count,
      reach = size * (i % 4 === 0 ? 1 : 0.55);
    return vertical
      ? poly(
          [
            [x, y + along],
            [x + reach, y + along],
          ],
          sw,
        )
      : poly(
          [
            [x + along, y],
            [x + along, y - reach],
          ],
          sw,
        );
  }).join("");
}
function chevrons(x: number, y: number, length: number, size: number, sw: number, vertical = false): string {
  const count = Math.max(3, Math.floor(length / (size * 1.6)));
  return Array.from({ length: count }, (_, i) => {
    const a = (i * length) / count;
    return vertical
      ? poly(
          [
            [x, y + a],
            [x - size * 0.55, y + a + size * 0.5],
            [x, y + a + size],
          ],
          sw,
        )
      : poly(
          [
            [x + a, y],
            [x + a + size * 0.5, y - size * 0.55],
            [x + a + size, y],
          ],
          sw,
        );
  }).join("");
}
function steps(x: number, y: number, length: number, height: number, count: number, vertical = false): string {
  const gap = height * 0.4,
    weights = Array.from({ length: count }, (_, i) => 1 + i * 0.28),
    unit = (length - gap * (count - 1)) / weights.reduce((a, b) => a + b, 0);
  let at = 0;
  return weights
    .map((weight) => {
      const reach = weight * unit;
      const result = vertical ? box(x, y + at, height, reach) : box(x + at, y, reach, height);
      at += reach + gap;
      return result;
    })
    .join("");
}
function arc(cx: number, cy: number, r: number, start: number, end: number, sw: number): string {
  const count = Math.max(3, Math.ceil((end - start) / 2));
  return poly(
    Array.from({ length: count }, (_, i): Point => {
      const a = ((start + ((end - start) * i) / (count - 1)) * Math.PI) / 180;
      return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
    }),
    sw,
  );
}
function ringBlock(cx: number, cy: number, r: number, t: number, a: number, b: number): string {
  const pts: Point[] = [];
  for (let i = 0; i <= 8; i++) {
    const angle = ((a + ((b - a) * i) / 8) * Math.PI) / 180;
    pts.push([cx + Math.cos(angle) * (r + t), cy + Math.sin(angle) * (r + t)]);
  }
  for (let i = 8; i >= 0; i--) {
    const angle = ((a + ((b - a) * i) / 8) * Math.PI) / 180;
    pts.push([cx + Math.cos(angle) * r, cy + Math.sin(angle) * r]);
  }
  return poly(pts, 0, true, "black");
}

/** Opposing armoured corners with transparent channels and evenly pitched rungs. */
function overdriveFrame(w: number, h: number, circle: boolean): string {
  const u = Math.min(w, h),
    thickness = Math.max(1.5, u * 0.026),
    gap = thickness * 2.15,
    fine = thickness * 0.2;
  const opposite = (body: string) => `<g transform="translate(${n(w)} ${n(h)}) rotate(180)">${body}</g>`;
  if (circle) {
    const cx = w / 2,
      cy = h / 2,
      radius = u * 0.418;
    let corner = arc(cx, cy, radius, -112, 22, thickness);
    corner += arc(cx, cy, radius - gap, -88, 10, thickness * 0.55);
    for (let angle = -82; angle <= 4; angle += 12) {
      const a = (angle * Math.PI) / 180;
      corner += poly(
        [
          [cx + Math.cos(a) * (radius - thickness * 0.5), cy + Math.sin(a) * (radius - thickness * 0.5)],
          [cx + Math.cos(a) * (radius - gap + thickness * 0.28), cy + Math.sin(a) * (radius - gap + thickness * 0.28)],
        ],
        fine,
      );
    }
    corner += ringBlock(cx, cy, radius - thickness * 0.5, thickness * 1.05, -65, -36);
    return corner + opposite(corner);
  }
  const p = u * 0.075,
    right = w - p,
    cut = u * 0.13,
    start = w * 0.26,
    end = h * 0.68,
    // Offsetting a 45° bevel shifts its intersections by (sqrt(2) - 1) * gap.
    bevelShift = (Math.SQRT2 - 1) * gap;
  let corner = poly(
    [
      [start, p],
      [right - cut, p],
      [right, p + cut],
      [right, end],
    ],
    thickness,
  );
  corner += poly(
    [
      [w * 0.49, p + gap],
      [right - cut - bevelShift, p + gap],
      [right - gap, p + cut + bevelShift],
      [right - gap, h * 0.47],
    ],
    thickness * 0.55,
  );
  // Tapered terminals and shallow armour tabs use the same 45° chamfers.
  corner += poly(
    [
      [start - thickness, p - thickness / 2],
      [start, p - thickness / 2],
      [start, p + thickness / 2],
    ],
    0,
    true,
    "black",
  );
  corner += poly(
    [
      [right - thickness / 2, end],
      [right + thickness / 2, end],
      [right - thickness / 2, end + thickness],
    ],
    0,
    true,
    "black",
  );
  corner += poly(
    [
      [w * 0.53, p - thickness / 2],
      [w * 0.53 + thickness * 0.55, p - thickness * 1.05],
      [right - cut - thickness * 0.55, p - thickness * 1.05],
      [right - cut, p - thickness / 2],
    ],
    0,
    true,
    "black",
  );
  corner += poly(
    [
      [right + thickness / 2, h * 0.39],
      [right + thickness * 1.05, h * 0.39 + thickness * 0.55],
      [right + thickness * 1.05, h * 0.5],
      [right + thickness / 2, h * 0.5 + thickness * 0.55],
    ],
    0,
    true,
    "black",
  );
  const rung = gap - thickness * 0.775;
  for (let x = w * 0.51; x + rung < right - cut - bevelShift; x += thickness * 1.7) {
    corner += poly(
      [
        [x + rung, p + thickness * 0.5],
        [x, p + gap - thickness * 0.275],
      ],
      fine,
    );
  }
  for (let y = p + cut + bevelShift + rung; y < h * 0.45; y += thickness * 1.7) {
    corner += poly(
      [
        [right - thickness * 0.5, y],
        [right - gap + thickness * 0.275, y - rung],
      ],
      fine,
    );
  }
  const accentOffset = gap * 0.6,
    accentShift = (Math.SQRT2 - 1) * accentOffset;
  corner += poly(
    [
      [w * 0.62, p + gap + thickness * 0.65],
      [right - cut - bevelShift - thickness * 0.65, p + gap + thickness * 0.65],
    ],
    fine,
  );
  corner += poly(
    [
      [right + accentOffset, h * 0.31],
      [right + accentOffset, p + cut - accentShift],
      [right - cut + accentShift, p - accentOffset],
      [w * 0.6, p - accentOffset],
    ],
    fine,
  );
  return corner + opposite(corner);
}
function roundFrame(kind: CyberFrameKind, w: number, h: number, u: number, sw: number): string {
  const cx = w / 2,
    cy = h / 2,
    r = u * 0.414,
    thin = sw * 0.65;
  let body = "";
  for (let q = 0; q < 4; q++)
    body += arc(cx, cy, r, q * 90 + 4, q * 90 + 85, sw) + arc(cx, cy, r - u * 0.025, q * 90 + 11, q * 90 + 77, thin);
  if (kind === "cyber-ruler" || kind === "cyber-telemetry")
    for (let i = 0; i < 48; i++) {
      const a = (i * Math.PI) / 24,
        reach = u * (i % 4 === 0 ? 0.026 : 0.014);
      body += poly(
        [
          [cx + Math.cos(a) * (r + u * 0.014), cy + Math.sin(a) * (r + u * 0.014)],
          [cx + Math.cos(a) * (r + u * 0.014 + reach), cy + Math.sin(a) * (r + u * 0.014 + reach)],
        ],
        thin,
      );
    }
  if (kind === "cyber-armour" || kind === "cyber-module")
    for (let q = 0; q < 8; q++)
      body += ringBlock(cx, cy, r - u * 0.006, u * 0.022, q * 45 + 8, q * 45 + 19 + (q % 3) * 4);
  if (kind === "cyber-hud")
    for (let q = 0; q < 4; q++) body += arc(cx, cy, r + u * 0.014, q * 90 + 18, q * 90 + 61, sw * 2.6);
  if (kind === "cyber-chevron")
    for (let q = 0; q < 4; q++)
      for (let i = 0; i < 4; i++) {
        const a = ((q * 90 + 25 + i * 9) * Math.PI) / 180,
          px = cx + Math.cos(a) * (r + u * 0.023),
          py = cy + Math.sin(a) * (r + u * 0.023);
        body += `<g transform="translate(${n(px)} ${n(py)}) rotate(${n((a * 180) / Math.PI + 90)})">${poly(
          [
            [-u * 0.009, -u * 0.009],
            [0, 0],
            [u * 0.009, -u * 0.009],
          ],
          thin,
        )}</g>`;
      }
  if (kind === "cyber-telemetry")
    for (let q = 0; q < 4; q++) body += ringBlock(cx, cy, r - u * 0.003, u * 0.019, q * 90 + 5, q * 90 + 21);
  return body;
}

/** Second series: open docking brackets, signal rails and angular instrument housings. */
function interfaceFrame(kind: CyberFrameKind, w: number, h: number, circle: boolean): string {
  const u = Math.min(w, h),
    p = u * 0.065,
    g = u * 0.025,
    sw = Math.max(1, u * 0.0085),
    thin = sw * 0.65;
  const c = u * 0.11,
    right = w - p,
    bottom = h - p;
  const mirror = (body: string) => `<g transform="translate(${n(w)} ${n(h)}) rotate(180)">${body}</g>`;
  if (circle) {
    const cx = w / 2,
      cy = h / 2,
      r = u * 0.414;
    let body = "";
    const segments = kind === "cyber-reactor" ? 6 : kind === "cyber-aperture" ? 8 : 4;
    for (let q = 0; q < segments; q++) {
      const a = (q * 360) / segments;
      body += arc(cx, cy, r, a + 5, a + 360 / segments - 7, sw);
      body += arc(cx, cy, r - g, a + 10, a + 360 / segments - 12, thin);
      if (kind === "cyber-reactor" || kind === "cyber-terminal")
        body += ringBlock(cx, cy, r + g * 0.35, g * 0.7, a + 10, a + 24);
      if (kind === "cyber-docking" || kind === "cyber-aperture") body += arc(cx, cy, r + g, a + 8, a + 25, sw * 1.8);
      if (kind === "cyber-vector")
        for (let i = 0; i < 3; i++) body += ringBlock(cx, cy, r + g * 0.3, g * 0.65, a + 12 + i * 7, a + 15 + i * 7);
      if (kind === "cyber-signal")
        for (let i = 0; i < 5; i++) {
          const angle = ((a + 12 + i * 7) * Math.PI) / 180;
          const start = r + g * 0.4,
            end = start + g * (0.35 + (i % 3) * 0.3);
          body += poly(
            [
              [cx + Math.cos(angle) * start, cy + Math.sin(angle) * start],
              [cx + Math.cos(angle) * end, cy + Math.sin(angle) * end],
            ],
            thin,
          );
        }
    }
    return body;
  }
  if (kind === "cyber-docking") {
    const corner =
      poly(
        [
          [p, p + u * 0.27],
          [p, p + c],
          [p + c, p],
          [p + u * 0.35, p],
        ],
        sw * 1.7,
      ) +
      poly(
        [
          [p + g, p + u * 0.21],
          [p + g, p + c],
          [p + c, p + g],
          [p + u * 0.28, p + g],
        ],
        thin,
      );
    const rail = poly(
      [
        [p + u * 0.4, p + g],
        [right - c, p + g],
        [right - g, p + c],
        [right - g, h * 0.44],
      ],
      thin,
    );
    return (
      corner +
      mirror(corner) +
      rail +
      mirror(rail) +
      steps(w * 0.45, p - g * 0.3, u * 0.18, g * 0.65, 4) +
      mirror(steps(w * 0.45, p - g * 0.3, u * 0.18, g * 0.65, 4))
    );
  }
  if (kind === "cyber-signal") {
    let body = chamfer(p, p, w - 2 * p, h - 2 * p, c * 0.6, thin);
    const rail = poly(
      [
        [p + c, p + g],
        [w * 0.38, p + g],
        [w * 0.38 + g, p + g * 2],
        [w * 0.7, p + g * 2],
      ],
      sw,
    );
    body += rail + mirror(rail);
    const bars = [1, 1.6, 0.8, 2, 1.2, 0.65, 1.5, 0.9];
    bars.forEach((height, i) => {
      body += box(p + g * 0.5, h * 0.34 + i * g * 1.45, g * height, g * 0.55);
    });
    body += mirror(steps(p + g * 0.5, h * 0.34, u * 0.28, g * 0.65, 7, true));
    body += poly(
      [
        [right - g, p + c],
        [right - g, h * 0.42],
      ],
      sw * 2,
    );
    return body;
  }
  if (kind === "cyber-reactor") {
    let body = chamfer(p, p, w - 2 * p, h - 2 * p, c, sw);
    const rail = poly(
      [
        [p + g, h * 0.39],
        [p + g, p + c],
        [p + c, p + g],
        [w * 0.39, p + g],
      ],
      thin,
    );
    body += rail + mirror(rail);
    const badge = poly(
      [
        [w * 0.43, p - g * 0.6],
        [w * 0.57, p - g * 0.6],
        [w * 0.57 + g, p + g],
        [w * 0.43 - g, p + g],
      ],
      0,
      true,
      "black",
    );
    body += badge + mirror(badge);
    const side = poly(
      [
        [p - g * 0.3, h * 0.42],
        [p + g, h * 0.42 + g],
        [p + g, h * 0.58 - g],
        [p - g * 0.3, h * 0.58],
      ],
      sw,
    );
    return body + side + mirror(side);
  }
  if (kind === "cyber-vector") {
    let body =
      chamfer(p, p, w - 2 * p, h - 2 * p, c * 1.35, sw) +
      chamfer(p + g, p + g, w - 2 * p - 2 * g, h - 2 * p - 2 * g, c * 1.2, thin);
    const slashes = Array.from({ length: 4 }, (_, i) =>
      poly(
        [
          [p + c * 1.5 + i * g * 1.4, p - g * 0.4],
          [p + c * 1.5 + i * g * 1.4 + g * 0.7, p + g * 0.5],
        ],
        sw * 1.4,
      ),
    ).join("");
    body += slashes + mirror(slashes);
    body += poly(
      [
        [right - g * 0.5, p + c * 1.5],
        [right - g * 0.5, h * 0.49],
      ],
      sw * 2.2,
    );
    return body;
  }
  if (kind === "cyber-terminal") {
    const top = poly(
      [
        [p, h * 0.48],
        [p, p + c],
        [p + c, p],
        [right, p],
      ],
      sw,
    );
    const lower = poly(
      [
        [p, h * 0.55],
        [p, bottom],
        [right - c, bottom],
        [right, bottom - c],
        [right, h * 0.36],
      ],
      thin,
    );
    const band = poly(
      [
        [p + c, p + g * 0.5],
        [w * 0.42, p + g * 0.5],
        [w * 0.42 + g, p + g * 1.6],
        [p + c, p + g * 1.6],
      ],
      0,
      true,
      "black",
    );
    return (
      top +
      lower +
      band +
      steps(right - u * 0.23, p + g * 0.5, u * 0.19, g * 0.8, 5) +
      poly(
        [
          [p + g, bottom - g],
          [w * 0.37, bottom - g],
        ],
        sw * 2,
      ) +
      ticks(w * 0.6, bottom - g * 0.4, w * 0.2, 12, g * 0.7, thin)
    );
  }
  // Aperture: paired rounded corner brackets with open side rails.
  let body = "";
  const corner =
    `<path d="M ${n(p)} ${n(p + c * 1.6)} V ${n(p + c)} Q ${n(p)} ${n(p)} ${n(p + c)} ${n(p)} H ${n(p + c * 1.6)}" fill="none" stroke="#000" stroke-width="${n(sw * 1.7)}"/>` +
    `<path d="M ${n(p + g)} ${n(p + c * 1.6)} V ${n(p + c)} Q ${n(p + g)} ${n(p + g)} ${n(p + c)} ${n(p + g)} H ${n(p + c * 1.6)}" fill="none" stroke="#000" stroke-width="${n(thin)}"/>`;
  body += corner + mirror(corner) + `<g transform="translate(${n(w)} 0) scale(-1 1)">${corner + mirror(corner)}</g>`;
  body += poly(
    [
      [p + c * 1.9, p + g],
      [right - c * 1.9, p + g],
    ],
    thin,
  );
  body += mirror(
    poly(
      [
        [p + c * 1.9, p + g],
        [right - c * 1.9, p + g],
      ],
      thin,
    ),
  );
  body += box(p - g * 0.3, h * 0.43, g * 0.65, h * 0.14) + box(right - g * 0.35, h * 0.43, g * 0.65, h * 0.14);
  return body;
}

export function cyberFrameSvg(kind: CyberFrameKind, width: number, height: number, shape: LabelShape = "rect"): string {
  const w = Math.max(32, width),
    h = Math.max(32, height),
    u = Math.min(w, h),
    p = u * 0.065,
    g = u * 0.025,
    sw = Math.max(1, u * 0.0085),
    thin = sw * 0.65;
  const bw = w - 2 * p,
    bh = h - 2 * p,
    c = u * 0.115;
  let body = "";
  if (kind === "cyber-overdrive") body = overdriveFrame(w, h, shape === "circle");
  else if (
    ["cyber-docking", "cyber-signal", "cyber-reactor", "cyber-vector", "cyber-terminal", "cyber-aperture"].includes(
      kind,
    )
  )
    body = interfaceFrame(kind, w, h, shape === "circle");
  else if (shape === "circle") body = roundFrame(kind, w, h, u, sw);
  else if (kind === "cyber-hud") {
    const outline = (pad: number, cut: number) =>
      poly(
        [
          [pad + cut, pad],
          [w * 0.32, pad],
          [w * 0.32 + g, pad + g * 0.7],
          [w * 0.65 - g, pad + g * 0.7],
          [w * 0.65, pad],
          [w - pad - cut, pad],
          [w - pad, pad + cut],
          [w - pad, h - pad - cut],
          [w - pad - cut, h - pad],
          [w * 0.62, h - pad],
          [w * 0.62 - g, h - pad - g],
          [w * 0.35 + g, h - pad - g],
          [w * 0.35, h - pad],
          [pad + cut, h - pad],
          [pad, h - pad - cut],
          [pad, pad + cut],
        ],
        sw,
        true,
      );
    body = outline(p, c) + outline(p + g, c * 0.75);
    body +=
      poly(
        [
          [p + c, p + g * 0.4],
          [p + c + u * 0.12, p + g * 0.4],
        ],
        sw * 2.5,
      ) +
      poly(
        [
          [w - p - g * 0.4, h - p - c],
          [w - p - g * 0.4, h - p - c - u * 0.16],
        ],
        sw * 2.5,
      );
    body += ticks(p - g * 0.7, p + c, bh - c * 2, 13, g * 0.6, thin, true);
  } else if (kind === "cyber-ruler") {
    body = chamfer(p, p, bw, bh, c * 0.55, sw) + box(p + g, p + g, bw - 2 * g, bh - 2 * g, "none", thin);
    body +=
      ticks(p + c, p + g * 0.75, bw - c * 2, 28, g * 0.6, thin) +
      ticks(p + c, h - p - g * 0.25, bw - c * 2, 22, g * 0.65, thin);
    body += ticks(p + g * 0.75, p + c, bh - c * 2, 25, g * 0.6, thin, true);
    body +=
      steps(w - p - u * 0.24, p + g * 1.6, u * 0.2, g * 0.55, 6) +
      steps(p + g * 1.6, h - p - g * 2.15, u * 0.2, g * 0.55, 6);
  } else if (kind === "cyber-chevron") {
    body = chamfer(p, p, bw, bh, c, sw) + chamfer(p + g, p + g, bw - 2 * g, bh - 2 * g, c * 0.75, thin);
    body += box(p - g * 0.5, p + c, g * 0.9, bh - c * 2.1) + box(w - p - g * 0.4, p + c, g * 0.9, bh - c * 2.1);
    body += chevrons(p + c + u * 0.1, p + g * 1.7, bw - c * 2 - u * 0.2, g * 0.8, thin);
    body += chevrons(p + g * 1.7, p + c + u * 0.05, bh - c * 2 - u * 0.1, g * 0.8, thin, true);
    body += chevrons(w - p - g * 1.5, p + c + u * 0.05, bh - c * 2 - u * 0.1, g * 0.8, thin, true);
    body += poly(
      [
        [p + c, h - p - g * 0.5],
        [w * 0.4, h - p - g * 0.5],
      ],
      sw * 1.8,
    );
  } else if (kind === "cyber-armour") {
    body = chamfer(p, p, bw, bh, c, sw) + chamfer(p + g, p + g, bw - 2 * g, bh - 2 * g, c * 0.75, thin);
    const tab = (x: number, len: number) =>
      poly(
        [
          [x, p - g * 0.8],
          [x + len - g, p - g * 0.8],
          [x + len, p + g * 0.15],
          [x + g * 0.3, p + g * 0.15],
        ],
        0,
        true,
        "black",
      );
    body += tab(p + c, u * 0.15) + tab(w * 0.42, u * 0.22) + tab(w - p - c - u * 0.11, u * 0.11);
    body += `<g transform="translate(${n(w)} ${n(h)}) rotate(180)">${tab(p + c, u * 0.22) + tab(w * 0.48, u * 0.18)}</g>`;
    body += poly(
      [
        [p + g * 0.5, h - p - c],
        [p + g * 0.5, h - p - u * 0.26],
        [p + g * 1.5, h - p - u * 0.23],
        [p + g * 1.5, h - p - c + g],
      ],
      0,
      true,
      "black",
    );
    body += poly(
      [
        [w - p - g * 0.4, p + c],
        [w - p - g * 0.4, p + u * 0.34],
        [w - p - g * 1.4, p + u * 0.29],
        [w - p - g * 1.4, p + c - g],
      ],
      0,
      true,
      "black",
    );
  } else if (kind === "cyber-telemetry") {
    body = poly(
      [
        [p, p + c],
        [p + c, p],
        [w - p, p],
        [w - p, h - p - c],
        [w - p - c, h - p],
        [p, h - p],
      ],
      sw,
      true,
    );
    body += poly(
      [
        [p + g, p + c],
        [p + c, p + g],
        [w - p - g, p + g],
        [w - p - g, h - p - c],
        [w - p - c, h - p - g],
        [p + g, h - p - g],
      ],
      thin,
      true,
    );
    body += steps(p - g * 0.25, p + c, u * 0.29, g * 0.65, 8, true);
    body += chevrons(w - p - u * 0.28, p + g * 1.7, u * 0.22, g * 0.75, thin);
    body += box(w - p + g * 0.25, p + c, g * 0.5, bh - c * 1.8);
    for (let i = 0; i < 3; i++)
      body += `<circle cx="${n(w - p - c + g * i * 0.75)}" cy="${n(h - p - g * (1.7 + i * 0.8))}" r="${n(sw * (0.6 + i * 0.25))}" fill="#000"/>`;
  } else {
    const pts: Point[] = [
      [p, p],
      [w - p - c, p],
      [w - p, p + c],
      [w - p, h - p],
      [w * 0.69, h - p],
      [w * 0.69 - g, h - p - g],
      [w * 0.4, h - p - g],
      [w * 0.4 - g, h - p],
      [p + c, h - p],
      [p, h - p - c],
    ];
    body = poly(pts, sw, true) + chamfer(p + g, p + g, bw - g * 2, bh - g * 2, c * 0.6, thin);
    body += steps(p - g * 0.25, p + u * 0.04, u * 0.28, g * 0.65, 7, true);
    body += poly(
      [
        [p + c, p - g * 0.6],
        [p + c + u * 0.25, p - g * 0.6],
        [p + c + u * 0.28, p + g * 0.3],
        [p + c - g * 0.3, p + g * 0.3],
      ],
      0,
      true,
      "black",
    );
    body += poly(
      [
        [w - p - c + g * 0.3, p - g * 0.4],
        [w - p + g * 0.3, p - g * 0.4],
        [w - p + g * 0.3, p + c - g * 0.3],
      ],
      0,
      true,
      "black",
    );
    body += poly(
      [
        [w - p - g * 0.4, h * 0.53],
        [w - p - g * 0.4, h - p - u * 0.06],
      ],
      sw * 2.5,
    );
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${n(w)}" height="${n(h)}" viewBox="0 0 ${n(w)} ${n(h)}"><rect width="${n(w)}" height="${n(h)}" fill="#000" opacity="0" stroke="none" stroke-width="0"/>${body}</svg>`;
}
