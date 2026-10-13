import type { LabelShape } from "$/types";

/** Original frame geometry. These are not taken from the Niimbot app. */
export const BORDER_KINDS = [
  "line",
  "double",
  "corners",
  "dashed",
  "dotted",
  "banner",
  "diamonds",
  "scallop",
  "gallery",
  "deco",
  "ticket",
  "bead",
  "rope",
  "vine",
  "scroll",
  "stamp",
  "engraved",
  "laurel",
  "meadow",
  "nouveau",
  "celestial",
  "circuit",
  "schematic",
] as const;

export type BorderKind = (typeof BORDER_KINDS)[number];

const frameWords = "frame border rahmen rand";

export const borderKeywords: Record<BorderKind, string> = {
  line: `${frameWords} line linie outline kontur`,
  double: `${frameWords} double doppelt doppellinie twin`,
  corners: `${frameWords} corners ecken corner bracket`,
  dashed: `${frameWords} dashed gestrichelt dash`,
  dotted: `${frameWords} dotted gepunktet dots punkte`,
  banner: `${frameWords} banner bands balken bar stripe streifen`,
  diamonds: `${frameWords} diamonds rauten eckrauten diamond raute`,
  scallop: `${frameWords} scallop scalloped gewellt wavy welle wellig`,
  gallery: `${frameWords} gallery picture bilderrahmen modern mat passepartout`,
  deco: `${frameWords} deco art deco stepped stufen geometrisch`,
  ticket: `${frameWords} ticket stub coupon eintritt kerbe notch abschnitt`,
  bead: `${frameWords} bead beads perlen pearl`,
  rope: `${frameWords} rope twisted seil tau cord schnur`,
  vine: `${frameWords} vine flower leaf blume blatt ranke floral blumenranke`,
  scroll: `${frameWords} scroll antique antik spiral schnoerkel barock ornament`,
  stamp: `${frameWords} stamp postage perforation briefmarke perforiert lochung`,
  engraved: `${frameWords} engraved antique vintage etching engraving gravur antik kupferstich rosette ornament`,
  laurel: `${frameWords} laurel olive botanical leaves wreath lorbeer olive blatt blaetter kranz botanisch`,
  meadow: `${frameWords} meadow wildflower daisy flower floral garden wiese wildblumen gaensebluemchen blumen`,
  nouveau: `${frameWords} nouveau jugendstil artsy whiplash lily iris floral kunst ornament`,
  celestial: `${frameWords} celestial moon stars sun cosmic himmel mond sterne sonne kosmos artsy`,
  circuit: `${frameWords} circuit pcb traces electronics technical platine leiterbahn elektronik technik`,
  schematic: `${frameWords} schematic resistor capacitor circuit electronics schaltplan widerstand kondensator elektronik`,
};

const n = (value: number): string => {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
};

const spacer = (width: number, height: number): string =>
  `<rect data-spacer="1" x="0" y="0" width="${n(width)}" height="${n(height)}" fill="#000" fill-opacity="0" stroke="none"/>`;

const strokeAttr = (stroke: number, dash?: "dash" | "dot"): string => {
  const base = `fill="none" stroke="#000" stroke-width="${n(stroke)}" stroke-linejoin="round"`;
  if (dash === "dash") {
    return `${base} stroke-linecap="butt" stroke-dasharray="${n(stroke * 3.2)} ${n(stroke * 2.1)}"`;
  }
  if (dash === "dot") {
    return `${base} stroke-linecap="round" stroke-dasharray="0 ${n(stroke * 2.6)}"`;
  }
  return `${base} stroke-linecap="round"`;
};

const outline = (
  width: number,
  height: number,
  pad: number,
  radius: number,
  shape: LabelShape,
  stroke: number,
  dash?: "dash" | "dot",
): string => {
  const attr = strokeAttr(stroke, dash);
  if (shape === "circle") {
    const r = Math.min(width, height) / 2 - pad;
    return `<circle cx="${n(width / 2)}" cy="${n(height / 2)}" r="${n(Math.max(1, r))}" ${attr}/>`;
  }
  const x = pad;
  const y = pad;
  const w = Math.max(1, width - pad * 2);
  const h = Math.max(1, height - pad * 2);
  const rx = shape === "rounded_rect" ? Math.max(0, Math.min(radius, w / 2, h / 2)) : 0;
  const rxAttr = rx > 0 ? ` rx="${n(rx)}"` : "";
  return `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}"${rxAttr} ${attr}/>`;
};

const cornerPaths = (x: number, y: number, w: number, h: number, radius: number): string[] => {
  const arm = Math.min(w, h) * 0.22;
  if (radius <= 2) {
    return [
      `M ${n(x)} ${n(y + arm)} V ${n(y)} H ${n(x + arm)}`,
      `M ${n(x + w - arm)} ${n(y)} H ${n(x + w)} V ${n(y + arm)}`,
      `M ${n(x + w)} ${n(y + h - arm)} V ${n(y + h)} H ${n(x + w - arm)}`,
      `M ${n(x + arm)} ${n(y + h)} H ${n(x)} V ${n(y + h - arm)}`,
    ];
  }
  const r = Math.min(radius, w / 2, h / 2);
  const extra = Math.max(arm * 0.45, Math.min(w, h) * 0.08);
  return [
    `M ${n(x)} ${n(y + r + extra)} V ${n(y + r)} A ${n(r)} ${n(r)} 0 0 1 ${n(x + r)} ${n(y)} H ${n(x + r + extra)}`,
    `M ${n(x + w - r - extra)} ${n(y)} H ${n(x + w - r)} A ${n(r)} ${n(r)} 0 0 1 ${n(x + w)} ${n(y + r)} V ${n(y + r + extra)}`,
    `M ${n(x + w)} ${n(y + h - r - extra)} V ${n(y + h - r)} A ${n(r)} ${n(r)} 0 0 1 ${n(x + w - r)} ${n(y + h)} H ${n(x + w - r - extra)}`,
    `M ${n(x + r + extra)} ${n(y + h)} H ${n(x + r)} A ${n(r)} ${n(r)} 0 0 1 ${n(x)} ${n(y + h - r)} V ${n(y + h - r - extra)}`,
  ];
};

