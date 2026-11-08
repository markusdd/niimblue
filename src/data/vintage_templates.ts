import type { DesignFormat, DesignLanguage, DesignScene, DesignElement } from "./design_templates";
import { vintageFrameSvg, type VintageFrameKind } from "../utils/vintage_frames";
import type { BundledFontFamily } from "./bundled_fonts";

/** Original, type-led compositions built around the vintage frame collection. */
export const VINTAGE_DESIGNS = [
  { id: "vintage-pantry", collection: "vintage", frame: "cartouche", en: "Spice cabinet", de: "Gewürzkabinett" },
  { id: "vintage-atelier", collection: "vintage", frame: "cameo", en: "Atelier scent", de: "Atelierduft" },
  {
    id: "vintage-preserves",
    collection: "vintage",
    frame: "ribbon-plaque",
    en: "Homemade preserves",
    de: "Eingemachtes",
  },
  {
    id: "vintage-keepsake",
    collection: "vintage",
    frame: "scroll-plaque",
    en: "A little keepsake",
    de: "Kleine Erinnerung",
  },
] as const;
export type VintageDesignId = (typeof VINTAGE_DESIGNS)[number]["id"];
export function isVintageDesign(id: string): id is VintageDesignId {
  return VINTAGE_DESIGNS.some((item) => item.id === id);
}
const copy = {
  "vintage-pantry": {
    en: ["THE PANTRY COLLECTION", "Cinnamon", "Warm & fragrant", "HERBS · SPICES · SEEDS"],
    de: ["VORRATSKOLLEKTION", "Zimt", "Warm & duftend", "KRÄUTER · GEWÜRZE"],
  },
  "vintage-atelier": {
    en: ["ATELIER No. 04", "Fleur", "Blossoms & botanicals", "EAU DE JARDIN"],
    de: ["ATELIER Nr. 04", "Fleur", "Blüten & Botanik", "EAU DE JARDIN"],
  },
  "vintage-preserves": {
    en: ["HOMEMADE PRESERVES", "Apricot", "Fruit from the garden", "SMALL BATCH · MADE WITH CARE"],
    de: ["HAUSGEMACHT", "Aprikose", "Früchte aus dem Garten", "MIT LIEBE EINGEKOCHT"],
  },
  "vintage-keepsake": {
    en: ["A LITTLE TREASURE", "Keepsake", "For someone special", "WITH LOVE"],
    de: ["EIN KLEINER SCHATZ", "Andenken", "Für einen lieben Menschen", "VON HERZEN"],
  },
} as const;

type Text = Extract<DesignElement, { kind: "text" }>;
function text(
  value: string,
  x: number,
  y: number,
  width: number,
  height: number,
  size: number,
  family: BundledFontFamily,
  options: { weight?: number; italic?: boolean; spacing?: number } = {},
): Text {
  return { kind: "text", text: value, x, y, width, height, size, family, ...options };
}
function divider(x: number, y: number, width: number, ornate: boolean): DesignElement {
  const dots = ornate ? `<circle cx=".6" cy=".45" r=".3"/><circle cx="${width - 0.6}" cy=".45" r=".3"/>` : "";
  return {
    kind: "svg",
    name: "Vintage divider",
    x,
    y,
    width,
    height: 0.9,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height=".9" viewBox="0 0 ${width} .9" fill="black"><path d="M ${ornate ? 2 : 0.2} .45 H ${width - (ornate ? 2 : 0.2)}" stroke="black" stroke-width=".17"/>${dots}</svg>`,
  };
}
export function vintageDesignScene(id: VintageDesignId, format: DesignFormat, language: DesignLanguage): DesignScene {
  const info = VINTAGE_DESIGNS.find((item) => item.id === id)!;
  const { width: w, height: h, shape } = format;
  const [header, title, subtitle, footer] = copy[id][language];
  const round = shape === "circle",
    portrait = !round && h > w * 1.15;
  const unit = Math.min(w, h);
  const elements: DesignElement[] = [
    {
      kind: "svg",
      role: "frame",
      name: info.frame,
      svg: vintageFrameSvg(info.frame as VintageFrameKind, w * 12, h * 12, shape),
      x: 0,
      y: 0,
      width: w,
      height: h,
    },
  ];
  const book = id === "vintage-pantry" || id === "vintage-preserves";
  const family = book ? "NiimBlue Book" : "NiimBlue Serif";
  const titleStyle = { italic: id === "vintage-atelier" || id === "vintage-keepsake", weight: book ? 700 : 400 };
  const contentWidth = round ? 0.66 : portrait ? (info.frame === "scroll-plaque" ? 0.54 : 0.65) : 0.67;
  const left = ((1 - contentWidth) * w) / 2;
  const width = contentWidth * w;
  const headerY = round ? 0.255 : portrait ? 0.27 : 0.22;
  const titleY = round ? 0.385 : portrait ? 0.385 : 0.345;
  const subtitleY = round ? 0.56 : portrait ? 0.56 : 0.6;
  const footerY = round ? 0.73 : portrait ? 0.73 : info.frame === "scroll-plaque" ? 0.7 : 0.765;
  elements.push(
    text(header, left, h * headerY, width, unit * 0.095, unit * 0.052, "NiimBlue Condensed", { spacing: 110 }),
  );
  elements.push(
    text(title, left, h * titleY, width, unit * 0.22, unit * (portrait ? 0.18 : 0.155), family, titleStyle),
  );
  elements.push(
    text(subtitle, left, h * subtitleY, width, unit * 0.105, unit * 0.06, "NiimBlue Serif", { italic: true }),
  );
  if (info.frame !== "scroll-plaque")
    elements.push(divider(w * 0.34, h * (portrait ? 0.665 : 0.7), w * 0.32, id === "vintage-preserves"));
  elements.push(
    text(footer, left + width * 0.07, h * footerY, width * 0.86, unit * 0.085, unit * 0.043, "NiimBlue Condensed", {
      spacing: 60,
    }),
  );
  return { width: w, height: h, shape, elements };
}
