import {
  azteccode,
  code128,
  code39,
  datamatrix,
  datamatrixrectangular,
  microqrcode,
  ean8,
  upca,
  pdf417,
  type DrawingContext,
} from "@bwip-js/generic";

export type LibraryCodeEncoding =
  | "DATAMATRIX"
  | "DATAMATRIX_RECT"
  | "MICROQR"
  | "AZTEC"
  | "PDF417"
  | "CODE128"
  | "CODE39"
  | "EAN8"
  | "UPCA";
export type CodePoint = [number, number];
export type CodeRect = { x: number; y: number; width: number; height: number };
export interface CodeGeometry {
  width: number;
  height: number;
  rectangles: CodeRect[];
  /** Compound paths retain winding and holes from the encoder. */
  regions: CodePoint[][][];
}

const encoders = {
  DATAMATRIX: datamatrix,
  DATAMATRIX_RECT: datamatrixrectangular,
  MICROQR: microqrcode,
  AZTEC: azteccode,
  PDF417: pdf417,
  CODE128: code128,
  CODE39: code39,
  EAN8: ean8,
  UPCA: upca,
};
const encoderNames = {
  DATAMATRIX: "datamatrix",
  DATAMATRIX_RECT: "datamatrixrectangular",
  MICROQR: "microqrcode",
  AZTEC: "azteccode",
  PDF417: "pdf417",
  CODE128: "code128",
  CODE39: "code39",
  EAN8: "ean8",
  UPCA: "upca",
};

/** Complete short retail input so the caption and encoded check digit always agree. */
export function retailCodeText(encoding: "EAN8" | "UPCA", text: string): string {
  const length = encoding === "EAN8" ? 8 : 12;
  const name = encoding === "EAN8" ? "EAN-8" : "UPC-A";
  if (/[^0-9]/.test(text) || (text.length !== length - 1 && text.length !== length))
    throw new Error(`${name} requires ${length - 1} digits, or ${length} including the check digit.`);
  const data = text.slice(0, length - 1);
  let sum = 0;
  for (let i = 0; i < data.length; i++) sum += Number(data[data.length - 1 - i]) * (i % 2 === 0 ? 3 : 1);
  const check = String((10 - (sum % 10)) % 10);
  if (text.length === length && text[length - 1] !== check) throw new Error(`${name} check digit must be ${check}.`);
  return data + check;
}

/** The library owns symbol encoding. This adapter records its native vector geometry. */
export function encodeCode(encoding: LibraryCodeEncoding, text: string): CodeGeometry {
  if (!text) throw new Error("Enter content for the code.");
  // Micro QR has no ECI marker to identify UTF-8. Keep its data unambiguous
  // across readers, rather than depending on a scanner's charset guess.
  if (encoding === "MICROQR" && [...text].some((char) => char.charCodeAt(0) > 127))
    throw new Error("Use QR Code or Data Matrix for non-ASCII text.");
  if (encoding === "CODE128" && [...text].some((char) => char.charCodeAt(0) > 127))
    throw new Error("Code128 supports ASCII characters. Use a 2D code for other text.");
  if (encoding === "CODE39" && !/^[0-9A-Z .$/+%-]+$/.test(text))
    throw new Error("Code39 supports uppercase letters, numbers, spaces and - . $ / + %.");
  const geometry: CodeGeometry = { width: 0, height: 0, rectangles: [], regions: [] };
  let polygons: CodePoint[][] = [];
  const unsupported = (): never => {
    throw new Error("Unsupported drawing primitive in code encoder.");
  };
  const drawing: DrawingContext<CodeGeometry> = {
    scale: () => [1, 1],
    init(width, height) {
      geometry.width = width;
      geometry.height = height;
    },
    line(x0, y0, x1, y1, lineWidth) {
      if (x0 !== x1 && y0 !== y1) unsupported();
      // bwip assigns the larger half of an odd-width pen to the left/top.
      // Keep these edges integral so one-module bars retain their exact widths.
      geometry.rectangles.push(
        x0 === x1
          ? { x: x0 - Math.ceil(lineWidth / 2), y: Math.min(y0, y1), width: lineWidth, height: Math.abs(y1 - y0) }
          : { x: Math.min(x0, x1), y: y0 - Math.ceil(lineWidth / 2), width: Math.abs(x1 - x0), height: lineWidth },
      );
    },
    polygon(points) {
      polygons.push(points.map(([x, y]) => [x, y]));
    },
    fill() {
      if (polygons.length) geometry.regions.push(polygons);
      polygons = [];
    },
    // Captions belong to the editable Fabric barcode object, not the encoder.
    measure: unsupported,
    text: unsupported,
    ellipse: unsupported,
    hexagon: unsupported,
    end: () => geometry,
  };
  const encoder = encoders[encoding];
  if (!encoder) throw new Error("Unsupported code encoding.");
  const matrix =
    encoding === "DATAMATRIX" || encoding === "DATAMATRIX_RECT" || encoding === "AZTEC" || encoding === "PDF417";
  // Matrix readers otherwise assume Latin-1. Announce UTF-8 explicitly and
  // escape literal carets so user data cannot become an encoder instruction.
  const payload = matrix
    ? `^ECI000026${text.replaceAll("^", "^^")}`
    : encoding === "EAN8" || encoding === "UPCA"
      ? retailCodeText(encoding, text)
      : text;
  try {
    encoder(
      {
        bcid: encoderNames[encoding],
        text: payload,
        parse: false,
        parsefnc: matrix,
        scale: 1,
        includetext: false,
        height: 10,
      },
      drawing,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (encoding === "MICROQR" && message.startsWith("bwipp.qrcodeNoValidSymbol"))
      throw new Error("Content exceeds Micro QR capacity. Shorten it or use QR Code or Data Matrix.");
    if (encoding === "DATAMATRIX_RECT" && message.startsWith("bwipp.datamatrixNoValidSymbol"))
      throw new Error("Content exceeds rectangular Data Matrix capacity. Shorten it or use square Data Matrix.");
    throw error;
  }
  if (!(geometry.width > 0 && geometry.height > 0)) throw new Error("The encoder returned an empty code.");
  return geometry;
}

/** Callers keep horizontal bars and square matrix modules on an integer pixel grid. */
export function drawCodeGeometry(ctx: CanvasRenderingContext2D, geometry: CodeGeometry): void {
  for (const rect of geometry.rectangles) ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
  for (const region of geometry.regions) {
    ctx.beginPath();
    for (const points of region) {
      ctx.moveTo(points[0][0], points[0][1]);
      for (const [x, y] of points.slice(1)) ctx.lineTo(x, y);
      ctx.closePath();
    }
    ctx.fill();
  }
}
