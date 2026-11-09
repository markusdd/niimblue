import { DECORATIVE_ORNAMENTS } from "./decorative_ornaments";
import type { DesignElement, DesignFormat, DesignLanguage, DesignScene } from "./design_templates";
import type { BundledFontFamily } from "./bundled_fonts";

/** Asymmetric editorial labels composed from independent decorative ornaments. */
export const ORNAMENT_DESIGNS = [
  {
    id: "vintage-postmark",
    collection: "vintage",
    ornament: "vintage-postmark",
    en: "Postmarked letter",
    de: "Brief mit Poststempel",
  },
  {
    id: "vintage-wax-seal",
    collection: "vintage",
    ornament: "vintage-wax-seal",
    en: "Wax seal keepsake",
    de: "Siegel-Erinnerung",
  },
  {
    id: "vintage-engravers-sweep",
    collection: "vintage",
    ornament: "vintage-engravers-sweep",
    en: "Engraver’s flourish",
    de: "Graveurs-Schwung",
  },
  {
    id: "deco-sunburst",
    collection: "artdeco",
    ornament: "deco-sunburst",
    en: "Sunroom edition",
    de: "Sonnenzimmer-Edition",
  },
  {
    id: "deco-orbit-pendant",
    collection: "artdeco",
    ornament: "deco-orbit-pendant",
    en: "Orbit pendant",
    de: "Orbit-Anhänger",
  },
  { id: "deco-speed-lines", collection: "artdeco", ornament: "deco-speed-lines", en: "Grand tour", de: "Große Fahrt" },
  { id: "cyber-reticle", collection: "cyber", ornament: "cyber-reticle", en: "Target registry", de: "Zielregister" },
  {
    id: "cyber-circuit-spray",
    collection: "cyber",
    ornament: "cyber-circuit-spray",
    en: "Circuit garden",
    de: "Schaltkreisgarten",
  },
  {
    id: "cyber-data-stripe",
    collection: "cyber",
    ornament: "cyber-data-stripe",
    en: "Data transmission",
    de: "Datenübertragung",
  },
] as const;

export type OrnamentDesignId = (typeof ORNAMENT_DESIGNS)[number]["id"];

export function isOrnamentDesign(id: string): id is OrnamentDesignId {
  return ORNAMENT_DESIGNS.some((design) => design.id === id);
}

const copy: Record<OrnamentDesignId, Record<DesignLanguage, readonly [string, string, string, string]>> = {
  "vintage-postmark": {
    en: ["CORRESPONDENCE No. 08", "POST & PAPER", "A note from the old quarter", "SENT WITH CARE · EST. 1892"],
    de: ["KORRESPONDENZ Nr. 08", "POST & PAPIER", "Ein Gruß aus dem alten Viertel", "MIT LIEBE VERSANDT · SEIT 1892"],
  },
  "vintage-wax-seal": {
    en: ["THE KEEPSAKE DESK", "SEALED FOR YOU", "A little thing to treasure", "PRIVATE PAPERS · VOL. 03"],
    de: ["DER ERINNERUNGSTISCH", "FÜR DICH VERSIEGELT", "Ein kleines Stück zum Bewahren", "PRIVATE PAPIERE · BAND 03"],
  },
  "vintage-engravers-sweep": {
    en: ["FROM THE ENGRAVER", "A FINE IMPRESSION", "Ink, plate & patient hands", "MADE IN THE OLD WAY"],
    de: ["VOM GRAVEUR", "EIN FEINER ABDRUCK", "Tinte, Platte und ruhige Hand", "IN ALTER HANDWERKSKUNST"],
  },
  "deco-sunburst": {
    en: ["HOUSE OF RADIANCE", "DAYLIGHT No. 5", "A bright new chapter", "GOLDEN HOURS · 1928"],
    de: ["HAUS DES LICHTS", "TAGESGLANZ Nr. 5", "Ein strahlend neues Kapitel", "GOLDENE STUNDEN · 1928"],
  },
  "deco-orbit-pendant": {
    en: ["CELESTIAL OBJECTS", "ORBIT No. 09", "Designed for the evening", "FORM · LIGHT · MOTION"],
    de: ["HIMMLISCHE OBJEKTE", "ORBIT Nr. 09", "Für den Abend entworfen", "FORM · LICHT · BEWEGUNG"],
  },
  "deco-speed-lines": {
    en: ["THE GRAND TOUR", "VELOCITY", "Always a little ahead", "MOTOR CLUB · 1931"],
    de: ["DIE GROSSE REISE", "GESCHWINDIGKEIT", "Immer einen Schritt voraus", "MOTORCLUB · 1931"],
  },
  "cyber-reticle": {
    en: ["OPTIC ARRAY / 04", "LOCK: STABLE", "Signal acquired", "VECTOR 018 · SECTOR C"],
    de: ["OPTIK-ARRAY / 04", "FOKUS: STABIL", "Signal erfasst", "VEKTOR 018 · SEKTOR C"],
  },
  "cyber-circuit-spray": {
    en: ["BIO / DIGITAL", "GROWTH NODE", "Organic systems online", "ROOT ACCESS · GREENHOUSE 02"],
    de: ["BIO / DIGITAL", "WACHSTUMSKNOTEN", "Organische Systeme aktiv", "ROOT-ZUGANG · GEWÄCHSHAUS 02"],
  },
  "cyber-data-stripe": {
    en: ["TRANSFER WINDOW", "PACKET 0701", "Memory in motion", "UPLINK · 08:42:16 UTC"],
    de: ["ÜBERTRAGUNGSFENSTER", "PAKET 0701", "Erinnerung in Bewegung", "UPLINK · 08:42:16 UTC"],
  },
};

