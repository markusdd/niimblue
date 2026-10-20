import type { LabelPanel, LabelProps, LabelShape, LabelSplit, TailPosition } from "$/types";
import { mmToPx } from "../utils/label_units";

export const STOCK_FAMILIES = ["m", "b", "d"] as const;
export type StockFamily = typeof STOCK_FAMILIES[number];

export interface LabelStock {
  id: string;
  family: StockFamily;
  widthMm: number;
  heightMm: number;
  shape: LabelShape;
  printDirection: "left" | "top";
  source: string;
  kind?: "round" | "double" | "cable" | "jewellery";
  /** Nominal individual die-cut size, separate from the carrier size. */
  cell?: { widthMm: number; heightMm: number; count: number; shape: LabelShape; nominal?: boolean };
  split?: LabelSplit;
  tailMm?: number;
  tailPos?: TailPosition;
  dimensionText?: string;
}

const industrial = "https://niimbot.com.ph/collections/white-industrial";
const smallLabels = "https://www.niimbotlabel.com/products/niimbot-d11-label-maker";
const mRefills = "https://niimbots.com/collections/label-paper-for-m2/products/thermal-transfer-label-printer-labels-for-m2";
const mRound = "https://niimbot.com.sg/products/niimbot-m2-thermal-transfer-label-paper";
const bFormats = "https://niimbot.com.sg/blogs/news/what-label-sizes-fit-the-niimbot-b21-and-b21-pro-complete-compatibility-guide";

export function stockPanelGap(stock: LabelStock): number {
  const cell = stock.cell;
  return cell ? stock.widthMm / cell.count - cell.widthMm : 0;
}

/** Center nominal die cuts within equally spaced columns; gutters are adjustable. */
export function stockPanels(stock: LabelStock, gapMm = stockPanelGap(stock)): LabelPanel[] | undefined {
  if (stock.cell) {
    const cell = stock.cell;
    const maxGap = (stock.widthMm - cell.widthMm * cell.count) / Math.max(1, cell.count - 1);
    const gap = Math.min(Math.max(0, gapMm), Math.max(0, maxGap));
    const margin = (stock.widthMm - cell.widthMm * cell.count - gap * (cell.count - 1)) / 2;
    return Array.from({ length: cell.count }, (_, index) => ({
      left: (margin + index * (cell.widthMm + gap)) / stock.widthMm,
      top: (stock.heightMm - cell.heightMm) / 2 / stock.heightMm,
      width: cell.widthMm / stock.widthMm,
      height: cell.heightMm / stock.heightMm,
      shape: cell.shape,
    }));
  }
  if (stock.tailMm) {
    return [{ left: 0, top: 0, width: 1, height: (stock.heightMm - stock.tailMm) / stock.heightMm, shape: stock.shape }];
  }
  return undefined;
}

/** Stock formats, not an inventory feed or a guarantee of printer compatibility.
 * Sources and dimension/orientation conventions: LABEL_STOCK_SOURCES.md.
 */
