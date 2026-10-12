import { LabelType, type CombinedRfidInfo, type RfidInfo } from "@mmote/niimbluelib";
import { z } from "zod";
import type { LabelProps, LabelShape, LabelSplit, MirrorType, TailPosition } from "$/types";
import { mmToPx, pxToEditableMm } from "$/utils/label_units";
import { normalizeTurns, rotateSplit, rotateTail, swapIfOdd } from "$/utils/label_orientation";

/**
 * The RFID tag identifies the roll. Protocol 4 printers, including the M2,
 * also answer GetPaperInfo with the roll's millimetres. There is no lookup
 * against print.niimbot.com. A roll whose size the printer omits is remembered
 * on this browser the next time that barcode shows up.
 */
const STORAGE_KEY = "roll_memory";

const directionSchema = z.enum(["left", "top"]);
const shapeSchema = z.enum(["rect", "rounded_rect", "circle"]);
const splitSchema = z.enum(["none", "vertical", "horizontal"]);
const tailSchema = z.enum(["right", "bottom", "left", "top"]);
const mirrorSchema = z.enum(["none", "copy", "flip"]);

const RollRecordSchema = z.object({
  widthMm: z.number().positive(),
  heightMm: z.number().positive(),
  printDirection: directionSchema,
  shape: shapeSchema.optional(),
  split: splitSchema.optional(),
  splitParts: z.number().min(1).optional(),
  tailLengthMm: z.number().nonnegative().optional(),
  tailPos: tailSchema.optional(),
  mirror: mirrorSchema.optional(),
  labelType: z.number().optional(),
  /** Design turned clockwise relative to the roll. The millimetres stay the roll's own. */
  quarterTurns: z.number().int().min(0).max(3).optional(),
});

export type RollRecord = z.infer<typeof RollRecordSchema>;

const MemorySchema = z.record(z.string(), RollRecordSchema);

export type RollShapeFields = {
  widthMm: number;
  heightMm: number;
  tailLengthMm: number;
  printDirection: "left" | "top";
  shape: LabelShape;
  split: LabelSplit;
  splitParts: number;
  tailPos: TailPosition;
  mirror: MirrorType;
  labelType?: LabelType;
  quarterTurns: number;
};

export type RollDetection = {
  key: string;
  remaining?: number;
  roll?: RollShapeFields;
};

const roundMm = (mm: number): number => Math.round(mm * 10) / 10;

const knownLabelType = (value: number | undefined): LabelType | undefined => {
  if (value === undefined || value === LabelType.Invalid) return undefined;
  const numeric = Object.values(LabelType).filter((item) => typeof item === "number") as number[];
  return numeric.includes(value) ? (value as LabelType) : undefined;
};

export const rollIdentity = (tag: RfidInfo): string | undefined => {
  const barcode = tag.barCode?.trim();
  if (barcode) return barcode;
  const uuid = tag.uuid?.trim();
  if (uuid) return uuid;
  const serial = tag.serialNumber?.trim();
  if (serial) return serial;
  return undefined;
};

const remainingLabels = (tag: RfidInfo): number | undefined => {
  if (!Number.isFinite(tag.allPaper) || !Number.isFinite(tag.usedPaper)) return undefined;
  if (tag.allPaper <= 0 || tag.usedPaper < 0) return undefined;
  return Math.max(0, tag.allPaper - tag.usedPaper);
};

/** Millimetres from GetPaperInfo. Undefined when the printer did not report a roll size. */
export const paperMillimetres = (
  info: CombinedRfidInfo,
): { widthMm: number; heightMm: number; tailLengthMm: number; labelType?: LabelType } | undefined => {
  const paper = info.paperInfo;
  if (!paper?.valid || paper.paperWidth === undefined || paper.paperHeight === undefined) return undefined;
  const widthMm = roundMm(paper.paperWidth);
  const heightMm = roundMm(paper.paperHeight);
  if (widthMm < 3 || heightMm < 3 || widthMm > 400 || heightMm > 400) return undefined;
  let tailLengthMm = paper.tailLength !== undefined && paper.tailLength > 0 ? roundMm(paper.tailLength) : 0;
  if (tailLengthMm >= Math.max(widthMm, heightMm)) tailLengthMm = 0;
  const labelType = knownLabelType(paper.paperType) ?? knownLabelType(info.labelRfidInfo?.consumablesType);
  return { widthMm, heightMm, tailLengthMm, labelType };
};

const readMemory = (): Record<string, RollRecord> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = MemorySchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : {};
  } catch {
    return {};
  }
};

export const recallRoll = (key: string): RollRecord | undefined => readMemory()[key];

export const rememberRoll = (key: string, record: RollRecord): void => {
  const parsed = RollRecordSchema.safeParse(record);
  if (!parsed.success || key.trim() === "") return;
  const memory = readMemory();
  memory[key] = parsed.data;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
};