type Box = { x: number; y: number; w: number; h: number; align?: "left" | "center" | "right" };
type Layout = { main: Box; second?: Box; eyebrow: Box; title: Box; subtitle: Box; footer: Box };

const layouts: Record<OrnamentDesignId, { landscape: Layout; portrait: Layout; round: Layout }> = {
  "vintage-postmark": {
    landscape: {
      main: { x: 0.69, y: 0.1, w: 0.25, h: 0.46 },
      second: { x: 0.66, y: 0.69, w: 0.23, h: 0.2 },
      eyebrow: { x: 0.08, y: 0.17, w: 0.52, h: 0.08, align: "left" },
      title: { x: 0.08, y: 0.31, w: 0.54, h: 0.16, align: "left" },
      subtitle: { x: 0.08, y: 0.55, w: 0.53, h: 0.09, align: "left" },
      footer: { x: 0.08, y: 0.79, w: 0.55, h: 0.08, align: "left" },
    },
    portrait: {
      main: { x: 0.08, y: 0.075, w: 0.34, h: 0.2 },
      second: { x: 0.63, y: 0.075, w: 0.28, h: 0.17 },
      eyebrow: { x: 0.16, y: 0.34, w: 0.72, h: 0.06 },
      title: { x: 0.14, y: 0.43, w: 0.72, h: 0.13 },
      subtitle: { x: 0.18, y: 0.59, w: 0.68, h: 0.08 },
      footer: { x: 0.2, y: 0.82, w: 0.65, h: 0.07 },
    },
    round: {
      main: { x: 0.16, y: 0.14, w: 0.16, h: 0.14 },
      second: { x: 0.74, y: 0.68, w: 0.13, h: 0.1 },
      eyebrow: { x: 0.22, y: 0.33, w: 0.56, h: 0.055, align: "left" },
      title: { x: 0.2, y: 0.415, w: 0.6, h: 0.13 },
      subtitle: { x: 0.24, y: 0.565, w: 0.52, h: 0.075 },
      footer: { x: 0.22, y: 0.835, w: 0.56, h: 0.05, align: "right" },
    },
  },
  "vintage-wax-seal": {
    landscape: {
      main: { x: 0.07, y: 0.17, w: 0.34, h: 0.67 },
      second: { x: 0.08, y: 0.035, w: 0.19, h: 0.1 },
      eyebrow: { x: 0.48, y: 0.14, w: 0.46, h: 0.07, align: "left" },
      title: { x: 0.48, y: 0.29, w: 0.46, h: 0.16, align: "left" },
      subtitle: { x: 0.48, y: 0.54, w: 0.46, h: 0.09, align: "left" },
      footer: { x: 0.48, y: 0.85, w: 0.46, h: 0.06, align: "left" },
    },
    portrait: {
      main: { x: 0.06, y: 0.31, w: 0.38, h: 0.53 },
      second: { x: 0.08, y: 0.075, w: 0.27, h: 0.17 },
      eyebrow: { x: 0.51, y: 0.17, w: 0.43, h: 0.065, align: "left" },
      title: { x: 0.5, y: 0.29, w: 0.44, h: 0.17, align: "left" },
      subtitle: { x: 0.5, y: 0.54, w: 0.44, h: 0.1, align: "left" },
      footer: { x: 0.5, y: 0.85, w: 0.44, h: 0.06, align: "left" },
    },
    round: {
      main: { x: 0.08, y: 0.34, w: 0.31, h: 0.32 },
      second: { x: 0.18, y: 0.14, w: 0.12, h: 0.1 },
      eyebrow: { x: 0.43, y: 0.29, w: 0.39, h: 0.06, align: "right" },
      title: { x: 0.42, y: 0.38, w: 0.4, h: 0.15, align: "right" },
      subtitle: { x: 0.43, y: 0.57, w: 0.39, h: 0.085, align: "right" },
      footer: { x: 0.43, y: 0.82, w: 0.37, h: 0.06, align: "right" },
    },
  },
  "vintage-engravers-sweep": {
    landscape: {
      main: { x: 0.59, y: 0.08, w: 0.35, h: 0.34 },
      second: { x: 0.05, y: 0.69, w: 0.25, h: 0.19 },
      eyebrow: { x: 0.08, y: 0.15, w: 0.43, h: 0.07, align: "left" },
      title: { x: 0.08, y: 0.29, w: 0.45, h: 0.16, align: "left" },
      subtitle: { x: 0.37, y: 0.53, w: 0.55, h: 0.08, align: "right" },
      footer: { x: 0.37, y: 0.78, w: 0.55, h: 0.07, align: "right" },
    },
    portrait: {
      main: { x: 0.05, y: 0.68, w: 0.14, h: 0.18 },
      second: { x: 0.63, y: 0.09, w: 0.26, h: 0.21 },
      eyebrow: { x: 0.2, y: 0.34, w: 0.67, h: 0.06 },
      title: { x: 0.15, y: 0.43, w: 0.69, h: 0.14 },
      subtitle: { x: 0.2, y: 0.6, w: 0.65, h: 0.08 },
      footer: { x: 0.2, y: 0.81, w: 0.65, h: 0.07 },
    },
    round: {
      main: { x: 0.16, y: 0.14, w: 0.16, h: 0.14 },
      second: { x: 0.74, y: 0.68, w: 0.13, h: 0.1 },
      eyebrow: { x: 0.22, y: 0.33, w: 0.56, h: 0.055, align: "left" },
      title: { x: 0.2, y: 0.415, w: 0.6, h: 0.13 },
      subtitle: { x: 0.24, y: 0.565, w: 0.52, h: 0.075 },
      footer: { x: 0.22, y: 0.835, w: 0.56, h: 0.05, align: "right" },
    },
  },
  "deco-sunburst": {
    landscape: {
      main: { x: 0.7, y: 0.08, w: 0.23, h: 0.38 },
      second: { x: 0.73, y: 0.65, w: 0.19, h: 0.22 },
      eyebrow: { x: 0.08, y: 0.16, w: 0.54, h: 0.07, align: "left" },
      title: { x: 0.08, y: 0.3, w: 0.56, h: 0.16, align: "left" },
      subtitle: { x: 0.08, y: 0.55, w: 0.55, h: 0.08, align: "left" },
      footer: { x: 0.08, y: 0.79, w: 0.55, h: 0.07, align: "left" },
    },
    portrait: {
      main: { x: 0.62, y: 0.08, w: 0.28, h: 0.23 },
      second: { x: 0.09, y: 0.08, w: 0.25, h: 0.18 },
      eyebrow: { x: 0.12, y: 0.36, w: 0.7, h: 0.06 },
      title: { x: 0.12, y: 0.45, w: 0.76, h: 0.13 },
      subtitle: { x: 0.12, y: 0.61, w: 0.68, h: 0.08 },
      footer: { x: 0.12, y: 0.82, w: 0.7, h: 0.07 },
    },
    round: {
      main: { x: 0.68, y: 0.14, w: 0.16, h: 0.14 },
      second: { x: 0.13, y: 0.68, w: 0.13, h: 0.1 },
      eyebrow: { x: 0.22, y: 0.33, w: 0.56, h: 0.055, align: "right" },
      title: { x: 0.2, y: 0.415, w: 0.6, h: 0.13 },
      subtitle: { x: 0.24, y: 0.565, w: 0.52, h: 0.075 },
      footer: { x: 0.22, y: 0.835, w: 0.56, h: 0.05, align: "left" },
    },
  },
  "deco-orbit-pendant": {
    landscape: {
      main: { x: 0.08, y: 0.12, w: 0.3, h: 0.75 },
      eyebrow: { x: 0.46, y: 0.15, w: 0.48, h: 0.07, align: "right" },
      title: { x: 0.46, y: 0.29, w: 0.48, h: 0.17, align: "right" },
      subtitle: { x: 0.46, y: 0.55, w: 0.48, h: 0.08, align: "right" },
      footer: { x: 0.46, y: 0.85, w: 0.48, h: 0.06, align: "right" },
    },
    portrait: {
      main: { x: 0.07, y: 0.3, w: 0.34, h: 0.56 },
      eyebrow: { x: 0.49, y: 0.17, w: 0.45, h: 0.065, align: "right" },
      title: { x: 0.48, y: 0.29, w: 0.46, h: 0.17, align: "right" },
      subtitle: { x: 0.49, y: 0.55, w: 0.45, h: 0.09, align: "right" },
      footer: { x: 0.49, y: 0.85, w: 0.45, h: 0.06, align: "right" },
    },
    round: {
      main: { x: 0.08, y: 0.33, w: 0.3, h: 0.34 },
      eyebrow: { x: 0.42, y: 0.29, w: 0.4, h: 0.06, align: "right" },
      title: { x: 0.41, y: 0.38, w: 0.41, h: 0.15, align: "right" },
      subtitle: { x: 0.42, y: 0.57, w: 0.4, h: 0.08, align: "right" },
      footer: { x: 0.42, y: 0.82, w: 0.38, h: 0.06, align: "right" },
    },
  },
  "deco-speed-lines": {
    landscape: {
      main: { x: 0.53, y: 0.04, w: 0.42, h: 0.22 },
      second: { x: 0.1, y: 0.72, w: 0.24, h: 0.17 },
      eyebrow: { x: 0.08, y: 0.16, w: 0.48, h: 0.07, align: "left" },
      title: { x: 0.08, y: 0.3, w: 0.5, h: 0.16, align: "left" },
      subtitle: { x: 0.4, y: 0.54, w: 0.54, h: 0.08, align: "right" },
      footer: { x: 0.4, y: 0.79, w: 0.54, h: 0.07, align: "right" },
    },
    portrait: {
      main: { x: 0.54, y: 0.67, w: 0.36, h: 0.19 },
      second: { x: 0.09, y: 0.1, w: 0.27, h: 0.18 },
      eyebrow: { x: 0.16, y: 0.35, w: 0.7, h: 0.06 },
      title: { x: 0.14, y: 0.44, w: 0.73, h: 0.14 },
      subtitle: { x: 0.2, y: 0.61, w: 0.65, h: 0.08 },
      footer: { x: 0.2, y: 0.82, w: 0.65, h: 0.07 },
    },
    round: {
      main: { x: 0.68, y: 0.14, w: 0.16, h: 0.14 },
      second: { x: 0.13, y: 0.68, w: 0.13, h: 0.1 },
      eyebrow: { x: 0.22, y: 0.33, w: 0.56, h: 0.055, align: "right" },
      title: { x: 0.2, y: 0.415, w: 0.6, h: 0.13 },
      subtitle: { x: 0.24, y: 0.565, w: 0.52, h: 0.075 },
      footer: { x: 0.22, y: 0.835, w: 0.56, h: 0.05, align: "left" },
    },
  },
  "cyber-reticle": {
    landscape: {
      main: { x: 0.07, y: 0.17, w: 0.34, h: 0.66 },
      second: { x: 0.13, y: 0.035, w: 0.18, h: 0.09 },
      eyebrow: { x: 0.47, y: 0.15, w: 0.47, h: 0.07, align: "left" },
      title: { x: 0.47, y: 0.29, w: 0.47, h: 0.17, align: "left" },
      subtitle: { x: 0.47, y: 0.55, w: 0.47, h: 0.08, align: "left" },
      footer: { x: 0.47, y: 0.85, w: 0.47, h: 0.06, align: "left" },
    },
    portrait: {
      main: { x: 0.07, y: 0.31, w: 0.35, h: 0.55 },
      second: { x: 0.12, y: 0.08, w: 0.18, h: 0.14 },
      eyebrow: { x: 0.5, y: 0.17, w: 0.44, h: 0.065, align: "left" },
      title: { x: 0.49, y: 0.29, w: 0.45, h: 0.17, align: "left" },
      subtitle: { x: 0.5, y: 0.55, w: 0.44, h: 0.09, align: "left" },
      footer: { x: 0.5, y: 0.85, w: 0.44, h: 0.06, align: "left" },
    },
    round: {
      main: { x: 0.08, y: 0.33, w: 0.3, h: 0.34 },
      second: { x: 0.18, y: 0.14, w: 0.12, h: 0.1 },
      eyebrow: { x: 0.42, y: 0.29, w: 0.4, h: 0.06, align: "left" },
      title: { x: 0.41, y: 0.38, w: 0.41, h: 0.15, align: "left" },
      subtitle: { x: 0.42, y: 0.57, w: 0.4, h: 0.08, align: "left" },
      footer: { x: 0.42, y: 0.82, w: 0.38, h: 0.06, align: "left" },
    },
  },
  "cyber-circuit-spray": {
    landscape: {
      main: { x: 0.07, y: 0.12, w: 0.23, h: 0.43 },
      second: { x: 0.09, y: 0.65, w: 0.22, h: 0.21 },
      eyebrow: { x: 0.36, y: 0.15, w: 0.56, h: 0.07, align: "right" },
      title: { x: 0.35, y: 0.29, w: 0.57, h: 0.16, align: "right" },
      subtitle: { x: 0.36, y: 0.54, w: 0.55, h: 0.08, align: "right" },
      footer: { x: 0.36, y: 0.79, w: 0.55, h: 0.07, align: "right" },
    },
    portrait: {
      main: { x: 0.08, y: 0.08, w: 0.32, h: 0.24 },
      second: { x: 0.63, y: 0.08, w: 0.27, h: 0.18 },
      eyebrow: { x: 0.16, y: 0.36, w: 0.68, h: 0.06 },
      title: { x: 0.14, y: 0.45, w: 0.72, h: 0.14 },
      subtitle: { x: 0.18, y: 0.62, w: 0.65, h: 0.08 },
      footer: { x: 0.18, y: 0.82, w: 0.66, h: 0.07 },
    },
    round: {
      main: { x: 0.68, y: 0.14, w: 0.16, h: 0.14 },
      second: { x: 0.13, y: 0.68, w: 0.13, h: 0.1 },
      eyebrow: { x: 0.22, y: 0.33, w: 0.56, h: 0.055, align: "right" },
      title: { x: 0.2, y: 0.415, w: 0.6, h: 0.13 },
      subtitle: { x: 0.24, y: 0.565, w: 0.52, h: 0.075 },
      footer: { x: 0.22, y: 0.835, w: 0.56, h: 0.05, align: "left" },
    },
  },
  "cyber-data-stripe": {
    landscape: {
      main: { x: 0.65, y: 0.08, w: 0.3, h: 0.32 },
      second: { x: 0.09, y: 0.69, w: 0.24, h: 0.18 },
      eyebrow: { x: 0.08, y: 0.16, w: 0.49, h: 0.07, align: "left" },
      title: { x: 0.08, y: 0.3, w: 0.52, h: 0.16, align: "left" },
      subtitle: { x: 0.39, y: 0.54, w: 0.54, h: 0.08, align: "right" },
      footer: { x: 0.39, y: 0.79, w: 0.54, h: 0.07, align: "right" },
    },
    portrait: {
      main: { x: 0.55, y: 0.08, w: 0.37, h: 0.18 },
      second: { x: 0.09, y: 0.1, w: 0.28, h: 0.17 },
      eyebrow: { x: 0.16, y: 0.35, w: 0.7, h: 0.06 },
      title: { x: 0.14, y: 0.44, w: 0.73, h: 0.14 },
      subtitle: { x: 0.2, y: 0.61, w: 0.65, h: 0.08 },
      footer: { x: 0.2, y: 0.82, w: 0.65, h: 0.07 },
    },
    round: {
      main: { x: 0.16, y: 0.14, w: 0.16, h: 0.14 },
      second: { x: 0.74, y: 0.68, w: 0.13, h: 0.1 },
      eyebrow: { x: 0.22, y: 0.33, w: 0.56, h: 0.055, align: "left" },
      title: { x: 0.2, y: 0.415, w: 0.6, h: 0.13 },
      subtitle: { x: 0.24, y: 0.565, w: 0.52, h: 0.075 },
      footer: { x: 0.22, y: 0.835, w: 0.56, h: 0.05, align: "right" },
    },
  },
};

