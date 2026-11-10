import * as fabric from "fabric";
import { CanvasUtils } from "$/utils/canvas_utils";
import { encodeCode, drawCodeGeometry, type CodeGeometry } from "$/utils/code_encoder";

export type MatrixEncoding = "DATAMATRIX" | "AZTEC";
interface UniqueMatrixCodeProps {
  text: string;
  encoding: MatrixEncoding;
}
export interface MatrixCodeProps extends fabric.FabricObjectProps, UniqueMatrixCodeProps {}
export interface SerializedMatrixCodeProps extends fabric.SerializedObjectProps, UniqueMatrixCodeProps {}
const MATRIX_PROPS = ["text", "encoding"] as const;
const QUIET_MODULES = 2;

/** Editable Data Matrix/Aztec object. Encoding is cached independently of preview paint. */
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
  private encodedKey?: string;
  private geometry?: CodeGeometry;
  private encodingError?: string;

  constructor(options?: Props) {
    super();
    Object.assign(this, {
      text: "NiimBlue",
      encoding: "DATAMATRIX",
      width: 96,
      height: 96,
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
    if (key === "text" || key === "encoding") this.dirty = true;
    return this;
  }

  private getGeometry(): CodeGeometry | undefined {
    const key = JSON.stringify([this.encoding, this.text]);
    if (key !== this.encodedKey) {
      this.encodedKey = key;
      this.geometry = undefined;
      this.encodingError = undefined;
      try {
        if (this.encoding !== "DATAMATRIX" && this.encoding !== "AZTEC")
          throw new Error("Unsupported matrix encoding.");
        this.geometry = encodeCode(this.encoding, this.text);
      } catch (error) {
        this.encodingError = error instanceof Error ? error.message : String(error);
      }
    }
    return this.geometry;
  }

  getEncodingError(): string | undefined {
    const geometry = this.getGeometry();
    if (this.encodingError) return this.encodingError;
    if (geometry && this.moduleScale(geometry) < 1) return "Increase the code size or shorten its content.";
    return undefined;
  }

  private moduleScale(geometry: CodeGeometry): number {
    return Math.floor(
      Math.min(this.width / (geometry.width + QUIET_MODULES * 2), this.height / (geometry.height + QUIET_MODULES * 2)),
    );
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
export default MatrixCode;