export const recordFromProps = (props: LabelProps, labelType?: number): RollRecord => {
  const turns = normalizeTurns(props.quarterTurns);
  const physical = swapIfOdd(props.size.width, props.size.height, turns);
  const split = props.split ?? "none";
  return {
    widthMm: pxToEditableMm(physical.width),
    heightMm: pxToEditableMm(physical.height),
    tailLengthMm: props.tailLength ? pxToEditableMm(props.tailLength) : 0,
    printDirection: props.printDirection,
    shape: props.shape ?? "rect",
    split: rotateSplit(split, 4 - turns),
    splitParts: props.splitParts ?? 2,
    tailPos: rotateTail(props.tailPos ?? "right", 4 - turns),
    mirror: props.mirror ?? "none",
    labelType,
    quarterTurns: turns,
  };
};

export const labelPropsFromRoll = (roll: RollShapeFields): LabelProps => {
  const turns = normalizeTurns(roll.quarterTurns);
  const size = swapIfOdd(mmToPx(roll.widthMm), mmToPx(roll.heightMm), turns);
  const split = roll.shape === "circle" ? "none" : rotateSplit(roll.split, turns);
  return {
    printDirection: roll.printDirection,
    size,
    shape: roll.shape,
    split,
    splitParts: roll.splitParts,
    tailPos: rotateTail(roll.tailPos, turns),
    tailLength: roll.tailLengthMm > 0 ? mmToPx(roll.tailLengthMm) : 0,
    mirror: roll.shape === "circle" ? "none" : roll.mirror,
    quarterTurns: turns,
  };
};

export const sameLabelGeometry = (a: LabelProps, b: LabelProps): boolean =>
  a.printDirection === b.printDirection &&
  a.size.width === b.size.width &&
  a.size.height === b.size.height &&
  (a.shape ?? "rect") === (b.shape ?? "rect") &&
  (a.split ?? "none") === (b.split ?? "none") &&
  (a.tailLength ?? 0) === (b.tailLength ?? 0) &&
  (a.tailPos ?? "right") === (b.tailPos ?? "right") &&
  (a.mirror ?? "none") === (b.mirror ?? "none") &&
  (a.splitParts ?? 2) === (b.splitParts ?? 2) &&
  normalizeTurns(a.quarterTurns) === normalizeTurns(b.quarterTurns);

const fieldsFromRecord = (record: RollRecord, fallbackDirection: "left" | "top"): RollShapeFields => {
  const tailLengthMm = record.tailLengthMm ?? 0;
  const printDirection = record.printDirection ?? fallbackDirection;
  return {
    widthMm: record.widthMm,
    heightMm: record.heightMm,
    tailLengthMm,
    printDirection,
    shape: record.shape ?? "rect",
    split: record.split ?? "none",
    splitParts: record.splitParts ?? 2,
    tailPos: record.tailPos ?? (tailLengthMm > 0 && printDirection === "top" ? "bottom" : "right"),
    mirror: record.mirror ?? "none",
    labelType: knownLabelType(record.labelType),
    quarterTurns: normalizeTurns(record.quarterTurns),
  };
};

/**
 * Prefer the printer's millimetres. Shape, feed direction and tail side stay
 * with the remembered roll, because the tag does not describe them.
 */
export const detectLoadedRoll = (
  info: CombinedRfidInfo,
  printerDirection: "left" | "top",
): RollDetection | undefined => {
  const tag = info.labelRfidInfo;
  if (!tag?.tagPresent) return undefined;
  const key = rollIdentity(tag);
  if (!key) return undefined;

  const remaining = remainingLabels(tag);
  const paper = paperMillimetres(info);
  const remembered = recallRoll(key);
  if (!paper && !remembered) return { key, remaining };

  const base = remembered ? fieldsFromRecord(remembered, printerDirection) : undefined;
  const widthMm = paper?.widthMm ?? base?.widthMm;
  const heightMm = paper?.heightMm ?? base?.heightMm;
  if (widthMm === undefined || heightMm === undefined) return { key, remaining };

  const tailLengthMm = paper?.tailLengthMm ?? base?.tailLengthMm ?? 0;
  const printDirection = base?.printDirection ?? printerDirection;
  const roll: RollShapeFields = {
    widthMm,
    heightMm,
    tailLengthMm,
    printDirection,
    shape: base?.shape ?? "rect",
    split: base?.split ?? "none",
    splitParts: base?.splitParts ?? 2,
    tailPos: base?.tailPos ?? (tailLengthMm > 0 && printDirection === "top" ? "bottom" : "right"),
    mirror: base?.mirror ?? "none",
    labelType: paper?.labelType ?? base?.labelType,
    quarterTurns: base?.quarterTurns ?? 0,
  };
  return { key, remaining, roll };
};

/** Identity of the physical roll. Orientation is left out so turning the design does not count as a new roll. */
export const rollSignature = (detected: RollDetection): string => {
  const roll = detected.roll;
  if (!roll) return detected.key;
  return [detected.key, roll.widthMm, roll.heightMm, roll.tailLengthMm, roll.printDirection, roll.labelType ?? ""].join(
    "|",
  );
};
