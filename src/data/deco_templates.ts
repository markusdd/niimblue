import type { DesignFormat, DesignLanguage, DesignScene, DesignElement } from "./design_templates";
import { artDecoFrameSvg, type ArtDecoFrameKind } from "../utils/art_deco_frames";
import type { BundledFontFamily } from "./bundled_fonts";

/** Original type-led compositions paired with the Art Deco frame collection. */
export const DECO_DESIGNS = [
  { id: "deco-reserve", collection: "artdeco", frame: "deco-fan", en: "Reserve No. 08", de: "Reserve Nr. 08" },
  { id: "deco-atelier", collection: "artdeco", frame: "deco-mitre", en: "Atelier edition", de: "Atelier Edition" },
  { id: "deco-edition", collection: "artdeco", frame: "deco-linked", en: "Catalogue No. 07", de: "Katalog Nr. 07" },
  {
    id: "deco-celebrate",
    collection: "artdeco",
    frame: "deco-spire",
    en: "A little celebration",
    de: "Ein kleiner Festtag",
  },
  { id: "deco-nocturne", collection: "artdeco", frame: "deco-orbit", en: "Nocturne boutique", de: "Nocturne Boutique" },
  { id: "deco-grand", collection: "artdeco", frame: "deco-scalloped", en: "Grand Salon", de: "Großer Salon" },
  { id: "deco-archive", collection: "artdeco", frame: "deco-hexagon", en: "Archive Studio", de: "Archiv Studio" },
] as const;

export type DecoDesignId = (typeof DECO_DESIGNS)[number]["id"];

export function isDecoDesign(id: string): id is DecoDesignId {
  return DECO_DESIGNS.some((item) => item.id === id);
}

const copy: Record<DecoDesignId, Record<DesignLanguage, [string, string, string, string]>> = {
  "deco-reserve": {
    en: ["THE RESERVE COLLECTION", "COFFEE", "No. 08 · HOUSE BLEND", "COFFEE · TEA · CACAO"],
    de: ["DIE RESERVE KOLLEKTION", "KAFFEE", "Nr. 08 · HAUSMISCHUNG", "KAFFEE · TEE · KAKAO"],
  },
  "deco-atelier": {
    en: ["ATELIER", "EDITION 04", "Form follows feeling", "DESIGN · OBJECT · DETAIL"],
    de: ["ATELIER", "EDITION 04", "Form folgt Gefühl", "DESIGN · OBJEKT · DETAIL"],
  },
  "deco-edition": {
    en: ["CATALOGUE / OBJECT 07", "EDITION 07", "FORM / FUNCTION / FINISH", "SERIES No. 01"],
    de: ["KATALOG / OBJEKT 07", "EDITION 07", "FORM / FUNKTION / FINISH", "SERIE Nr. 01"],
  },
  "deco-celebrate": {
    en: ["A MOMENT TO CELEBRATE", "FÊTE", "A little something for you", "WITH JOY · WITH LOVE"],
    de: ["EIN GRUND ZUM FEIERN", "FESTTAG", "Eine Kleinigkeit für dich", "MIT FREUDE · VON HERZEN"],
  },
  "deco-nocturne": {
    en: ["NOCTURNE / PRIVATE EDITION", "NOCTURNE", "A study in quiet light", "COLLECTION No. 12"],
    de: ["NOCTURNE / PRIVATAUSGABE", "NOCTURNE", "Eine Studie in stillem Licht", "KOLLEKTION Nr. 12"],
  },
  "deco-grand": {
    en: ["GRAND SALON", "SALON", "A place for fine things", "SERIES / 03"],
    de: ["GRAND SALON", "SALON", "Ein Ort für schöne Dinge", "SERIE / 03"],
  },
  "deco-archive": {
    en: ["ARCHIVE / STUDY 12", "STUDIO 12", "Objects in sequence", "INDEX No. 012"],
    de: ["ARCHIV / STUDIE 12", "STUDIO 12", "Objekte in Reihe", "INDEX Nr. 012"],
  },
};