const families: Record<string, BundledFontFamily> = {
  vintage: "NiimBlue Book",
  artdeco: "NiimBlue Modern",
  cyber: "NiimBlue Mono",
};

/** Fit original SVG viewBox proportions inside the supplied rectangle. */
function containedOrnament(id: string, box: Box, format: DesignFormat): DesignElement {
  const item = DECORATIVE_ORNAMENTS.find((ornament) => ornament.id === id);
  if (!item) throw new Error(`Missing decorative ornament: ${id}`);
  const [, , viewWidth, viewHeight] = item.viewBox.split(/\s+/).map(Number);
  const maxWidth = format.width * box.w;
  const maxHeight = format.height * box.h;
  const scale = Math.min(maxWidth / viewWidth, maxHeight / viewHeight);
  const width = viewWidth * scale;
  const height = viewHeight * scale;
  return {
    kind: "svg",
    svg: item.svg.replace(
      /stroke-width="([\d.]+)"/,
      (_match, value: string) => `stroke-width="${Math.max(Number(value), 0.15 / scale)}"`,
    ),
    name: item.name,
    role: "illustration",
    x: format.width * box.x + (maxWidth - width) / 2,
    y: format.height * box.y + (maxHeight - height) / 2,
    width,
    height,
  };
}

function textElement(
  value: string,
  box: Box,
  format: DesignFormat,
  size: number,
  family: BundledFontFamily,
  weight = 400,
  spacing = 0,
  italic = false,
): DesignElement {
  return {
    kind: "text",
    text: value,
    x: format.width * box.x,
    y: format.height * box.y,
    width: format.width * box.w,
    height: format.height * box.h,
    size,
    family,
    weight,
    spacing,
    italic,
    align: box.align ?? "center",
  };
}

