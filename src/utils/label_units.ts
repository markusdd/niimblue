import type { LabelPreset, LabelProps } from "$/types";

/**
 * Raster used by the editor. A label is a physical size; this density only
 * turns millimetres into canvas pixels. The printer's own DPI is applied
 * later, when the print bitmap is built.
 */
export const DESIGN_DPI = 300;
export const MM_PER_INCH = 25.4;

export function mmToPx(mm: number, dpi = DESIGN_DPI): number {
  if (!Number.isFinite(mm) || mm <= 0) {
    return 1;
  }
  return Math.max(1, Math.round((mm * dpi) / MM_PER_INCH));
}

export function pxToMm(px: number, dpi = DESIGN_DPI): number {
  return (px * MM_PER_INCH) / dpi;
}

/** Millimetres that convert back to the same pixel size, within one pixel. */
export function pxToEditableMm(px: number, dpi = DESIGN_DPI): number {
  const mm = pxToMm(px, dpi);
  const tenth = Math.round(mm * 10) / 10;
  if (Math.abs(mmToPx(tenth, dpi) - px) <= 1) {
    return tenth;
  }
  return Math.round(mm * 100) / 100;
}

export function formatMm(px: number, dpi = DESIGN_DPI): string {
  const mm = pxToEditableMm(px, dpi);
  return Number.isInteger(mm) ? String(mm) : String(mm);
}

export function formatMmValue(mm: number): string {
  const tenth = Math.round(mm * 10) / 10;
  return Number.isInteger(tenth) ? String(tenth) : String(tenth);
}

/** How much to scale the design raster so one pixel matches the printer. */
export function printScale(printerDpi: number | undefined): number {
  if (printerDpi === undefined || !Number.isFinite(printerDpi) || printerDpi <= 0) {
    return 1;
  }
  return printerDpi / DESIGN_DPI;
}

const DPI_TITLE = /\d+\s*dpi/i;

function presetMillimeters(preset: LabelPreset): { width: number; height: number; tail: number } {
  if (preset.unit === "px") {
    const dpi = preset.dpmm !== undefined ? preset.dpmm * MM_PER_INCH : DESIGN_DPI;
    return {
      width: pxToEditableMm(preset.width, dpi),
      height: pxToEditableMm(preset.height, dpi),
      tail: preset.tailLength ? pxToEditableMm(preset.tailLength, dpi) : 0,
    };
  }
  return {
    width: preset.width,
    height: preset.height,
    tail: preset.tailLength ?? 0,
  };
}

const presetNumber = (value: number): string => String(Math.round(value * 100) / 100);

/**
 * Cards with the same name are one preset. A title matches regardless of
 * size. An untitled design matches another untitled design of the same size.
 * A size card, with no design stored, stays separate from those.
 */
export function presetIdentity(preset: LabelPreset): string {
  const title = preset.title?.trim();
  if (title && !DPI_TITLE.test(title)) return `name:${title.toLocaleLowerCase()}`;
  const mm = presetMillimeters(preset);
  const shape = preset.shape ?? "rect";
  if (preset.canvas) return `design:${presetNumber(mm.width)}x${presetNumber(mm.height)}:${shape}`;
  return [
    "size",
    presetNumber(mm.width),
    presetNumber(mm.height),
    presetNumber(mm.tail),
    preset.printDirection,
    shape,
    preset.split ?? "none",
    preset.splitParts ?? 2,
    preset.tailPos ?? "right",
    preset.mirror ?? "none",
  ].join("|");
}

/**
 * Presets are physical labels. Older copies stored the same size once per
 * printer density; those collapse into one millimetre preset. The same name
 * also collapses, and the later copy wins so a re-save replaces the card.
 */
export function normalizeLabelPresets(presets: LabelPreset[]): LabelPreset[] {
  const indexByKey = new Map<string, number>();
  const result: LabelPreset[] = [];

  for (const preset of presets) {
    const mm = presetMillimeters(preset);
    const title = preset.title && !DPI_TITLE.test(preset.title) ? preset.title.trim() || undefined : undefined;
    const rest = { ...preset };
    delete rest.dpmm;
    const normalized: LabelPreset = {
      ...rest,
      width: mm.width,
      height: mm.height,
      unit: "mm",
      title,
      tailLength: mm.tail,
    };
    const key = presetIdentity(normalized);
    const existing = indexByKey.get(key);
    if (existing === undefined) {
      indexByKey.set(key, result.length);
      result.push(normalized);
    } else {
      result[existing] = normalized;
    }
  }

  return result;
}

/** Paper described by a preset card, in design pixels. A saved canvas is applied separately. */
export function labelPropsFromPreset(preset: LabelPreset): LabelProps {
  const mm = presetMillimeters(preset);
  const shape = preset.shape ?? "rect";
  return {
    printDirection: preset.printDirection,
    size: {
      width: mmToPx(mm.width),
      height: mmToPx(mm.height),
    },
    shape,
    split: shape === "circle" ? "none" : (preset.split ?? "none"),
    splitParts: preset.splitParts ?? 2,
    tailPos: preset.tailPos ?? "right",
    tailLength: mm.tail > 0 ? mmToPx(mm.tail) : 0,
    mirror: shape === "circle" ? "none" : (preset.mirror ?? "none"),
    quarterTurns: preset.quarterTurns ?? 0,
    ...(preset.paperColor ? { paperColor: preset.paperColor } : {}),
  };
}