type TextElement = Extract<DesignElement, { kind: "text" }>;
function text(
  value: string,
  x: number,
  y: number,
  width: number,
  height: number,
  size: number,
  family: BundledFontFamily,
  options: { weight?: number; italic?: boolean; spacing?: number } = {},
): TextElement {
  return { kind: "text", text: value, x, y, width, height, size, family, ...options };
}

function divider(x: number, y: number, width: number): DesignElement {
  const center = width / 2;
  return {
    kind: "svg",
    name: "Deco divider",
    x,
    y,
    width,
    height: 1,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} 1" width="${width}" height="1" fill="none" stroke="black" stroke-width=".16" stroke-linecap="square"><path d="M .4 .5 H ${center - 1.2} M ${center + 1.2} .5 H ${width - 0.4}"/><path d="M ${center} .08L${center + 0.42} .5L${center} .92L${center - 0.42} .5Z" fill="black" stroke="none"/></svg>`,
  };
}

/** All frame ornament stays at the perimeter; text lives in the clear central field. */
export function decoDesignScene(id: DecoDesignId, format: DesignFormat, language: DesignLanguage): DesignScene {
  const info = DECO_DESIGNS.find((item) => item.id === id)!;
  const { width: w, height: h, shape } = format;
  const [header, title, subtitle, footer] = copy[id][language];
  const round = shape === "circle";
  const portrait = !round && h > w * 1.15;
  const unit = Math.min(w, h);
  const contentWidth = w * (round ? 0.58 : 0.6);
  const left = (w - contentWidth) / 2;
  const headerY = h * (round ? 0.27 : portrait ? 0.28 : 0.26);
  const titleY = h * (round ? 0.39 : portrait ? 0.405 : 0.4);
  const subtitleY = h * (round ? 0.57 : portrait ? 0.585 : 0.59);
  const dividerY = h * (round ? 0.675 : portrait ? 0.68 : 0.68);
  const footerY = h * 0.72;
  const cornerArcs = round && id === "deco-nocturne";
  const captionLeft = cornerArcs ? w * 0.29 : left;
  const captionWidth = cornerArcs ? w * 0.42 : contentWidth;
  const titleFamily: BundledFontFamily =
    id === "deco-grand"
      ? "NiimBlue Book"
      : id === "deco-reserve" || id === "deco-celebrate" || id === "deco-nocturne"
        ? "NiimBlue Serif"
        : "NiimBlue Modern";
  const elements: DesignElement[] = [
    {
      kind: "svg",
      role: "frame",
      name: info.frame,
      svg: artDecoFrameSvg(info.frame as ArtDecoFrameKind, w * 12, h * 12, shape),
      x: 0,
      y: 0,
      width: w,
      height: h,
    },
    text(header, captionLeft, headerY, captionWidth, unit * 0.09, unit * 0.047, "NiimBlue Condensed", { spacing: 95 }),
    text(title, left, titleY, contentWidth, unit * 0.19, unit * (portrait ? 0.15 : 0.14), titleFamily, {
      weight: id === "deco-celebrate" || id === "deco-nocturne" ? 400 : 700,
      italic: id === "deco-celebrate" || id === "deco-nocturne",
      spacing: id === "deco-edition" || id === "deco-archive" ? 50 : 0,
    }),
    text(subtitle, left, subtitleY, contentWidth, unit * 0.095, unit * 0.052, "NiimBlue Serif", {
      italic: id === "deco-atelier" || id === "deco-celebrate",
    }),
    divider(w * 0.39, dividerY, w * 0.22),
    text(
      footer,
      cornerArcs ? captionLeft : left + contentWidth * 0.04,
      footerY,
      cornerArcs ? captionWidth : contentWidth * 0.92,
      unit * 0.065,
      unit * 0.045,
      id === "deco-archive" ? "NiimBlue Condensed" : "NiimBlue Mono",
      {
        spacing: 25,
      },
    ),
  ];
  return { width: w, height: h, shape, elements };
}
