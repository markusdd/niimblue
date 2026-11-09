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
  {
    id: "vintage-royal",
    collection: "vintage",
    frame: "royal-crest",
    en: "Royal herbarium",
    de: "Königliches Herbarium",
  },
  { id: "vintage-acanthus", collection: "vintage", frame: "acanthus", en: "Acanthus garden", de: "Akanthusgarten" },
  { id: "vintage-laurel", collection: "vintage", frame: "laurel-plaque", en: "Laurel reserve", de: "Lorbeer-Reserve" },
  { id: "vintage-fleur", collection: "vintage", frame: "fleur-scroll", en: "Fleur de maison", de: "Blüte des Hauses" },
  { id: "vintage-filigree", collection: "vintage", frame: "filigree", en: "The silver garden", de: "Silbergarten" },
  {
    id: "vintage-rose",
    collection: "vintage",
    frame: "rose-cartouche",
    en: "Rosewater no. 7",
    de: "Rosenwasser Nr. 7",
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
  "vintage-royal": {
    en: ["THE ROYAL HERBARIUM", "Rosemary", "Gathered at dawn", "EST. IN THE GARDEN"],
    de: ["KÖNIGLICHES HERBARIUM", "Rosmarin", "Im Morgentau gesammelt", "AUS DEM GARTEN"],
  },
  "vintage-acanthus": {
    en: ["HORTUS · BOTANICALS", "Basil", "Leaves for the table", "GROWN WITH PATIENCE"],
    de: ["HORTUS · BOTANIK", "Basilikum", "Blätter für die Tafel", "MIT GEDULD GEZOGEN"],
  },
  "vintage-laurel": {
    en: ["LAUREL HOUSE", "Laurel", "A fragrant kitchen garden", "PICKED BY HAND"],
    de: ["LORBEERHAUS", "Lorbeer", "Duft aus dem Küchengarten", "VON HAND GEPFLÜCKT"],
  },
  "vintage-fleur": {
    en: ["FLEUR DE MAISON", "Rose", "Softly gathered", "BOTANICAL · No. 12"],
    de: ["FLEUR DE MAISON", "Rosen", "Sanft gesammelt", "BOTANIK · Nr. 12"],
  },
  "vintage-filigree": {
    en: ["THE SILVER GARDEN", "Violet", "Small-batch flower syrup", "FLOWERS · FRUIT · SUGAR"],
    de: ["DER SILBERGARTEN", "Veilchen", "Blütensirup, handgemacht", "BLÜTEN · FRUCHT · ZUCKER"],
  },
  "vintage-rose": {
    en: ["EAU DE ROSE · No. 7", "Rose", "Distilled in small batches", "FOR HOME & LINEN"],
    de: ["ROSENWASSER · Nr. 7", "Rose", "Schonend destilliert", "FÜR HAUS & LEINEN"],
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
  const titleStyle = {
    italic: id === "vintage-atelier" || id === "vintage-keepsake" || id === "vintage-fleur" || id === "vintage-rose",
    weight: book ? 700 : 400,
  };
  const newFrame =
    info.frame === "royal-crest" ||
    info.frame === "acanthus" ||
    info.frame === "laurel-plaque" ||
    info.frame === "fleur-scroll" ||
    info.frame === "filigree" ||
    info.frame === "rose-cartouche";
  const narrowFrame =
    info.frame === "scroll-plaque" || info.frame === "fleur-scroll" || info.frame === "rose-cartouche";
  const contentWidth = newFrame
    ? round
      ? 0.62
      : portrait
        ? narrowFrame
          ? 0.53
          : 0.64
        : 0.66
    : round
      ? 0.66
      : portrait
        ? info.frame === "scroll-plaque"
          ? 0.54
          : 0.65
        : 0.67;
  const left = ((1 - contentWidth) * w) / 2;
  const width = contentWidth * w;
  const headerY = newFrame ? 0.29 : round ? 0.255 : portrait ? 0.27 : 0.22;
  const titleY = newFrame ? 0.38 : round ? 0.385 : portrait ? 0.385 : 0.345;
  const subtitleY = newFrame ? 0.57 : round ? 0.56 : portrait ? 0.56 : 0.6;
  const footerY = newFrame ? 0.68 : round ? 0.73 : portrait ? 0.73 : info.frame === "scroll-plaque" ? 0.7 : 0.765;
  const lowerRuleY = portrait ? 0.665 : 0.7;
  const rightBiased = info.frame === "laurel-plaque" || info.frame === "filigree";
  const frameFontScale = narrowFrame ? 0.92 : 1;
  const titleScale = narrowFrame ? 0.1 : portrait ? 0.16 : 0.145;
  const copyX = left + (rightBiased ? width * 0.035 : 0);
  elements.push(
    text(
      header,
      copyX,
      h * headerY,
      width * (rightBiased ? 0.93 : 1),
      unit * 0.095,
      newFrame ? unit * 0.047 * frameFontScale : unit * 0.052,
      "NiimBlue Condensed",
      { spacing: newFrame ? 95 : 110 },
    ),
  );
  elements.push(
    text(
      title,
      copyX,
      h * titleY,
      width * (newFrame && rightBiased ? 0.93 : 1),
      unit * 0.22,
      newFrame ? unit * titleScale * frameFontScale : unit * (portrait ? 0.18 : 0.155),
      family,
      titleStyle,
    ),
  );
  elements.push(
    text(
      subtitle,
      copyX,
      h * subtitleY,
      width * (rightBiased ? 0.93 : 1),
      newFrame ? unit * 0.11 : unit * 0.105,
      newFrame ? unit * 0.052 * frameFontScale : unit * 0.06,
      "NiimBlue Serif",
      { italic: true },
    ),
  );
  if (!newFrame && info.frame !== "scroll-plaque")
    elements.push(
      divider(
        w * (newFrame ? 0.35 : 0.34),
        h * lowerRuleY,
        w * (newFrame ? 0.3 : 0.32),
        id === "vintage-preserves" || id === "vintage-laurel",
      ),
    );
  elements.push(
    text(
      footer,
      newFrame ? copyX + width * 0.04 : left + width * 0.07,
      h * footerY,
      width * (newFrame ? 0.84 : 0.86),
      newFrame ? unit * 0.09 : unit * 0.085,
      newFrame ? unit * 0.039 * frameFontScale : unit * 0.043,
      "NiimBlue Condensed",
      { spacing: 60 },
    ),
  );
  return { width: w, height: h, shape, elements };
}
