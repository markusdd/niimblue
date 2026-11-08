import type { DesignFormat, DesignLanguage, DesignScene, DesignElement } from "./design_templates";
import { cyberFrameSvg } from "../utils/cyber_frames";
import type { BundledFontFamily } from "./bundled_fonts";

/** Original technical label compositions paired with the sci-fi HUD frame set. */
export const CYBER_DESIGNS = [
  { id: "cyber-module", collection: "cyber", frame: "cyber-module", en: "Module ID", de: "Modulkennung" },
  { id: "cyber-inventory", collection: "cyber", frame: "cyber-armour", en: "Inventory", de: "Inventar" },
  { id: "cyber-sample", collection: "cyber", frame: "cyber-ruler", en: "Project sample", de: "Projektprobe" },
  { id: "cyber-orbit", collection: "cyber", frame: "cyber-hud", en: "Orbit log", de: "Orbit Logbuch" },
  { id: "cyber-docking", collection: "cyber", frame: "cyber-docking", en: "Docking clearance", de: "Andockerlaubnis" },
  { id: "cyber-signal", collection: "cyber", frame: "cyber-signal", en: "Signal trace", de: "Signalspur" },
  { id: "cyber-reactor", collection: "cyber", frame: "cyber-reactor", en: "Reactor status", de: "Reaktorstatus" },
  { id: "cyber-vector", collection: "cyber", frame: "cyber-vector", en: "Vector chart", de: "Vektorkarte" },
] as const;

export type CyberDesignId = (typeof CYBER_DESIGNS)[number]["id"];

export function isCyberDesign(id: string): id is CyberDesignId {
  return CYBER_DESIGNS.some((item) => item.id === id);
}

type Copy = { header: string; title: string; subtitle: string; fields: [string, string]; footer: string };
const copy: Record<CyberDesignId, Record<DesignLanguage, Copy>> = {
  "cyber-module": {
    en: {
      header: "FIELD SYSTEMS / ID 08",
      title: "MODULE 08",
      subtitle: "CONTROL INTERFACE",
      fields: ["PORT / A-17", "REV / 02"],
      footer: "ASSEMBLY / 01",
    },
    de: {
      header: "FELDSYSTEME / ID 08",
      title: "MODUL 08",
      subtitle: "STEUERSCHNITTSTELLE",
      fields: ["PORT / A-17", "REV / 02"],
      footer: "BAUGRUPPE / 01",
    },
  },
  "cyber-inventory": {
    en: {
      header: "EQUIPMENT / RECORD 03",
      title: "INVENTORY",
      subtitle: "STORAGE INDEX",
      fields: ["RACK / 04", "SLOT / B-12"],
      footer: "ZONE / NORTH",
    },
    de: {
      header: "AUSRÜSTUNG / SATZ 03",
      title: "INVENTAR",
      subtitle: "LAGERINDEX",
      fields: ["REGAL / 04", "FACH / B-12"],
      footer: "ZONE / NORD",
    },
  },
  "cyber-sample": {
    en: {
      header: "PROJECT / FIELD STUDY",
      title: "SAMPLE 024",
      subtitle: "MATERIAL RECORD",
      fields: ["SERIES / C", "BATCH / 06"],
      footer: "LOG / 14:20",
    },
    de: {
      header: "PROJEKT / FELDSTUDIE",
      title: "PROBE 024",
      subtitle: "MATERIALDATEN",
      fields: ["SERIE / C", "CHARGE / 06"],
      footer: "LOG / 14:20",
    },
  },
  "cyber-orbit": {
    en: {
      header: "EXPEDITION / LOG 12",
      title: "ORBITAL",
      subtitle: "SECTOR 07 · GRID 31",
      fields: ["ROUTE / 04", "ZONE / OUTER"],
      footer: "MISSION / 07",
    },
    de: {
      header: "EXPEDITION / LOG 12",
      title: "ORBITAL",
      subtitle: "SEKTOR 07 · RASTER 31",
      fields: ["ROUTE / 04", "ZONE / AUSSEN"],
      footer: "MISSION / 07",
    },
  },
  "cyber-docking": {
    en: {
      header: "FLIGHT CONTROL / BAY 04",
      title: "DOCKING",
      subtitle: "CLEARANCE GRANTED",
      fields: ["VESSEL / K-09", "BERTH / 04"],
      footer: "APPROACH / GREEN",
    },
    de: {
      header: "FLUGLEITUNG / DOCK 04",
      title: "ANDOCKEN",
      subtitle: "FREIGABE ERTEILT",
      fields: ["SCHIFF / K-09", "PLATZ / 04"],
      footer: "ANFLUG / GRÜN",
    },
  },
  "cyber-signal": {
    en: {
      header: "COMMS / EQUIPMENT RECORD",
      title: "SIGNAL TRACE",
      subtitle: "RECEIVER ARRAY",
      fields: ["BAND / 09", "GAIN / +12"],
      footer: "STATUS / LOCKED",
    },
    de: {
      header: "FUNK / GERÄTEKARTE",
      title: "SIGNALSPUR",
      subtitle: "EMPFÄNGERFELD",
      fields: ["BAND / 09", "VERST / +12"],
      footer: "STATUS / FIXIERT",
    },
  },
  "cyber-reactor": {
    en: {
      header: "CORE SYSTEMS / UNIT 01",
      title: "REACTOR",
      subtitle: "OUTPUT STABLE",
      fields: ["CORE / 88%", "TEMP / 320 K"],
      footer: "CONTAINMENT / SEALED",
    },
    de: {
      header: "KERNSYSTEME / EINHEIT 01",
      title: "REAKTOR",
      subtitle: "LEISTUNG STABIL",
      fields: ["KERN / 88%", "TEMP / 320 K"],
      footer: "EINSCHLUSS / DICHT",
    },
  },
  "cyber-vector": {
    en: {
      header: "NAVIGATION / PLOT 22",
      title: "VECTOR 06",
      subtitle: "TRANSIT CORRIDOR",
      fields: ["HEADING / 045", "RANGE / 8.2"],
      footer: "ROUTE / VERIFIED",
    },
    de: {
      header: "NAVIGATION / KURS 22",
      title: "VEKTOR 06",
      subtitle: "TRANSITKORRIDOR",
      fields: ["KURS / 045", "DISTANZ / 8.2"],
      footer: "ROUTE / BESTÄTIGT",
    },
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
  align: "left" | "center" | "right" = "left",
  weight = 400,
  spacing = 0,
): TextElement {
  return { kind: "text", text: value, x, y, width, height, size, family, align, weight, spacing };
}

function rule(x: number, y: number, width: number): DesignElement {
  return {
    kind: "svg",
    name: "Interface rule",
    x,
    y,
    width,
    height: 0.6,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} .6" width="${width}" height=".6" fill="none" stroke="#000" stroke-width=".16" stroke-linecap="square"><path d="M 0 .3 H ${width}"/></svg>`,
  };
}