const circleArcs = (cx: number, cy: number, r: number, span: number): string[] => {
  const mids = [Math.PI / 4, (Math.PI * 3) / 4, (Math.PI * 5) / 4, (Math.PI * 7) / 4];
  return mids.map((mid) => {
    const a0 = mid - span / 2;
    const a1 = mid + span / 2;
    const x0 = cx + r * Math.cos(a0);
    const y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1);
    const y1 = cy + r * Math.sin(a1);
    return `M ${n(x0)} ${n(y0)} A ${n(r)} ${n(r)} 0 0 1 ${n(x1)} ${n(y1)}`;
  });
};

const diamond = (cx: number, cy: number, s: number): string =>
  `<polygon points="${n(cx)},${n(cy - s)} ${n(cx + s)},${n(cy)} ${n(cx)},${n(cy + s)} ${n(cx - s)},${n(cy)}" fill="#000"/>`;

const bandPath = (x: number, y: number, w: number, band: number, radius: number, top: boolean): string => {
  const r = Math.max(0, Math.min(radius, w / 2, band));
  if (r <= 1) {
    return `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(band)}" fill="#000"/>`;
  }
  if (top) {
    return `<path fill="#000" d="M ${n(x + r)} ${n(y)} H ${n(x + w - r)} A ${n(r)} ${n(r)} 0 0 1 ${n(x + w)} ${n(y + r)} V ${n(y + band)} H ${n(x)} V ${n(y + r)} A ${n(r)} ${n(r)} 0 0 1 ${n(x + r)} ${n(y)} Z"/>`;
  }
  const bottom = y + band;
  return `<path fill="#000" d="M ${n(x)} ${n(y)} H ${n(x + w)} V ${n(bottom - r)} A ${n(r)} ${n(r)} 0 0 1 ${n(x + w - r)} ${n(bottom)} H ${n(x + r)} A ${n(r)} ${n(r)} 0 0 1 ${n(x)} ${n(bottom - r)} Z"/>`;
};

const circleCap = (cx: number, cy: number, r: number, mid: number, ang: number): string => {
  const a0 = mid - ang;
  const a1 = mid + ang;
  const x0 = cx + r * Math.cos(a0);
  const y0 = cy + r * Math.sin(a0);
  const x1 = cx + r * Math.cos(a1);
  const y1 = cy + r * Math.sin(a1);
  return `<path fill="#000" d="M ${n(x0)} ${n(y0)} A ${n(r)} ${n(r)} 0 0 1 ${n(x1)} ${n(y1)} Z"/>`;
};

const pushEdge = (
  pts: Array<[number, number]>,
  count: number,
  at: (t: number) => [number, number],
) => {
  const steps = Math.max(2, count) * 6;
  for (let i = 0; i <= steps; i++) pts.push(at(i / steps));
};

const pushArc = (
  pts: Array<[number, number]>,
  cx: number,
  cy: number,
  r: number,
  a0: number,
  a1: number,
) => {
  const steps = 8;
  for (let i = 0; i <= steps; i++) {
    const a = a0 + ((a1 - a0) * i) / steps;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
};

const bulge = (t: number, count: number): number => (1 - Math.cos(t * count * Math.PI * 2)) / 2;

const scallopPoints = (
  x: number,
  y: number,
  w: number,
  h: number,
  amp: number,
  radius: number,
): Array<[number, number]> => {
  const r = Math.min(radius, w / 2 - 1, h / 2 - 1);
  const straightW = w - 2 * Math.max(r, 0);
  const straightH = h - 2 * Math.max(r, 0);
  const nx = Math.max(3, Math.round(Math.max(straightW, w) / (amp * 2.4)));
  const ny = Math.max(2, Math.round(Math.max(straightH, h) / (amp * 2.4)));
  const pts: Array<[number, number]> = [];

  if (r < 4 || straightW < amp * 2 || straightH < amp * 2) {
    pushEdge(pts, nx, (t) => [x + t * w, y + bulge(t, nx) * amp]);
    pushEdge(pts, ny, (t) => [x + w - bulge(t, ny) * amp, y + t * h]);
    pushEdge(pts, nx, (t) => [x + w - t * w, y + h - bulge(t, nx) * amp]);
    pushEdge(pts, ny, (t) => [x + bulge(t, ny) * amp, y + h - t * h]);
    return pts;
  }

  pushEdge(pts, nx, (t) => [x + r + t * straightW, y + bulge(t, nx) * amp]);
  pushArc(pts, x + w - r, y + r, r, -Math.PI / 2, 0);
  pushEdge(pts, ny, (t) => [x + w - bulge(t, ny) * amp, y + r + t * straightH]);
  pushArc(pts, x + w - r, y + h - r, r, 0, Math.PI / 2);
  pushEdge(pts, nx, (t) => [x + w - r - t * straightW, y + h - bulge(t, nx) * amp]);
  pushArc(pts, x + r, y + h - r, r, Math.PI / 2, Math.PI);
  pushEdge(pts, ny, (t) => [x + bulge(t, ny) * amp, y + h - r - t * straightH]);
  pushArc(pts, x + r, y + r, r, Math.PI, Math.PI * 1.5);
  return pts;
};

const circleScallop = (cx: number, cy: number, r: number, amp: number): Array<[number, number]> => {
  const count = Math.max(10, Math.round((2 * Math.PI * r) / (amp * 2.4)));
  const steps = count * 8;
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const rad = r - ((1 - Math.cos(t * count)) / 2) * amp;
    pts.push([cx + Math.cos(t) * rad, cy + Math.sin(t) * rad]);
  }
  return pts;
};

const pathFrom = (pts: Array<[number, number]>, attr: string): string =>
  `<path d="M ${pts.map(([x, y]) => `${n(x)} ${n(y)}`).join(" L ")} Z" ${attr}/>`;

