import { CYBER_DESIGNS, isCyberDesign, cyberDesignScene } from "./cyber_templates";
import { DECO_DESIGNS, isDecoDesign, decoDesignScene } from "./deco_templates";
import { VINTAGE_DESIGNS, isVintageDesign, vintageDesignScene } from "./vintage_templates";
import type { BundledFontFamily } from "./bundled_fonts";
import type { LabelProps, LabelShape } from "../types";
import { pxToMm } from "../utils/label_units";
import { BOTANICAL_ORNAMENTS } from "./botanical_ornaments";

/** Original editable designs. Future technical/modern collections use this catalogue too. */
const BOTANICAL_DESIGNS = [
  {
    id: "pantry",
    collection: "botanical",
    ornament: "olive-sprig",
    en: "Botanical pantry",
    de: "Botanische Vorratskammer",
  },
  { id: "lavender", collection: "botanical", ornament: "lavender-stem", en: "Lavender", de: "Lavendel" },
  { id: "citrus", collection: "botanical", ornament: "citrus-branch", en: "Citrus garden", de: "Zitrusgarten" },
  {
    id: "apothecary",
    collection: "botanical",
    ornament: "rosemary-sprig",
    en: "Vintage apothecary",
    de: "Alte Apotheke",
  },
  { id: "floral", collection: "botanical", ornament: "wildflower-spray", en: "Floral gift", de: "Blumengruß" },
  { id: "artisan", collection: "botanical", ornament: "rosemary-sprig", en: "Minimal artisan", de: "Handgemacht" },
  { id: "fern-study", collection: "botanical", ornament: "fern-frond", en: "Fern study", de: "Farnstudie" },
  {
    id: "eucalyptus-note",
    collection: "botanical",
    ornament: "eucalyptus-stem",
    en: "Eucalyptus note",
    de: "Eukalyptusgruß",
  },
  { id: "berry-harvest", collection: "botanical", ornament: "berry-branch", en: "Berry harvest", de: "Beerenernte" },
  { id: "poppy-field", collection: "botanical", ornament: "poppy-stem", en: "Poppy field", de: "Mohnwiese" },
] as const;
export const DESIGN_TEMPLATES = [...BOTANICAL_DESIGNS, ...VINTAGE_DESIGNS, ...DECO_DESIGNS, ...CYBER_DESIGNS] as const;
export type DesignId = (typeof DESIGN_TEMPLATES)[number]["id"];
export type DesignLanguage = "en" | "de";
export interface DesignFormat {
  id: string;
  width: number;
  height: number;
  shape: LabelShape;
}
export const DESIGN_FORMATS: readonly DesignFormat[] = [
  { id: "landscape", width: 50, height: 30, shape: "rect" },
  { id: "portrait", width: 40, height: 60, shape: "rect" },
  { id: "round", width: 40, height: 40, shape: "circle" },
];

export type DesignElement =
  | {
      kind: "text";
      text: string;
      x: number;
      y: number;
      width: number;
      height: number;
      size: number;
      serif?: boolean;
      family?: BundledFontFamily;
      align?: "left" | "center" | "right";
      weight?: number;
      italic?: boolean;
      spacing?: number;
    }
  | {
      kind: "svg";
      svg: string;
      name: string;
      role?: "frame" | "illustration";
      x: number;
      y: number;
      width: number;
      height: number;
      flipX?: boolean;
      flipY?: boolean;
    };
export interface DesignScene {
  width: number;
  height: number;
  shape: LabelShape;
  elements: DesignElement[];
}