/** Technical, editable text hierarchy in a protected central field. */
export function cyberDesignScene(id: CyberDesignId, format: DesignFormat, language: DesignLanguage): DesignScene {
  const info = CYBER_DESIGNS.find((item) => item.id === id)!;
  const { width: w, height: h, shape } = format;
  const data = copy[id][language];
  const round = shape === "circle";
  const portrait = !round && h > w * 1.15;
  const centered = id === "cyber-reactor";
  const unit = Math.min(w, h);
  const left = w * (round ? 0.25 : centered ? 0.2 : id === "cyber-signal" ? 0.22 : 0.19);
  const contentWidth = w * (round ? 0.5 : centered ? 0.6 : id === "cyber-signal" ? 0.66 : 0.62);
  const align = centered ? ("center" as const) : ("left" as const);
  const headerY = h * (round ? 0.29 : 0.24);
  const titleY = h * (round ? 0.405 : portrait ? 0.36 : 0.355);
  const subtitleY = h * (round ? 0.545 : 0.535);
  const fieldY = h * (round ? 0.645 : 0.65);
  const footerY = h * 0.74;
  const titleSize = unit * (portrait ? 0.115 : 0.125);
  const fieldGap = contentWidth * 0.06;
  const fieldWidth = (contentWidth - fieldGap) / 2;
  const elements: DesignElement[] = [
    {
      kind: "svg",
      role: "frame",
      name: info.frame,
      svg: cyberFrameSvg(info.frame, w * 12, h * 12, shape),
      x: 0,
      y: 0,
      width: w,
      height: h,
    },
    text(data.header, left, headerY, contentWidth, unit * 0.075, unit * 0.05, "NiimBlue Condensed", align, 400, 80),
    text(data.title, left, titleY, contentWidth, unit * 0.17, titleSize, "NiimBlue Modern", align, 700, 5),
    text(
      data.subtitle,
      left,
      subtitleY,
      contentWidth,
      unit * 0.075,
      unit * 0.052,
      "NiimBlue Condensed",
      align,
      700,
      35,
    ),
    rule(left, h * 0.615, contentWidth),
    text(data.fields[0], left, fieldY, fieldWidth, unit * 0.06, unit * 0.05, "NiimBlue Mono", align, 400, 0),
    text(
      data.fields[1],
      left + fieldWidth + fieldGap,
      fieldY,
      fieldWidth,
      unit * 0.06,
      unit * 0.05,
      "NiimBlue Mono",
      align,
      400,
      0,
    ),
    rule(left, h * 0.72, contentWidth),
    text(data.footer, left, footerY, contentWidth, unit * 0.065, unit * 0.05, "NiimBlue Condensed", align, 400, 70),
  ];
  return { width: w, height: h, shape, elements };
}