export const LABEL_STOCK: readonly LabelStock[] = [
  { id: "m-30-20", family: "m", widthMm: 30, heightMm: 20, shape: "rect", printDirection: "top", source: industrial },
  { id: "m-30-60", family: "m", widthMm: 30, heightMm: 60, shape: "rect", printDirection: "top", source: industrial },
  { id: "m-40-30", family: "m", widthMm: 40, heightMm: 30, shape: "rect", printDirection: "top", source: industrial },
  { id: "m-40-60", family: "m", widthMm: 40, heightMm: 60, shape: "rect", printDirection: "top", source: industrial },
  { id: "m-50-20", family: "m", widthMm: 50, heightMm: 20, shape: "rect", printDirection: "top", source: industrial },
  { id: "m-50-30", family: "m", widthMm: 50, heightMm: 30, shape: "rect", printDirection: "top", source: industrial },
  { id: "b-30-20", family: "b", widthMm: 30, heightMm: 20, shape: "rect", printDirection: "top", source: "https://niimbot.com.ph/products/white-thermal-labels-30-20mm-320-pcs-standard-b-series" },
  { id: "b-30-square", family: "b", widthMm: 30, heightMm: 30, shape: "rect", printDirection: "top", source: "https://niimbot.com.ph/products/white-square-thermal-labels-30-30mm-230-pcs-standard-b-series" },
  { id: "b-30-round", family: "b", widthMm: 30, heightMm: 30, shape: "circle", printDirection: "top", source: "https://niimbot.com.ph/products/white-round-thermal-labels-31-31mm-210-pcs-standard-b-series" },
  { id: "b-40-30", family: "b", widthMm: 40, heightMm: 30, shape: "rect", printDirection: "top", source: "https://niimbot.com.ph/collections/colored-labels-office" },
  { id: "b-50-30", family: "b", widthMm: 50, heightMm: 30, shape: "rect", printDirection: "top", source: "https://niimbot.eu/en/product/niimbot-labels-stickers-5030mm-green-230pcs/" },
  { id: "b-50-round", family: "b", widthMm: 50, heightMm: 50, shape: "circle", printDirection: "top", source: "https://niimbot.com.ph/products/white-round-thermal-labels-51-51mm-140-pcs-standard-b-series" },
  { id: "b-50-80", family: "b", widthMm: 50, heightMm: 80, shape: "rect", printDirection: "top", source: "https://niimbot.com.ph/products/kraft-paper-labels-50-80mm-95-pcs-b-series" },
  { id: "d-30-12", family: "d", widthMm: 30, heightMm: 12, shape: "rect", printDirection: "left", source: smallLabels },
  { id: "d-40-12", family: "d", widthMm: 40, heightMm: 12, shape: "rect", printDirection: "left", source: smallLabels },
  { id: "d-40-14", family: "d", widthMm: 40, heightMm: 14, shape: "rect", printDirection: "left", source: smallLabels },
  { id: "d-30-15", family: "d", widthMm: 30, heightMm: 15, shape: "rect", printDirection: "left", source: "https://www.niimbotlabel.com/pages/niimbot-d110-labels-stickers" },
  // Additional finishes sharing the same geometry deliberately share one format.
  ...([[40, 20], [40, 40], [50, 70], [50, 80]] as const).map(([widthMm, heightMm]): LabelStock => ({
    id: `m-${widthMm}-${heightMm}`, family: "m", widthMm, heightMm, shape: "rect", printDirection: "top", source: mRefills,
  })),
  ...([20, 30, 31, 50] as const).map((diameter): LabelStock => ({
    id: `m-${diameter}-round`, family: "m", widthMm: diameter, heightMm: diameter, shape: "circle", kind: "round", printDirection: "top", source: diameter === 30 || diameter === 50 ? mRound : mRefills,
  })),
  ...([[40, 20], [40, 60]] as const).map(([widthMm, heightMm]): LabelStock => ({
    id: `b-${widthMm}-${heightMm}`, family: "b", widthMm, heightMm, shape: "rect", printDirection: "top", source: bFormats,
  })),
  ...([[34, 17, 14], [28, 15, 12], [24, 13, 10]] as const).map(([widthMm, heightMm, diameter]): LabelStock => ({
    id: `m-double-${diameter}`, family: "m", widthMm, heightMm, shape: "rect", kind: "double", printDirection: "top", source: mRefills,
    cell: { widthMm: diameter, heightMm: diameter, count: 2, shape: "circle" }, dimensionText: `2 × Ø ${diameter} mm · ${widthMm} × ${heightMm} mm`,
  })),
  { id: "b-double-20-round", family: "b", widthMm: 42, heightMm: 21, shape: "rect", kind: "double", printDirection: "top", source: "https://niimbot.com.ph/products/transparent-thermal-labels-42-21-mm-320-pcs-b-series", cell: { widthMm: 20, heightMm: 20, count: 2, shape: "circle" }, dimensionText: "2 × Ø 20 mm · 42 × 21 mm" },
  // Only the full row is specified by these listings. Even cells are an editable
  // starting layout, not a claim about the die-cut size or manufacturing gutter.
  { id: "m-double-rect-24-14", family: "m", widthMm: 24, heightMm: 14, shape: "rect", kind: "double", printDirection: "top", source: "https://niimbot.com.ph/products/white-labels-24-14mm-double-row-960-pcs-m-series", cell: { widthMm: 12, heightMm: 14, count: 2, shape: "rect", nominal: true } },
  { id: "b-double-rect-30-15", family: "b", widthMm: 30, heightMm: 15, shape: "rect", kind: "double", printDirection: "top", source: industrial, cell: { widthMm: 15, heightMm: 15, count: 2, shape: "rect", nominal: true } },
  ...(["m", "b"] as const).map((family): LabelStock => ({
    id: `${family}-cable-25-78`, family, widthMm: 25, heightMm: 78, shape: "rect", kind: "cable", printDirection: "top", split: "vertical", tailMm: 40, tailPos: "bottom", dimensionText: "25 × 38 + 40 mm",
    source: family === "m" ? mRefills : "https://niimbot.com.ph/products/green-wrap-cable-labels-25-38-40mm-100-pcs-b-series",
  })),
  ...(["m", "b"] as const).map((family): LabelStock => ({
    id: `${family}-jewellery-30-70`, family, widthMm: 30, heightMm: 70, shape: "rect", kind: "jewellery", printDirection: "top", split: "vertical", tailMm: 45, tailPos: "bottom", dimensionText: "30 × 25 + 45 mm",
    source: family === "m" ? "https://communets.com/product/niimbot-labels-30x25-45mm-95pcs-white-labels-removable-white-compatible-with-m2-m3" : "https://niimbot.com.au/products/niimbot-thermal-label-white-jewel-25-30-45mm-for-b21-b1-b3s-b31",
  })),
];

/** Change the paper format while retaining the design's preview colours. */
export function labelPropsForStock(stock: LabelStock, current: LabelProps): LabelProps {
  return {
    ...current,
    size: { width: mmToPx(stock.widthMm), height: mmToPx(stock.heightMm) },
    shape: stock.shape,
    printDirection: stock.printDirection,
    quarterTurns: 0,
    panels: stockPanels(stock),
    split: stock.split ?? "none",
    splitParts: 2,
    tailLength: stock.tailMm ? mmToPx(stock.tailMm) : 0,
    tailPos: stock.tailPos ?? "right",
    mirror: "none",
  };
}
