import type { DecorativeOrnament } from "./decorative_ornaments";

/** Standalone Art Deco corner details, drawn to work as individual rotated ornaments. */
const svg = (drawing: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none" stroke="#000" stroke-width="1.8" stroke-linecap="square" stroke-linejoin="miter">${drawing}</svg>`;

const path = (d: string, fill = "none") => `<path d="${d}" fill="${fill}"/>`;
const line = (x1: number, y1: number, x2: number, y2: number) =>
  `<path d="M ${Math.round(x1 * 1000) / 1000} ${Math.round(y1 * 1000) / 1000} L ${Math.round(x2 * 1000) / 1000} ${Math.round(y2 * 1000) / 1000}"/>`;
const circle = (cx: number, cy: number, r: number, fill = "none") =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`;
const diamond = (cx: number, cy: number, rx: number, ry: number) =>
  path(`M ${cx} ${cy - ry} L ${cx + rx} ${cy} L ${cx} ${cy + ry} L ${cx - rx} ${cy} Z`);

const fan =
  path("M 8 112 L 8 8 L 112 8") +
  path("M 15 105 L 15 15 L 105 15") +
  // A quarter-circle fan centered at the elbow. Every spoke lands on the same arc.
  path("M 15 63 A 48 48 0 0 0 63 15") +
  Array.from({ length: 7 }, (_, i) => {
    const angle = (i * Math.PI) / 12;
    return line(15, 15, 15 + 48 * Math.cos(angle), 15 + 48 * Math.sin(angle));
  }).join("") +
  diamond(15, 15, 4, 4);

const stepped =
  path("M 9 111 L 9 9 L 111 9 M 16 104 L 16 16 L 104 16") +
  path("M 25 95 L 25 25 L 95 25") +
  // Repeated square shoulders keep the stepped rhythm equal on both arms.
  path("M 25 72 L 32 72 L 32 32 L 72 32 L 72 25") +
  path("M 25 58 L 39 58 L 39 39 L 58 39 L 58 25") +
  diamond(32, 32, 3.5, 3.5);

const orbit =
  path("M 9 111 L 9 9 L 111 9 M 16 104 L 16 16 L 104 16") +
  path("M 16 58 A 42 42 0 0 0 58 16 M 16 48 A 32 32 0 0 0 48 16 M 16 38 A 22 22 0 0 0 38 16") +
  circle(16, 16, 3.2) +
  diamond(58, 16, 4, 6) +
  diamond(16, 58, 6, 4);

const diamondCorner =
  path("M 9 111 L 9 9 L 111 9 M 16 104 L 16 16 L 104 16") +
  diamond(34, 34, 17, 17) +
  diamond(34, 34, 9, 9) +
  path("M 34 9 L 34 17 M 9 34 L 17 34 M 51 34 L 72 34 M 34 51 L 34 72") +
  diamond(72, 34, 4, 4) +
  diamond(34, 72, 4, 4);

const fluted =
  path("M 9 111 L 9 9 L 111 9 M 16 104 L 16 16 L 104 16") +
  // Four nested quarter arcs with four matching radial ribs.
  path(
    "M 16 72 A 56 56 0 0 0 72 16 M 16 60 A 44 44 0 0 0 60 16 M 16 48 A 32 32 0 0 0 48 16 M 16 36 A 20 20 0 0 0 36 16",
  ) +
  path("M 16 16 L 72 16 M 16 16 L 64.5 44 M 16 16 L 44 64.5 M 16 16 L 16 72") +
  circle(16, 16, 3.5, "#000");

const arcade =
  path("M 9 111 L 9 9 L 111 9 M 16 104 L 16 16 L 104 16") +
  // Concentric quarter arches rise from matching vertical and horizontal piers.
  path("M 16 91 L 16 58 A 42 42 0 0 1 58 16 L 91 16") +
  path("M 25 91 L 25 58 A 33 33 0 0 1 58 25 L 91 25") +
  path("M 34 91 L 34 58 A 24 24 0 0 1 58 34 L 91 34") +
  diamond(16, 91, 4, 5) +
  diamond(91, 16, 5, 4) +
  circle(49, 49, 4);

const item = (id: string, name: string, drawing: string, keywords: string): DecorativeOrnament => ({
  id,
  name,
  keywords: `${keywords} art deco artdeco corner frame ecke rahmen ornament geometric geometry`,
  viewBox: "0 0 120 120",
  svg: svg(drawing),
  collection: "artdeco",
});

export const DECO_CORNER_ORNAMENTS: DecorativeOrnament[] = [
  item("deco-fan-corner", "Sunburst fan corner", fan, "sunburst fan rays fächer sonne"),
  item("deco-stepped-corner", "Stepped corner", stepped, "stepped geometric stair treppe"),
  item("deco-orbit-corner", "Orbit corner", orbit, "orbit arcs rings kreis"),
  item("deco-diamond-corner", "Diamond corner", diamondCorner, "diamond lozenge rhombus raute"),
  item("deco-fluted-corner", "Fluted corner", fluted, "fluted ribs fan gerippt"),
  item("deco-arcade-corner", "Arcade corner", arcade, "arcade arch arches bogen"),
];