export function ornamentDesignScene(
  id: OrnamentDesignId,
  format: DesignFormat,
  language: DesignLanguage = "en",
): DesignScene {
  const design = ORNAMENT_DESIGNS.find((entry) => entry.id === id)!;
  const sourceLayouts = layouts[id];
  const formatKey =
    format.shape === "circle" ? "round" : format.height > format.width * 1.15 ? "portrait" : "landscape";
  const baseLayout = sourceLayouts[formatKey];
  const [eyebrow, title, subtitle, footer] = copy[id][language];
  const unit = Math.min(format.width, format.height);
  const family = families[design.collection];
  const designIndex = ORNAMENT_DESIGNS.findIndex((entry) => entry.id === id);
  const layout: Layout = baseLayout;
  const anchored = format.height > format.width * 1.15;
  const eyebrowBox = anchored
    ? { ...layout.eyebrow, align: designIndex % 2 ? ("right" as const) : ("left" as const) }
    : layout.eyebrow;
  const footerBox = anchored
    ? { ...layout.footer, align: designIndex % 2 ? ("left" as const) : ("right" as const) }
    : layout.footer;
  const mainOrnament = design.ornament;
  const alternates: Record<OrnamentDesignId, string> = {
    "vintage-postmark": "vintage-guilloche-rosette",
    "vintage-wax-seal": "vintage-ticket-stub",
    "vintage-engravers-sweep": "vintage-tassel",
    "deco-sunburst": "deco-fan-sweep",
    "deco-orbit-pendant": "deco-diamond-cascade",
    "deco-speed-lines": "deco-stepped-wing",
    "cyber-reticle": "cyber-orbit-array",
    "cyber-circuit-spray": "cyber-chevron-trail",
    "cyber-data-stripe": "cyber-signal-spine",
  };
  return {
    width: format.width,
    height: format.height,
    shape: format.shape,
    elements: [
      containedOrnament(mainOrnament, layout.main, format),
      ...(layout.second ? [containedOrnament(alternates[id], layout.second, format)] : []),
      textElement(eyebrow, eyebrowBox, format, unit * 0.037, family, 500, 55),
      textElement(title, layout.title, format, unit * 0.105, family, 600, design.collection === "cyber" ? 3 : 0),
      textElement(subtitle, layout.subtitle, format, unit * 0.046, family, 400, 0, true),
      textElement(footer, footerBox, format, unit * 0.031, family, 500, 45),
    ],
  };
}