type EdgePoint = { x: number; y: number; nx: number; ny: number; t: number };
type EdgeSeg = { len: number; at: (u: number) => EdgePoint };

const edgePoint = (x: number, y: number, nx: number, ny: number): EdgePoint => ({ x, y, nx, ny, t: 0 });

const lineSeg = (x0: number, y0: number, x1: number, y1: number, nx: number, ny: number): EdgeSeg => {
  const len = Math.hypot(x1 - x0, y1 - y0);
  return {
    len,
    at: (u) => edgePoint(x0 + (x1 - x0) * u, y0 + (y1 - y0) * u, nx, ny),
  };
};

const arcSeg = (cx: number, cy: number, r: number, a0: number, a1: number): EdgeSeg => ({
  len: Math.abs(a1 - a0) * Math.max(r, 0),
  at: (u) => {
    const a = a0 + (a1 - a0) * u;
    const c = Math.cos(a);
    const s = Math.sin(a);
    return edgePoint(cx + c * r, cy + s * r, -c, -s);
  },
});

/** Clockwise from the top. Inward normals point onto the label. */
const outlineSegs = (
  width: number,
  height: number,
  pad: number,
  radius: number,
  shape: LabelShape,
): EdgeSeg[] => {
  if (shape === "circle") {
    const r = Math.max(1, Math.min(width, height) / 2 - pad);
    return [arcSeg(width / 2, height / 2, r, -Math.PI / 2, Math.PI * 1.5)];
  }
  const x = pad;
  const y = pad;
  const rw = Math.max(1, width - pad * 2);
  const rh = Math.max(1, height - pad * 2);
  const r = shape === "rounded_rect" ? Math.min(Math.max(radius, 0), rw / 2, rh / 2) : 0;
  if (r < 2) {
    return [
      lineSeg(x, y, x + rw, y, 0, 1),
      lineSeg(x + rw, y, x + rw, y + rh, -1, 0),
      lineSeg(x + rw, y + rh, x, y + rh, 0, -1),
      lineSeg(x, y + rh, x, y, 1, 0),
    ];
  }
  return [
    lineSeg(x + r, y, x + rw - r, y, 0, 1),
    arcSeg(x + rw - r, y + r, r, -Math.PI / 2, 0),
    lineSeg(x + rw, y + r, x + rw, y + rh - r, -1, 0),
    arcSeg(x + rw - r, y + rh - r, r, 0, Math.PI / 2),
    lineSeg(x + rw - r, y + rh, x + r, y + rh, 0, -1),
    arcSeg(x + r, y + rh - r, r, Math.PI / 2, Math.PI),
    lineSeg(x, y + rh - r, x, y + r, 1, 0),
    arcSeg(x + r, y + r, r, Math.PI, Math.PI * 1.5),
  ];
};

const walkOutline = (
  width: number,
  height: number,
  pad: number,
  radius: number,
  shape: LabelShape,
): EdgePoint[] => {
  const segs = outlineSegs(width, height, pad, radius, shape).filter((seg) => seg.len > 0.5);
  const total = segs.reduce((sum, seg) => sum + seg.len, 0);
  if (total < 1 || segs.length === 0) return [];
  const count = Math.max(64, Math.min(520, Math.round(total / 3)));
  const pts: EdgePoint[] = [];
  let segIndex = 0;
  let segStart = 0;
  for (let i = 0; i < count; i++) {
    const dist = (i / count) * total;
    while (segIndex < segs.length - 1 && dist > segStart + segs[segIndex].len) {
      segStart += segs[segIndex].len;
      segIndex += 1;
    }
    const seg = segs[segIndex];
    const u = seg.len <= 0 ? 0 : Math.min(1, Math.max(0, (dist - segStart) / seg.len));
    const point = seg.at(u);
    point.t = dist / total;
    pts.push(point);
  }
  return pts;
};