const text = (
  text: string,
  x: number,
  y: number,
  width: number,
  height: number,
  size: number,
  serif = false,
  italic = false,
  spacing = 0,
): DesignElement => ({ kind: "text", text, x, y, width, height, size, serif, italic, spacing });
const svg = (body: string, width: number, height: number) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${body}</svg>`;
const stroke = 'fill="none" stroke="black" stroke-width="0.19" stroke-linecap="round" stroke-linejoin="round"';
function line(x: number, y: number, width: number): DesignElement {
  return {
    kind: "svg",
    name: "Fine divider",
    x,
    y,
    width,
    height: 0.4,
    svg: svg(`<path d="M 0 .2 H ${width}" ${stroke}/>`, width, 0.4),
  };
}
function ornament(
  id: string,
  x: number,
  y: number,
  width: number,
  height: number,
  flipX = false,
  flipY = false,
): DesignElement {
  const item = BOTANICAL_ORNAMENTS.find((entry) => entry.id === id)!;
  const [, , vw, vh] = item.viewBox.split(" ").map(Number);
  const scale = Math.min(width / vw, height / vh);
  return {
    kind: "svg",
    // Keep fine linework printable when a round layout needs a smaller sprig.
    svg: item.svg.replace('stroke-width="1.65"', `stroke-width="${Math.max(1.65, 0.16 / scale)}"`),
    name: item.name,
    x: x + (width - vw * scale) / 2,
    y: y + (height - vh * scale) / 2,
    width: vw * scale,
    height: vh * scale,
    flipX,
    flipY,
  };
}
function outline(width: number, height: number, shape: LabelShape, ornate = false): DesignElement {
  const inset = 2.2;
  const body =
    shape === "circle"
      ? `<circle cx="${width / 2}" cy="${height / 2}" r="${width / 2 - inset}" ${stroke}/>`
      : ornate
        ? `<path d="M ${inset + 3} ${inset} H ${width - inset - 3} Q ${width - inset - 3} ${inset + 3} ${width - inset} ${inset + 3} V ${height - inset - 3} Q ${width - inset - 3} ${height - inset - 3} ${width - inset - 3} ${height - inset} H ${inset + 3} Q ${inset + 3} ${height - inset - 3} ${inset} ${height - inset - 3} V ${inset + 3} Q ${inset + 3} ${inset + 3} ${inset + 3} ${inset} Z" ${stroke}/>`
        : `<rect x="${inset}" y="${inset}" width="${width - inset * 2}" height="${height - inset * 2}" rx="${shape === "rounded_rect" ? 2 : 0}" ${stroke}/>`;
  return { kind: "svg", svg: svg(body, width, height), name: "Fine outline", x: 0, y: 0, width, height };
}

const COPY = {
  pantry: {
    en: ["THE LITTLE PANTRY", "Basil", "Garden herbs", "HERBS & SPICES"],
    de: ["VORRATSKAMMER", "Basilikum", "Aus dem Garten", "KRÄUTER & GEWÜRZE"],
  },
  lavender: {
    en: ["BOTANICAL COLLECTION", "Lavender", "A little moment of calm", "FLOWERS · LEAVES · SCENT"],
    de: ["BOTANISCHE SAMMLUNG", "Lavendel", "Ein kleiner Moment Ruhe", "BLÜTEN · BLÄTTER · DUFT"],
  },
  citrus: {
    en: ["FROM THE GARDEN", "Lemon", "Fresh & fragrant", "CITRUS COLLECTION"],
    de: ["AUS DEM GARTEN", "Zitrone", "Frisch & duftend", "ZITRUSKOLLEKTION"],
  },
  apothecary: {
    en: ["BOTANICAL No. 01", "Rosemary", "Leaves & blossoms", "THE HERB CABINET"],
    de: ["BOTANIK Nr. 01", "Rosmarin", "Blätter & Blüten", "DIE KRÄUTERAPOTHEKE"],
  },
  floral: {
    en: ["A LITTLE SOMETHING", "For you", "With love", "MADE TO MAKE YOU SMILE"],
    de: ["EINE KLEINIGKEIT", "Für dich", "Von Herzen", "FÜR EIN KLEINES LÄCHELN"],
  },
  artisan: {
    en: ["SMALL BATCH", "Handmade", "Made with care", "CRAFTED WITH CARE"],
    de: ["KLEINE MANUFAKTUR", "Handgemacht", "Mit Liebe gemacht", "MIT SORGFALT GEFERTIGT"],
  },
  "fern-study": {
    en: ["FIELD NOTES · 04", "Fern & Moss", "Collected in the woodland", "BOTANICAL STUDY"],
    de: ["FELDNOTIZEN · 04", "Farn & Moos", "Im Wald gesammelt", "BOTANISCHE STUDIE"],
  },
  "eucalyptus-note": {
    en: ["A QUIET MOMENT", "Eucalyptus", "Fresh leaves, slow living", "GARDEN · HOME · CALM"],
    de: ["EIN STILLER MOMENT", "Eukalyptus", "Frische Blätter, Ruhe finden", "GARTEN · HAUS · RUHE"],
  },
  "berry-harvest": {
    en: ["LATE SUMMER · No. 8", "Wild Berries", "Picked along the hedgerow", "SMALL GARDEN HARVEST"],
    de: ["SPÄTSOMMER · Nr. 8", "Wilde Beeren", "Von der Hecke gepflückt", "KLEINE GARTENERNTE"],
  },
  "poppy-field": {
    en: ["MEADOW FLOWERS", "Poppy Seed", "Gathered beneath open skies", "SEED · FLOWER · FIELD"],
    de: ["WIESENBLUMEN", "Mohnsamen", "Unter freiem Himmel gesammelt", "SAMEN · BLÜTE · FELD"],
  },
} as const;

const editableText = (
  value: string,
  x: number,
  y: number,
  width: number,
  height: number,
  size: number,
  family: BundledFontFamily,
  italic = false,
  spacing = 0,
): DesignElement => ({ kind: "text", text: value, x, y, width, height, size, family, italic, spacing });

/** New herbarium compositions use offset sprigs and leave a deliberate text field. */
function asymmetricBotanicalScene(
  id: (typeof BOTANICAL_DESIGNS)[number]["id"],
  ornamentId: string,
  copy: readonly [string, string, string, string],
  format: DesignFormat,
): DesignScene {
  const { width: w, height: h, shape } = format;
  const round = shape === "circle";
  const portrait = !round && h > w * 1.15;
  const unit = Math.min(w, h);
  const elements: DesignElement[] = [];
  const [eyebrow, title, subtitle, footer] = copy;
  if (round) {
    elements.push(outline(w, h, shape));
    // The paired placements deliberately cross the diagonal instead of forming a symmetrical wreath.
    elements.push(
      ornament(
        id === "fern-study" ? "fern-corner" : ornamentId,
        w * 0.16,
        h * 0.16,
        w * 0.17,
        h * 0.2,
        id !== "eucalyptus-note",
      ),
    );
    elements.push(
      ornament(id === "poppy-field" ? "cosmos-stem" : ornamentId, w * 0.65, h * 0.64, w * 0.17, h * 0.2, true, true),
    );
    elements.push(
      editableText(eyebrow, w * 0.33, h * 0.215, w * 0.44, h * 0.07, unit * 0.039, "NiimBlue Condensed", false, 75),
    );
    elements.push(editableText(title, w * 0.16, h * 0.375, w * 0.68, h * 0.145, unit * 0.1, "NiimBlue Serif", true));
    elements.push(
      editableText(subtitle, w * 0.21, h * 0.535, w * 0.58, h * 0.095, unit * 0.044, "NiimBlue Serif", true),
    );
    elements.push(line(w * 0.38, h * 0.68, w * 0.24));
    elements.push(
      editableText(footer, w * 0.2, h * 0.78, w * 0.44, h * 0.065, unit * 0.032, "NiimBlue Condensed", false, 35),
    );
  } else if (portrait) {
    // A small upper corner and low opposite sprig frame a tall, open copy column.
    elements.push(
      ornament(
        id === "poppy-field" ? "asymmetric-side-spray" : ornamentId,
        w * 0.64,
        h * 0.055,
        w * 0.3,
        h * 0.235,
        id !== "berry-harvest",
      ),
    );
    elements.push(
      ornament(id === "fern-study" ? "seedhead-grass" : ornamentId, w * 0.02, h * 0.73, w * 0.18, h * 0.2, true, true),
    );
    elements.push(
      editableText(eyebrow, w * 0.15, h * 0.335, w * 0.7, h * 0.06, unit * 0.039, "NiimBlue Condensed", false, 75),
    );
    elements.push(editableText(title, w * 0.12, h * 0.435, w * 0.76, h * 0.14, unit * 0.11, "NiimBlue Serif", true));
    elements.push(editableText(subtitle, w * 0.16, h * 0.595, w * 0.68, h * 0.1, unit * 0.049, "NiimBlue Serif", true));
    elements.push(line(w * 0.31, h * 0.745, w * 0.38));
    elements.push(
      editableText(footer, w * 0.2, h * 0.82, w * 0.6, h * 0.06, unit * 0.034, "NiimBlue Condensed", false, 35),
    );
  } else {
    // Landscape copy sits to the left of one tall, offset illustration.
    const artOnLeft = id === "berry-harvest" || id === "poppy-field";
    const artX = artOnLeft ? w * 0.035 : w * 0.78;
    const textX = artOnLeft ? w * 0.3 : w * 0.09;
    const textW = w * 0.64;
    elements.push(
      ornament(ornamentId, artX, h * 0.07, w * 0.19, h * 0.84, artOnLeft),
    );
    elements.push(
      editableText(eyebrow, textX, h * 0.13, textW, h * 0.09, unit * 0.045, "NiimBlue Condensed", false, 80),
    );
    elements.push(editableText(title, textX, h * 0.29, textW, h * 0.2, unit * 0.125, "NiimBlue Serif", true));
    elements.push(editableText(subtitle, textX, h * 0.545, textW, h * 0.1, unit * 0.052, "NiimBlue Serif", true));
    elements.push(line(textX + textW * 0.2, h * 0.715, textW * 0.6));
    elements.push(
      editableText(footer, textX, h * 0.81, textW, h * 0.075, unit * 0.037, "NiimBlue Condensed", false, 45),
    );
  }
  return { width: w, height: h, shape, elements };
}

/** Explicit compositions for each aspect; illustration proportions never stretch. */
export function designScene(id: DesignId, format: DesignFormat, language: DesignLanguage = "en"): DesignScene {
  if (isCyberDesign(id)) return cyberDesignScene(id, format, language);
  if (isDecoDesign(id)) return decoDesignScene(id, format, language);
  if (isVintageDesign(id)) return vintageDesignScene(id, format, language);
  const { width: w, height: h, shape } = format;
  const info = BOTANICAL_DESIGNS.find((item) => item.id === id)!;
  const [eyebrow, title, subtitle, footer] = COPY[id][language];
  if (id === "fern-study" || id === "eucalyptus-note" || id === "berry-harvest" || id === "poppy-field")
    return asymmetricBotanicalScene(id, info.ornament, [eyebrow, title, subtitle, footer], format);
  const elements: DesignElement[] = [];
  const round = shape === "circle";
  const portrait = !round && h > w * 1.15;
  const unit = Math.min(w, h);
  const titleSize = id === "artisan" && language === "de" ? unit * 0.115 : unit * 0.14;
  if (id === "apothecary") elements.push(outline(w, h, shape, true));
  if (round) {
    if (id !== "apothecary" && id !== "floral") elements.push(outline(w, h, shape));
    // Lower branches leave the headline completely clear, even on round stock.
    elements.push(ornament(info.ornament, w * 0.1, h * 0.61, w * 0.25, h * 0.22));
    elements.push(ornament(info.ornament, w * 0.65, h * 0.61, w * 0.25, h * 0.22, true));
    elements.push(text(eyebrow, w * 0.2, h * 0.21, w * 0.6, h * 0.08, unit * 0.043, false, false, 90));
    elements.push(text(title, w * 0.14, h * 0.335, w * 0.72, h * 0.19, titleSize, true, id === "floral"));
    elements.push(text(subtitle, w * 0.21, h * 0.54, w * 0.58, h * 0.09, unit * 0.053, true, true));
    elements.push(line(w * 0.39, h * 0.73, w * 0.22));
    elements.push(text(footer, w * 0.31, h * 0.84, w * 0.38, h * 0.07, unit * 0.035));
  } else if (portrait) {
    if (id === "floral") {
      elements.push(ornament("floral-corner", w * 0.035, h * 0.035, w * 0.31, h * 0.26));
      elements.push(ornament("floral-corner", w * 0.7, h * 0.8, w * 0.26, h * 0.18, true, true));
    } else {
      elements.push(ornament(info.ornament, w * 0.29, h * 0.08, w * 0.42, h * 0.29));
    }
    elements.push(text(eyebrow, w * 0.13, h * 0.39, w * 0.74, h * 0.06, unit * 0.041, false, false, 100));
    elements.push(text(title, w * 0.12, h * 0.475, w * 0.76, h * 0.14, titleSize * 1.1, true, id === "floral"));
    elements.push(text(subtitle, w * 0.15, h * 0.625, w * 0.7, h * 0.075, unit * 0.056, true, true));
    elements.push(line(w * 0.28, h * 0.76, w * 0.44));
    elements.push(text(footer, w * 0.16, h * 0.82, w * (id === "floral" ? 0.5 : 0.68), h * 0.075, unit * 0.038));
  } else {
    if (id === "floral") {
      elements.push(ornament("floral-corner", w * 0.025, h * 0.055, w * 0.22, h * 0.52));
      elements.push(ornament("floral-corner", w * 0.755, h * 0.425, w * 0.22, h * 0.52, true, true));
    } else {
      elements.push(ornament(info.ornament, w * 0.025, h * 0.12, w * 0.22, h * 0.76));
      if (id === "pantry" || id === "lavender")
        elements.push(ornament(info.ornament, w * 0.755, h * 0.12, w * 0.22, h * 0.76, true));
    }
    const asymmetric = id === "citrus" || id === "artisan";
    const left = asymmetric ? w * 0.29 : w * 0.24;
    const contentWidth = asymmetric ? w * 0.64 : w * 0.52;
    elements.push(text(eyebrow, left, h * 0.16, contentWidth, h * 0.1, unit * 0.052, false, false, 100));
    elements.push(text(title, left, h * 0.31, contentWidth, h * 0.23, titleSize * 1.12, true, id === "floral"));
    elements.push(text(subtitle, left, h * 0.59, contentWidth, h * 0.1, unit * 0.067, true, true));
    elements.push(line(left + contentWidth * 0.22, h * 0.75, contentWidth * 0.56));
    elements.push(text(footer, left, h * 0.82, contentWidth, h * 0.08, unit * 0.045));
  }
  return { width: w, height: h, shape, elements };
}

/** Ordinary single labels get a composition for their current physical size. */
export function currentDesignFormat(props: LabelProps): DesignFormat | undefined {
  if (
    props.panels?.length ||
    props.tailLength ||
    (props.split && props.split !== "none") ||
    (props.mirror && props.mirror !== "none")
  )
    return undefined;
  const width = pxToMm(props.size.width),
    height = pxToMm(props.size.height);
  if (
    Math.min(width, height) < 24.9 ||
    Math.max(width, height) > 100.1 ||
    Math.max(width / height, height / width) > 2.1
  )
    return undefined;
  if (props.shape === "circle" && Math.abs(width - height) > 0.1) return undefined;
  return { id: "current", width, height, shape: props.shape ?? "rect" };
}

export const designName = (id: DesignId, language: DesignLanguage) =>
  DESIGN_TEMPLATES.find((item) => item.id === id)![language];
