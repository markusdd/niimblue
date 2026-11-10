import * as fabric from "fabric";
import { CanvasUtils } from "$/utils/canvas_utils";
import { encodeCode, drawCodeGeometry, type CodeGeometry } from "$/utils/code_encoder";
import { qrCodeGeometry } from "$/utils/qrcode";
import type { ErrorCorrectionLevel, Mode, QrVersion } from "$/fabric-object/qrcode";

export type MatrixEncoding = "QRCODE" | "DATAMATRIX" | "DATAMATRIX_RECT" | "MICROQR" | "AZTEC" | "PDF417";

export function isRectangularMatrixEncoding(encoding: string): boolean {
  return encoding === "PDF417" || encoding === "DATAMATRIX_RECT";
}
interface UniqueMatrixCodeProps {
  text: string;
  encoding: MatrixEncoding;
  ecl: ErrorCorrectionLevel;
  mode: Mode;
  qrVersion: QrVersion;
}
export interface MatrixCodeProps extends fabric.FabricObjectProps, UniqueMatrixCodeProps {}
export interface SerializedMatrixCodeProps extends fabric.SerializedObjectProps, UniqueMatrixCodeProps {}
const MATRIX_PROPS = ["text", "encoding", "ecl", "mode", "qrVersion"] as const;
const QUIET_MODULES = 2;

/** Editable 2D code. Encoding is cached independently of preview paint. */
export class MatrixCode<
  Props extends fabric.TOptions<MatrixCodeProps> = Partial<MatrixCodeProps>,
  SProps extends SerializedMatrixCodeProps = SerializedMatrixCodeProps,
  EventSpec extends fabric.ObjectEvents = fabric.ObjectEvents,
>
  extends fabric.FabricObject<Props, SProps, EventSpec>
  implements MatrixCodeProps
{
  static override readonly type = "MatrixCode";
  declare text: string;
  declare encoding: MatrixEncoding;
  declare ecl: ErrorCorrectionLevel;
  declare mode: Mode;
  declare qrVersion: QrVersion;
  private encodedKey?: string;
  private geometry?: CodeGeometry;
  private encodingError?: string;

  constructor(options?: Props) {
    super();
    Object.assign(this, {
      text: "NiimBlue",
      encoding: "DATAMATRIX",
      ecl: "M",
      mode: "Byte",
      qrVersion: 0,
      width:
        options?.encoding === "PDF417"
          ? 288
          : options?.encoding === "DATAMATRIX_RECT"
            ? 192
            : options?.encoding === "MICROQR"
              ? 64
              : 96,
      height: options?.encoding === "DATAMATRIX_RECT" || options?.encoding === "MICROQR" ? 64 : 96,
      fill: "#ffffff",
      stroke: "#000000",
      strokeWidth: 0,
    });
    this.setOptions(options);
    this.lockScalingFlip = true;
    this.setControlsVisibility({ ml: false, mt: false, mr: false, mb: false, tl: false, tr: false, bl: false });
  }

  override _set(key: string, value: unknown): this {
    super._set(key, value);
    if (MATRIX_PROPS.includes(key as (typeof MATRIX_PROPS)[number])) this.dirty = true;
    return this;
  }

  private getGeometry(): CodeGeometry | undefined {
    const key = JSON.stringify(
      this.encoding === "QRCODE"
        ? [this.encoding, this.text, this.ecl, this.mode, this.qrVersion]
        : [this.encoding, this.text],
    );
    if (key !== this.encodedKey) {
      this.encodedKey = key;
      this.geometry = undefined;
      this.encodingError = undefined;
      try {
        if (
          this.encoding !== "QRCODE" &&
          this.encoding !== "DATAMATRIX" &&
          this.encoding !== "DATAMATRIX_RECT" &&
          this.encoding !== "MICROQR" &&
          this.encoding !== "AZTEC" &&
          this.encoding !== "PDF417"
        )
          throw new Error("Unsupported matrix encoding.");
        this.geometry =
          this.encoding === "QRCODE"
            ? qrCodeGeometry(this.text, this.ecl, this.mode, this.qrVersion)
            : encodeCode(this.encoding, this.text);
      } catch (error) {
        this.encodingError = error instanceof Error ? error.message : String(error);
      }
    }
    return this.geometry;
  }

  setEncoding(encoding: MatrixEncoding): this {
    const wasRectangular = isRectangularMatrixEncoding(this.encoding);
    this.set("encoding", encoding);
    if (isRectangularMatrixEncoding(encoding)) {
      this.set({
        width: Math.max(encoding === "PDF417" ? 288 : 192, this.width),
        height: Math.max(encoding === "PDF417" ? 96 : 64, this.height),
      });
    } else if (wasRectangular) {
      this.set("width", this.height);
    }
    if (encoding === "QRCODE") {
      const size = Math.max(42, this.width);
      this.set({ width: size, height: size });
    }
    this.setCoords();
    return this;
  }

  getEncodingError(): string | undefined {
    const geometry = this.getGeometry();
    if (this.encodingError) return this.encodingError;
    if (geometry && this.moduleScale(geometry) < 1) return "Increase the code size or shorten its content.";
    return undefined;
  }

  private moduleScale(geometry: CodeGeometry): number {
    const quiet = this.encoding === "QRCODE" ? 4 : QUIET_MODULES;
    return Math.floor(Math.min(this.width / (geometry.width + quiet * 2), this.height / (geometry.height + quiet * 2)));
  }

  override _render(ctx: CanvasRenderingContext2D): void {
    const geometry = this.getGeometry();
    if (!geometry || this.moduleScale(geometry) < 1) {
      CanvasUtils.renderError(ctx, this.width, this.height);
      return;
    }
    const scale = this.moduleScale(geometry);
    ctx.save();
    ctx.translate(-this.width / 2, -this.height / 2);
    this._setFillStyles(ctx, this);
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.translate(
      Math.floor((this.width - geometry.width * scale) / 2),
      Math.floor((this.height - geometry.height * scale) / 2),
    );
    ctx.scale(scale, scale);
    this._setFillStyles(ctx, { fill: this.stroke || "#000000" });
    drawCodeGeometry(ctx, geometry);
    ctx.restore();
  }

  override toObject(propertiesToInclude: string[] = []) {
    return super.toObject([...MATRIX_PROPS, ...propertiesToInclude]);
  }
}

fabric.classRegistry.setClass(MatrixCode, "MatrixCode");

/** Fabric objects can outlive their constructor during a dev-server hot update. */
export function isMatrixCode(object: fabric.FabricObject | undefined): object is MatrixCode {
  return object?.isType("MatrixCode") ?? false;
}

export default MatrixCode;