const strokePath = (pts: EdgePoint[], attr: string, close: boolean): string => {
  if (pts.length < 2) return "";
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${n(p.x)} ${n(p.y)}`).join(" ");
  return `<path d="${d}${close ? " Z" : ""}" ${attr}/>`;
};

const wavePts = (pts: EdgePoint[], amp: number, turns: number, phase: number): EdgePoint[] =>
  pts.map((p) => {
    const wobble = Math.sin(p.t * Math.PI * 2 * turns + phase) * amp;
    return { ...p, x: p.x + p.nx * wobble, y: p.y + p.ny * wobble };
  });

const nearestIndex = (pts: EdgePoint[], score: (p: EdgePoint) => number): number => {
  let best = 0;
  let bestScore = Infinity;
  pts.forEach((p, i) => {
    const value = score(p);
    if (value < bestScore) {
      best = i;
      bestScore = value;
    }
  });
  return best;
};

const bite = (pts: EdgePoint[], centers: number[], radius: number): EdgePoint[] => {
  if (pts.length < 8) return pts;
  const spacing = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y) || 1;
  const rad = Math.max(2, radius);
  return pts.map((p, i) => {
    let depth = 0;
    for (const center of centers) {
      let d = Math.abs(i - center);
      d = Math.min(d, pts.length - d);
      const dist = d * spacing;
      if (dist < rad) depth = Math.max(depth, Math.sqrt(rad * rad - dist * dist));
    }
    if (depth <= 0) return p;
    return { ...p, x: p.x + p.nx * depth, y: p.y + p.ny * depth };
  });
};

/**
 * Even marks along each edge, including both ends. Shared corners collapse
 * to one dot, so a closed outline meets instead of leaving a gap at the join.
 */
const marksOnSegs = (segs: EdgeSeg[], radius: number, gap: number): string => {
  const marks: string[] = [];
  const seen = new Set<string>();
  const add = (p: EdgePoint) => {
    const key = `${Math.round(p.x)}:${Math.round(p.y)}`;
    if (seen.has(key)) return;
    seen.add(key);
    marks.push(`<circle cx="${n(p.x)}" cy="${n(p.y)}" r="${n(radius)}" fill="#000"/>`);
  };
  for (const seg of segs) {
    const steps = Math.max(1, Math.round(seg.len / Math.max(gap, 1)));
    for (let i = 0; i <= steps; i++) add(seg.at(i / steps));
  }
  return marks.join("");
};

/**
 * One rope strand. An integer number of twists per edge puts both strands
 * on the centerline at every corner, so the braid meets instead of kinking.
 */
const strandAlong = (segs: EdgeSeg[], amp: number, wavelength: number, phase: number): EdgePoint[] => {
  const pts: EdgePoint[] = [];
  const push = (p: EdgePoint) => {
    const last = pts[pts.length - 1];
    if (last && Math.hypot(last.x - p.x, last.y - p.y) < 0.45) return;
    pts.push(p);
  };
  for (const seg of segs) {
    const ratio = seg.len / wavelength;
    // Both strands must land on the centerline at each end. A short corner
    // arc stays the centerline; one forced twist there kinks the braid.
    const turns = ratio < 0.82 ? 0 : Math.max(1, Math.round(ratio));
    // A short corner still has to follow the arc. Two endpoints alone cut the chord.
    const samples = Math.max(Math.ceil(seg.len / 4), turns === 0 ? 2 : turns * 12);
    for (let i = 0; i <= samples; i++) {
      const u = i / samples;
      const base = seg.at(u);
      const wobble = Math.sin(u * turns * Math.PI * 2 + phase) * amp;
      push({ ...base, x: base.x + base.nx * wobble, y: base.y + base.ny * wobble });
    }
  }
  return pts;
};

type CornerFrame = { cx: number; cy: number; ux: number; uy: number; vx: number; vy: number };

/** One scroll, then the same ornament rotated 90° into each corner. */
const scrollSpiral = (frame: CornerFrame, radius: number, stroke: number): string => {
  const turns = 1.5;
  const steps = 48;
  const outer = -Math.PI * 0.75;
  const cmds: string[] = [];
  const place = (lx: number, ly: number, move: boolean) => {
    const x = frame.cx + lx * frame.ux + ly * frame.vx;
    const y = frame.cy + lx * frame.uy + ly * frame.vy;
    cmds.push(`${move ? "M" : "L"} ${n(x)} ${n(y)}`);
  };
  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    const a = outer - (1 - u) * turns * Math.PI * 2;
    const rad = radius * (0.14 + 0.86 * u);
    place(Math.cos(a) * rad, Math.sin(a) * rad, i === 0);
  }
  const tip = radius * 1.28;
  place(Math.cos(outer) * tip, Math.sin(outer) * tip, false);
  return `<path d="${cmds.join(" ")}" fill="none" stroke="#000" stroke-width="${n(Math.max(1.3, stroke))}" stroke-linecap="round" stroke-linejoin="round"/>`;
};

const leafPath = (p: EdgePoint, flip: number, len: number, wid: number): string => {
  const tx = p.ny * flip;
  const ty = -p.nx * flip;
  const x0 = p.x + p.nx * Math.min(2, len * 0.08);
  const y0 = p.y + p.ny * Math.min(2, len * 0.08);
  const tipx = x0 + p.nx * len;
  const tipy = y0 + p.ny * len;
  const c1x = x0 + p.nx * len * 0.5 + tx * wid;
  const c1y = y0 + p.ny * len * 0.5 + ty * wid;
  const c2x = x0 + p.nx * len * 0.42 - tx * wid * 0.72;
  const c2y = y0 + p.ny * len * 0.42 - ty * wid * 0.72;
  return `<path fill="#000" d="M ${n(x0)} ${n(y0)} Q ${n(c1x)} ${n(c1y)} ${n(tipx)} ${n(tipy)} Q ${n(c2x)} ${n(c2y)} ${n(x0)} ${n(y0)} Z"/>`;
};

const flowerMark = (p: EdgePoint, size: number): string => {
  const cx = p.x + p.nx * (size + 1.5);
  const cy = p.y + p.ny * (size + 1.5);
  const petals: string[] = [];
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
    const tipx = cx + Math.cos(a) * size;
    const tipy = cy + Math.sin(a) * size;
    const spread = 0.5;
    petals.push(
      `M ${n(cx)} ${n(cy)} Q ${n(cx + Math.cos(a - spread) * size * 0.55)} ${n(cy + Math.sin(a - spread) * size * 0.55)} ${n(tipx)} ${n(tipy)} Q ${n(cx + Math.cos(a + spread) * size * 0.55)} ${n(cy + Math.sin(a + spread) * size * 0.55)} ${n(cx)} ${n(cy)}`,
    );
  }
  return `<path fill="#000" d="${petals.join(" ")} Z"/>`;
};

const steppedCorner = (x: number, y: number, sx: number, sy: number, arm: number, step: number): string =>
  `M ${n(x)} ${n(y + sy * arm)} V ${n(y + sy * step * 2)} H ${n(x + sx * step)} V ${n(y + sy * step)} H ${n(x + sx * step * 2)} V ${n(y)} H ${n(x + sx * arm)}`;

const spacingOf = (pts: EdgePoint[]): number =>
  pts.length > 1 ? Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y) || 1 : 1;

/** Local x follows the edge; local y points inward, keeping ornaments on paper. */
const ornamentAt = (p: EdgePoint, size: number, body: string): string =>
  `<g transform="matrix(${n(p.ny * size)} ${n(-p.nx * size)} ${n(p.nx * size)} ${n(p.ny * size)} ${n(p.x)} ${n(p.y)})">${body}</g>`;

/** Space each straight edge independently, reserving room for adjacent corners. */
const spacedOrnaments = (
  w: number, h: number, pad: number, radius: number, shape: LabelShape, spacing: number, clearance: number,
): EdgePoint[] => {
  const segs = outlineSegs(w, h, pad, radius, shape);
  if (shape === "circle") {
    const count = Math.max(4, Math.round(segs[0].len / spacing));
    return Array.from({ length: count }, (_, i) => segs[0].at((i + 0.5) / count));
  }
  return segs.flatMap((seg) => {
    const a = seg.at(0), b = seg.at(1);
    if (Math.hypot(a.nx - b.nx, a.ny - b.ny) > 0.01 || seg.len < clearance * 2) return [];
    const usable = seg.len - clearance * 2;
    const count = Math.max(1, Math.round(usable / spacing));
    return Array.from({ length: count }, (_, i) => seg.at((clearance + usable * (i + 0.5) / count) / seg.len));
  });
};

const flowerOutline = (stroke: number): string => {
  const petals = Array.from({ length: 6 }, (_, i) =>
    `<ellipse cx="0" cy="-0.31" rx="0.16" ry="0.27" transform="rotate(${i * 60})" ${strokeAttr(stroke)}/>`);
  return `${petals.join("")}<circle cx="0" cy="0" r="0.12" fill="#000"/>`;
};

const starMark = (stroke: number): string =>
  `<path d="M 0 -0.65 Q 0.08 -0.08 0.5 0 Q 0.08 0.08 0 0.65 Q -0.08 0.08 -0.5 0 Q -0.08 -0.08 0 -0.65 Z" ${strokeAttr(stroke)}/>`;

/**
 * A frame drawn in the label's own pixel box. Circle stock gets a ring.
 * A transparent rect keeps the group the size of the paper so the stroke
 * stays inset instead of being scaled out to the edge.
 */
export const borderSvg = (
  kind: BorderKind,
  width: number,
  height: number,
  shape: LabelShape = "rect",
): string => {
  const w = Math.max(16, width);
  const h = Math.max(16, height);
  const minSide = Math.min(w, h);
  const stroke = Math.max(2, minSide * 0.012);
  const inset = Math.max(8, minSide * 0.04);
  const pad = inset + stroke / 2;
  const paperRadius = Math.max(6, Math.round(minSide * 0.12));
  const innerRadius = shape === "rounded_rect" ? Math.max(0, paperRadius - pad) : 0;
  const parts = [spacer(w, h)];

  if (kind === "line" || kind === "dashed" || kind === "dotted") {
    const dash = kind === "dashed" ? "dash" : kind === "dotted" ? "dot" : undefined;
    parts.push(outline(w, h, pad, innerRadius, shape, stroke, dash));
  } else if (kind === "double") {
    const gap = stroke * 2.8;
    parts.push(outline(w, h, pad, innerRadius, shape, stroke));
    const innerPad = pad + gap;
    const innerRad = shape === "rounded_rect" ? Math.max(0, innerRadius - gap) : 0;
    if (shape === "circle") {
      if (minSide / 2 - innerPad > stroke * 2) {
        parts.push(outline(w, h, innerPad, 0, shape, stroke));
      }
    } else if (w - innerPad * 2 > stroke * 4 && h - innerPad * 2 > stroke * 4) {
      parts.push(outline(w, h, innerPad, innerRad, shape, stroke));
    }
  } else if (kind === "corners") {
    const attr = strokeAttr(stroke);
    const paths =
      shape === "circle"
        ? circleArcs(w / 2, h / 2, Math.max(1, minSide / 2 - pad), 0.7)
        : cornerPaths(pad, pad, w - pad * 2, h - pad * 2, innerRadius);
    for (const d of paths) parts.push(`<path d="${d}" ${attr}/>`);
  } else if (kind === "banner") {
    if (shape === "circle") {
      const r = Math.max(1, minSide / 2 - pad);
      const band = Math.min(r * 0.32, Math.max(stroke * 3, minSide * 0.1));
      const ang = Math.acos(Math.min(1, Math.max(-1, (r - band) / r)));
      parts.push(circleCap(w / 2, h / 2, r, -Math.PI / 2, ang));
      parts.push(circleCap(w / 2, h / 2, r, Math.PI / 2, ang));
    } else {
      const innerW = w - pad * 2;
      const innerH = h - pad * 2;
      const band = Math.min(innerH * 0.22, Math.max(stroke * 3, minSide * 0.1));
      parts.push(bandPath(pad, pad, innerW, band, innerRadius, true));
      parts.push(bandPath(pad, h - pad - band, innerW, band, innerRadius, false));
    }
  } else if (kind === "diamonds") {
    const s = Math.max(stroke * 2.2, minSide * 0.045);
    if (shape === "circle") {
      const orbit = Math.max(0, minSide / 2 - pad - s * 0.35);
      for (const a of [Math.PI / 4, (Math.PI * 3) / 4, (Math.PI * 5) / 4, (Math.PI * 7) / 4]) {
        parts.push(diamond(w / 2 + orbit * Math.cos(a), h / 2 + orbit * Math.sin(a), s));
      }
    } else {
      const left = pad + s;
      const top = pad + s;
      const right = w - pad - s;
      const bottom = h - pad - s;
      parts.push(diamond(left, top, s), diamond(right, top, s), diamond(right, bottom, s), diamond(left, bottom, s));
    }
  } else if (kind === "scallop") {
    const amp = Math.max(stroke * 1.8, Math.min(minSide * 0.055, (minSide / 2 - pad) * 0.45));
    const attr = strokeAttr(Math.max(2, stroke * 0.85));
    if (shape === "circle") {
      const r = Math.max(amp + 4, minSide / 2 - pad);
      parts.push(pathFrom(circleScallop(w / 2, h / 2, r, Math.min(amp, r * 0.28)), attr));
    } else {
      parts.push(pathFrom(scallopPoints(pad, pad, w - pad * 2, h - pad * 2, amp, innerRadius), attr));
    }
  } else if (kind === "gallery") {
    const thick = Math.min(minSide * 0.05, Math.max(stroke * 3.4, 5));
    const centerPad = inset + thick / 2;
    const gap = Math.max(thick * 0.7, stroke * 2);
    const innerPad = centerPad + thick / 2 + gap + stroke;
    const thin = Math.max(1.4, stroke * 0.7);
    const outerRadius = shape === "rounded_rect" ? Math.max(0, paperRadius - centerPad) : 0;
    parts.push(outline(w, h, centerPad, outerRadius, shape, thick));
    const room = shape === "circle" ? minSide / 2 - innerPad : Math.min(w, h) - innerPad * 2;
    if (room > thin * 4) {
      const innerRad = shape === "rounded_rect" ? Math.max(0, paperRadius - innerPad) : 0;
      parts.push(outline(w, h, innerPad, innerRad, shape, thin));
    }
  } else if (kind === "deco") {
    const attr = strokeAttr(Math.max(stroke, 2));
    if (shape === "circle") {
      const r0 = Math.max(1, minSide / 2 - pad);
      const r1 = r0 - Math.max(stroke * 3.4, minSide * 0.035);
      for (const d of circleArcs(w / 2, h / 2, r0, 0.9)) parts.push(`<path d="${d}" ${attr}/>`);
      if (r1 > minSide * 0.12) {
        const thin = strokeAttr(Math.max(1.4, stroke * 0.75));
        for (const d of circleArcs(w / 2, h / 2, r1, 0.55)) parts.push(`<path d="${d}" ${thin}/>`);
      }
    } else if (shape === "rounded_rect") {
      for (const d of cornerPaths(pad, pad, w - pad * 2, h - pad * 2, innerRadius)) {
        parts.push(`<path d="${d}" ${attr}/>`);
      }
      const gap = Math.max(stroke * 3, minSide * 0.03);
      const thin = strokeAttr(Math.max(1.4, stroke * 0.75));
      for (const d of cornerPaths(pad + gap, pad + gap, w - (pad + gap) * 2, h - (pad + gap) * 2, Math.max(0, innerRadius - gap))) {
        parts.push(`<path d="${d}" ${thin}/>`);
      }
    } else {
      const step = Math.max(4, Math.min(w, h) * 0.045);
      const arm = Math.max(step * 2.6, Math.min(w, h) * 0.18);
      const corners: Array<[number, number, number, number]> = [
        [pad, pad, 1, 1],
        [w - pad, pad, -1, 1],
        [w - pad, h - pad, -1, -1],
        [pad, h - pad, 1, -1],
      ];
      for (const [x, y, sx, sy] of corners) {
        parts.push(`<path d="${steppedCorner(x, y, sx, sy, arm, step)}" ${attr}/>`);
      }
    }
  } else if (kind === "ticket") {
    const pts = walkOutline(w, h, pad, innerRadius, shape);
    if (pts.length > 8) {
      const notch = Math.min(minSide * 0.055, Math.max(5, stroke * 2.6));
      const cy = h / 2;
      const minX = Math.min(...pts.map((p) => p.x));
      const maxX = Math.max(...pts.map((p) => p.x));
      const left = nearestIndex(pts, (p) => Math.abs(p.x - minX) * 4 + Math.abs(p.y - cy));
      const right = nearestIndex(pts, (p) => Math.abs(p.x - maxX) * 4 + Math.abs(p.y - cy));
      parts.push(strokePath(bite(pts, [left, right], notch), strokeAttr(stroke), true));
    }
  } else if (kind === "bead") {
    parts.push(outline(w, h, pad, innerRadius, shape, Math.max(1.4, stroke * 0.65)));
    const bead = Math.max(2.1, Math.min(minSide * 0.018, stroke * 1.35));
    parts.push(marksOnSegs(outlineSegs(w, h, pad, innerRadius, shape), bead, bead * 3.6));
  } else if (kind === "rope") {
    const segs = outlineSegs(w, h, pad, innerRadius, shape).filter((seg) => seg.len > 0.5);
    if (segs.length > 0) {
      const amp = Math.max(2.2, Math.min(minSide * 0.026, (minSide / 2 - pad) * 0.3));
      const wavelength = Math.max(amp * 7, 12);
      const attr = strokeAttr(Math.max(1.6, stroke * 0.95));
      parts.push(strokePath(strandAlong(segs, amp, wavelength, 0), attr, true));
      parts.push(strokePath(strandAlong(segs, amp, wavelength, Math.PI), attr, true));
    }
  } else if (kind === "vine") {
    const pts = walkOutline(w, h, pad, innerRadius, shape);
    if (pts.length > 4) {
      const spacing = spacingOf(pts);
      const amp = Math.max(1.6, Math.min(minSide * 0.012, 8));
      const turns = Math.max(3, Math.round((pts.length * spacing) / Math.max(minSide * 0.9, 80)));
      const stem = wavePts(pts, amp, turns, 0.4);
      parts.push(strokePath(stem, strokeAttr(Math.max(1.5, stroke * 0.8)), true));
      const leafLen = Math.min(36, Math.max(14, minSide * 0.12));
      const ornaments = spacedOrnaments(w, h, pad, innerRadius, shape,
        Math.max(leafLen * 1.65, minSide * 0.2), leafLen);
      let placed = 0;
      for (const point of ornaments) {
        const index = nearestIndex(stem, (p) => Math.hypot(p.x - point.x, p.y - point.y));
        if (placed % 3 === 2) parts.push(flowerMark(stem[index], leafLen * 0.55));
        else parts.push(leafPath(stem[index], placed % 2 === 0 ? 1 : -1, leafLen, leafLen * 0.58));
        placed += 1;
      }
    }
  } else if (kind === "scroll") {
    parts.push(outline(w, h, pad, innerRadius, shape, Math.max(1.5, stroke * 0.8)));
    const room = Math.max(8, minSide / 2 - pad);
    const sR = Math.min(minSide * 0.085, Math.max(9, stroke * 4.5), room * 0.55);
    const spiralR = sR * 0.9;
    const sw = Math.max(1.3, stroke * 0.7);
    const wallGap = spiralR * 1.05;
    const inset =
      shape === "rounded_rect" ? Math.max(wallGap, innerRadius * 0.62 + spiralR * 0.72) : wallGap;
    const frames: CornerFrame[] =
      shape === "circle"
        ? [
            { ux: 1, uy: 0, vx: 0, vy: 1 },
            { ux: 0, uy: 1, vx: -1, vy: 0 },
            { ux: -1, uy: 0, vx: 0, vy: -1 },
            { ux: 0, uy: -1, vx: 1, vy: 0 },
          ].map((basis, index) => {
            // -3π/4, -π/4, π/4, 3π/4: the direction each rotated scroll points outward.
            const a = -Math.PI * 0.75 + index * (Math.PI / 2);
            const orbit = Math.max(spiralR * 0.45, room - spiralR * 1.5);
            return {
              ...basis,
              cx: w / 2 + Math.cos(a) * orbit,
              cy: h / 2 + Math.sin(a) * orbit,
            };
          })
        : [
            { cx: pad + inset, cy: pad + inset, ux: 1, uy: 0, vx: 0, vy: 1 },
            { cx: w - pad - inset, cy: pad + inset, ux: 0, uy: 1, vx: -1, vy: 0 },
            { cx: w - pad - inset, cy: h - pad - inset, ux: -1, uy: 0, vx: 0, vy: -1 },
            { cx: pad + inset, cy: h - pad - inset, ux: 0, uy: -1, vx: 1, vy: 0 },
          ];
    for (const frame of frames) parts.push(scrollSpiral(frame, spiralR, sw));
  } else if (kind === "stamp") {
    const dot = Math.max(1.25, Math.min(stroke * 0.7, minSide * 0.012));
    parts.push(marksOnSegs(outlineSegs(w, h, pad, innerRadius, shape), dot, dot * 2.7));
  } else if (kind === "engraved") {
    const gap = minSide * 0.035;
    parts.push(outline(w, h, pad, innerRadius, shape, stroke * 0.8));
    parts.push(outline(w, h, pad + gap, Math.max(0, innerRadius - gap), shape, stroke * 0.55));
    const size = minSide * 0.085;
    const ornamentPad = pad + gap + size * 1.2;
    const points: EdgePoint[] = shape === "circle"
      ? [0.125, 0.375, 0.625, 0.875].map((t) => {
          const a = t * Math.PI * 2;
          const r = minSide / 2 - ornamentPad;
          return edgePoint(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r, -Math.cos(a), -Math.sin(a));
        })
      : [
          edgePoint(ornamentPad, ornamentPad, 0, 1),
          edgePoint(w - ornamentPad, ornamentPad, 0, 1),
          edgePoint(w - ornamentPad, h - ornamentPad, 0, -1),
          edgePoint(ornamentPad, h - ornamentPad, 0, -1),
        ];
    for (const p of points) {
      const attr = strokeAttr(stroke / size * 0.65);
      const petals = Array.from({ length: 8 }, (_, i) =>
        `<path d="M 0 0 C -0.34 -0.35 -0.24 -0.85 0 -1 C 0.24 -0.85 0.34 -0.35 0 0" transform="rotate(${i * 45})" ${attr}/>`);
      parts.push(ornamentAt(p, size, `${petals.join("")}<circle r="0.16" fill="#000"/>`));
    }
  } else if (kind === "laurel" || kind === "meadow" || kind === "celestial") {
    const size = minSide * (kind === "laurel" ? 0.075 : 0.07);
    const framePad = pad + size * 0.65;
    const pts = spacedOrnaments(w, h, framePad, Math.max(innerRadius, size), shape,
      size * (kind === "laurel" ? 2.3 : 3.8), size * 1.25);
    parts.push(outline(w, h, framePad, Math.max(innerRadius, size), shape, stroke * 0.65));
    for (let index = 0; index < pts.length; index++) {
      const sw = stroke / size * 0.65;
      let body: string;
      if (kind === "laurel") {
        body = `<path d="M 0 0 Q -0.8 0.1 -1 0.85 Q -0.2 0.75 0 0 M 0 0 Q 0.8 0.1 1 0.85 Q 0.2 0.75 0 0" fill="#000"/><path d="M 0 0 V 0.6" ${strokeAttr(sw * 0.6)}/>`;
      } else if (kind === "meadow") {
        // Inset the leaf and head, but connect the stem to the frame. Stop its
        // round cap at the nearest petal: 0.25 + 1 - (0.31 + 0.27).
        const stemEnd = 0.67 - sw / 2;
        body = `<path d="M 0 0 V ${stemEnd.toFixed(3)}" ${strokeAttr(sw)}/><g transform="translate(0 0.25)"><g transform="translate(0 1)">${flowerOutline(sw * 0.85)}</g><path d="M 0 0.22 Q -0.28 -0.02 -0.66 0.12 Q -0.38 0.38 0 0.22 Z" fill="#000"/></g>`;
      } else if (index % 3 === 0) {
        body = `<path d="M 0.18 -0.55 A 0.58 0.58 0 1 0 0.18 0.55 Q -0.38 0 0.18 -0.55 Z" fill="#000"/>`;
      } else {
        body = starMark(sw);
      }
      parts.push(ornamentAt(pts[index], size, body));
    }
  } else if (kind === "nouveau") {
    const size = minSide * 0.095;
    const framePad = pad + size * 0.3;
    parts.push(outline(w, h, framePad, Math.max(innerRadius, size * 0.7), shape, stroke * 0.65));
    const segs = outlineSegs(w, h, framePad, Math.max(innerRadius, size * 0.7), shape);
    const pts = shape === "circle"
      ? [0.125, 0.375, 0.625, 0.875].map((t) => segs[0].at(t))
      : segs.filter((seg) => {
          const a = seg.at(0), b = seg.at(1);
          return Math.hypot(a.nx - b.nx, a.ny - b.ny) < 0.01 && seg.len > size * 3.4;
        }).map((seg) => seg.at(0.5));
    const sw = stroke / size * 0.7;
    const body = `<path d="M -1.7 0 C -0.9 0 -1.1 0.8 0 1.1 C 1.1 0.8 0.9 0 1.7 0 M -1.4 0.15 C -0.8 0.2 -0.5 0.8 0 1.1 C 0.5 0.8 0.8 0.2 1.4 0.15 M 0 1.1 C -0.7 0.65 -0.45 0.08 0 0 C 0.45 0.08 0.7 0.65 0 1.1 Z" ${strokeAttr(sw)}/><path d="M 0 0 Q -0.16 0.5 0 1.1 Q 0.16 0.5 0 0 Z" fill="#000"/>`;
    for (const p of pts) parts.push(ornamentAt(p, size, body));
  } else if (kind === "circuit") {
    const sw = Math.max(1.5, stroke * 0.65);
    const gap = Math.max(minSide * 0.021, sw * 3.8);
    const traceCount = Math.max(2, Math.min(5, Math.floor(minSide * 0.2 / gap) + 1));
    const trace = (pts: EdgePoint[], profile: number): string => {
      const traceWidth = sw * [0.8, 1.05, 0.9, 1.15, 0.85][profile];
      const viaRadius = sw * [1.15, 0.85, 1.35, 1, 0.95][profile];
      const ringWidth = sw * [0.7, 0.6, 0.85, 0.65, 0.75][profile];
      const via = (x: number, y: number) => `<circle cx="${n(x)}" cy="${n(y)}" r="${n(viaRadius)}" ${strokeAttr(ringWidth)}/>`;
      const start = pts[0], end = pts[pts.length - 1];
      const trim = (from: EdgePoint, toward: EdgePoint): EdgePoint => {
        const length = Math.hypot(toward.x - from.x, toward.y - from.y);
        const distance = Math.min(viaRadius + traceWidth / 2, length * 0.45);
        return { ...from, x: from.x + (toward.x - from.x) * distance / length,
          y: from.y + (toward.y - from.y) * distance / length };
      };
      const line = [trim(start, pts[1]), ...pts.slice(1, -1), trim(end, pts[pts.length - 2])];
      return strokePath(line, strokeAttr(traceWidth), false) + via(start.x, start.y) + via(end.x, end.y);
    };
    // Deliberate, repeatable irregularity; the two corners have distinct rhythms.
    const horizontalRuns = [[0.69, 0.46, 0.60, 0.35, 0.49], [0.46, 0.63, 0.34, 0.54, 0.40]];
    const verticalRuns = [[0.35, 0.54, 0.29, 0.43, 0.24], [0.53, 0.32, 0.46, 0.26, 0.38]];
    for (let corner = 0; corner < 2; corner++) {
      const traces: string[] = [];
      for (let i = 0; i < traceCount; i++) {
        const profile = (i + corner * 2) % 5;
        if (shape === "circle") {
          const r = minSide / 2 - pad - i * gap;
          const a0 = Math.PI * (0.82 + verticalRuns[corner][i] * 0.5);
          const a1 = Math.PI * (1.2 + horizontalRuns[corner][i]);
          const steps = Math.ceil((a1 - a0) / 0.12);
          const pts = Array.from({ length: steps + 1 }, (_, j) => {
            const a = a0 + (a1 - a0) * j / steps;
            return edgePoint(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r, 0, 0);
          });
          traces.push(trace(pts, profile));
        } else {
          const x = pad + i * gap;
          const y = pad + i * gap;
          const bend = Math.max(innerRadius, minSide * 0.09) + i * gap * 0.2;
          const startY = Math.max(h * verticalRuns[corner][i] * 0.88, y + bend + gap * 1.5);
          const endX = Math.max(w * horizontalRuns[corner][i] * 0.88, x + bend + gap * 2.5);
          const jogX = endX - minSide * 0.08;
          const jog = [0.3, 0, -0.25, 0.2, 0][(i + corner) % 5] * gap;
          traces.push(trace([
            edgePoint(x, startY, 0, 0), edgePoint(x, y + bend, 0, 0),
            edgePoint(x + bend, y, 0, 0), edgePoint(jogX - Math.abs(jog), y, 0, 0),
            edgePoint(jogX, y + jog, 0, 0), edgePoint(endX, y + jog, 0, 0),
          ].filter((p, j, pts) => j === 0 || Math.hypot(p.x - pts[j - 1].x, p.y - pts[j - 1].y) > 0.01), profile));
        }
      }
      parts.push(`<g${corner === 1 ? ` transform="translate(${n(w)} ${n(h)}) rotate(180)"` : ""}>${traces.join("")}</g>`);
    }
  } else if (kind === "schematic") {
    const size = minSide * 0.065;
    const segs = outlineSegs(w, h, pad + size * 0.5, innerRadius, shape);
    let index = 0;
    for (const seg of segs) {
      if (seg.len < size * 3) {
        parts.push(strokePath(Array.from({ length: 16 }, (_, k) => seg.at(k / 15)), strokeAttr(stroke * 0.7), false));
        continue;
      }
      const count = Math.max(1, Math.floor(seg.len / (size * 7)));
      for (let j = 0; j < count; j++, index++) {
        const center = (j + 0.5) / count;
        const half = Math.min(0.38 / count, size * 1.25 / Math.max(1, seg.len));
        const before = Array.from({ length: 12 }, (_, k) => seg.at(j / count + (center - half - j / count) * k / 11));
        const after = Array.from({ length: 12 }, (_, k) => seg.at(center + half + ((j + 1) / count - center - half) * k / 11));
        parts.push(strokePath(before, strokeAttr(stroke * 0.7), false));
        parts.push(strokePath(after, strokeAttr(stroke * 0.7), false));
        const actualSize = half * seg.len / 1.25;
        const sw = stroke * 0.7 / Math.max(1, actualSize);
        const body = index % 3 === 1
          ? `<path d="M -1.25 0 H -0.22 M -0.22 -0.55 V 0.55 M 0.22 -0.55 V 0.55 M 0.22 0 H 1.25" ${strokeAttr(sw)}/>`
          : `<path d="M -1.25 0 H -0.9 L -0.7 -0.35 L -0.35 0.35 L 0 -0.35 L 0.35 0.35 L 0.7 -0.35 L 0.9 0 H 1.25" ${strokeAttr(sw)}/>`;
        parts.push(ornamentAt(seg.at(center), actualSize, body));
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${n(w)}" height="${n(h)}" viewBox="0 0 ${n(w)} ${n(h)}" fill="none">${parts.join("")}</svg>`;
};
