import type { CombinedRfidInfo, HeartbeatData, RfidInfo } from "@mmote/niimbluelib";
import { z } from "zod";
import { rollIdentity } from "$/utils/roll_memory";

/**
 * The ribbon tag carries a barcode and a used/total count. It does not carry
 * a color. The color is remembered on this browser for that barcode.
 */
const STORAGE_KEY = "ribbon_memory";

export const ribbonColors = ["black", "white", "red", "blue", "green", "gold", "red_black"] as const;

export type RibbonColor = (typeof ribbonColors)[number];

const ColorSchema = z.enum(ribbonColors);
const MemorySchema = z.record(z.string(), z.object({ color: ColorSchema }));

export type RibbonSnapshot = {
  state: "out" | "unread" | "ready";
  barcode?: string;
  used?: number;
  total?: number;
  remaining?: number;
  percent?: number;
  color?: RibbonColor;
};

const readMemory = (): Record<string, { color: RibbonColor }> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = MemorySchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : {};
  } catch {
    return {};
  }
};

export const recallRibbonColor = (key: string): RibbonColor | undefined => readMemory()[key]?.color;

export const rememberRibbonColor = (key: string, color: RibbonColor): void => {
  if (!ColorSchema.safeParse(color).success || key.trim() === "") return;
  const memory = readMemory();
  memory[key] = { color };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
};

/**
 * `capacity` is the length the cartridge shipped with. `allPaper` is the
 * print allowance, about 1.2× that. A capacity on a different scale is ignored.
 */
const nominalLength = (tag: RfidInfo): number => {
  const all = tag.allPaper;
  const cap = tag.capacity;
  if (cap !== undefined && Number.isFinite(cap) && cap > 0) {
    if (!Number.isFinite(all) || all <= 0) return cap;
    const ratio = cap / all;
    if (ratio > 0.5 && ratio < 1.5) return cap;
  }
  return all;
};

const usageOf = (tag: RfidInfo): { used: number; total: number; remaining: number; percent: number } | undefined => {
  const nominal = nominalLength(tag);
  const limit = Number.isFinite(tag.allPaper) && tag.allPaper > 0 ? tag.allPaper : nominal;
  const used = tag.usedPaper;
  if (!Number.isFinite(nominal) || !Number.isFinite(used) || nominal <= 0 || used < 0 || limit <= 0) return undefined;
  const usedOnCartridge = Math.min(nominal, Math.max(0, used) * (nominal / limit));
  return {
    used: usedOnCartridge,
    total: nominal,
    remaining: Math.max(0, nominal - usedOnCartridge),
    percent: Math.min(100, Math.max(0, (used / limit) * 100)),
  };
};

/**
 * The packet does not say which unit a ribbon length is in.
 * 8000 or more is millimetres (24000 → 24.0 m). 800–7999 is centimetres,
 * which is what a new 24 m M2 cartridge reports (about 2400, or ~2700
 * while the allowance is a little over the nominal length). Smaller
 * totals stay as a raw count.
 */
const metresOf = (value: number, total: number): number | undefined => {
  if (total >= 8000) return value / 1000;
  if (total >= 800) return value / 100;
  return undefined;
};

export const formatRibbonAmount = (value: number, total: number): string => {
  if (!Number.isFinite(value)) return "";
  const metres = metresOf(value, total);
  if (metres === undefined) return String(Math.max(0, Math.round(value)));
  return `${metres.toFixed(metres >= 100 ? 0 : 1)} m`;
};

export const ribbonSnapshot = (
  info: CombinedRfidInfo,
  heartbeat: HeartbeatData | undefined,
): RibbonSnapshot => {
  if (heartbeat?.ribbonInserted === false) return { state: "out" };
  const tag = info.ribbonRfidInfo;
  if (!tag?.tagPresent) return { state: "unread" };
  const barcode = rollIdentity(tag);
  const usage = usageOf(tag);
  return {
    state: "ready",
    barcode,
    used: usage?.used,
    total: usage?.total,
    remaining: usage?.remaining,
    percent: usage?.percent,
    color: barcode ? recallRibbonColor(barcode) : undefined,
  };
};
