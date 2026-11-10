import { azteccode, code128, code39, datamatrix, type DrawingContext } from "@bwip-js/generic";

export type LibraryCodeEncoding = "DATAMATRIX" | "AZTEC" | "CODE128" | "CODE39";
export type CodePoint = [number, number];
export type CodeRect = { x: number; y: number; width: number; height: number };
export interface CodeGeometry {
  width: number;
  height: number;
  rectangles: CodeRect[];
  /** Compound paths retain winding and holes from the encoder. */
  regions: CodePoint[][][];
}

const encoders = { DATAMATRIX: datamatrix, AZTEC: azteccode, CODE128: code128, CODE39: code39 };

/** The library owns symbol encoding. This adapter records its native vector geometry. */
export function encodeCode(encoding: LibraryCodeEncoding, text: string): CodeGeometry {
  if (!text) throw new Error("Enter content for the code.");
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
  const matrix = encoding === "DATAMATRIX" || encoding === "AZTEC";
  // Matrix readers otherwise assume Latin-1. Announce UTF-8 explicitly and
  // escape literal carets so user data cannot become an encoder instruction.
  const payload = matrix ? `^ECI000026${text.replaceAll("^", "^^")}` : text;
  encoder(
    {
      bcid: { DATAMATRIX: "datamatrix", AZTEC: "azteccode", CODE128: "code128", CODE39: "code39" }[encoding],
      text: payload,
      parse: false,
      parsefnc: matrix,
      scale: 1,
      includetext: false,
      height: 10,
    },
    drawing,
  );
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
