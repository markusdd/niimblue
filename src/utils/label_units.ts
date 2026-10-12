import type { LabelPreset } from "$/types";

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

/**
 * Presets are physical labels. Older copies stored the same size once per
 * printer density; those collapse into one millimetre preset. A preset with
 * its own title is kept even when the size matches another.
 */
export function normalizeLabelPresets(presets: LabelPreset[]): LabelPreset[] {
  const seen = new Set<string>();
  const result: LabelPreset[] = [];

  for (const preset of presets) {
    const mm = presetMillimeters(preset);
    const title = preset.title && DPI_TITLE.test(preset.title) ? undefined : preset.title;
    const geometry = [
      mm.width,
      mm.height,
      mm.tail,
      preset.printDirection,
      preset.shape ?? "rect",
      preset.split ?? "none",
      preset.splitParts ?? 2,
      preset.tailPos ?? "right",
      preset.mirror ?? "none",
    ].join("|");
    const key = title ? `${geometry}|${title}` : geometry;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push({
      width: mm.width,
      height: mm.height,
      unit: "mm",
      printDirection: preset.printDirection,
      title,
      shape: preset.shape,
      split: preset.split,
      splitParts: preset.splitParts,
      tailPos: preset.tailPos,
      tailLength: mm.tail,
      mirror: preset.mirror,
    });
  }

  return result;
}
