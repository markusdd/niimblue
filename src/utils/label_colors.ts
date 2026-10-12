import { type InkColor, type PaperColor } from "$/types";

export type { InkColor, PaperColor };

export const paperSwatch: Record<PaperColor, string> = {
  white: "#ffffff",
  yellow: "#f6e27a",
  pink: "#f3b7c8",
  orange: "#f3a35a",
  green: "#b7d39a",
  blue: "#a9cbe6",
  kraft: "#c6a46a",
  silver: "#d5d7dc",
  black: "#1a1a1a",
};

/** red_black is a split swatch. On the canvas it paints as the black ink. */
export const inkSwatch: Record<InkColor, string> = {
  black: "#1c1c1c",
  white: "#f7f4ee",
  red: "#c23b3b",
  blue: "#2f5f9e",
  green: "#2f7d4a",
  gold: "#c6a15a",
  red_black: "linear-gradient(90deg, #1c1c1c 50%, #c23b3b 50%)",
};

export const paperCss = (color: PaperColor | undefined): string => paperSwatch[color ?? "white"];

/**
 * Color to paint black vector ink while the editor is showing.
 * Black and red/black stay as stored, so the object cache is left alone.
 * Undefined means "do not recolor".
 */
export const inkPaint = (color: InkColor | undefined): string | undefined => {
  if (!color || color === "black" || color === "red_black") return undefined;
  return inkSwatch[color];
};

const BLACK = new Set(["black", "#000", "#000000", "#000000ff", "rgb(0,0,0)", "rgba(0,0,0,1)"]);

/** True for the default ink fills and strokes. Colored text is left as drawn. */
export const isBlackInk = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  return BLACK.has(value.trim().toLowerCase().replace(/\s+/g, ""));
};
