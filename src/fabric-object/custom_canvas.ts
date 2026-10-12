import * as fabric from "fabric";
import { DEFAULT_LABEL_PROPS, GRID_SIZE } from "$/defaults";
import type { LabelProps } from "$/types";
import { workingEdge } from "$/utils/label_orientation";

type LabelBounds = {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  width: number;
  height: number;
};
type FoldSegment = { start: number; end: number };
type FoldInfo = {
  axis: "vertical" | "horizontal" | "none";
  points: number[];
  segments: FoldSegment[];
};
type MirrorInfo = { pos: fabric.Point; flip: boolean };

export class CustomCanvas extends fabric.Canvas {
  private labelProps: LabelProps = DEFAULT_LABEL_PROPS;
  private readonly SEPARATOR_LINE_WIDTH = 2;
  private readonly TAIL_WIDTH = 40;
  private readonly GRAY = "#CFCFCF";
  private readonly MIRROR_GHOST_COLOR = "rgba(0, 0, 0, 0.3)";
  private customBackground: boolean = true;
  private highlightMirror: boolean = true;
  private gridEnabled: boolean = false;
  private virtualZoomRatio: number = 1;
  onZoomChange?: (zoom: number) => void;

  constructor(
    el?: string | HTMLCanvasElement,
    options?: fabric.TOptions<fabric.CanvasOptions>,
  ) {
    super(el, options);
    this.setupZoomAndPan();
    this.preserveObjectStacking = true;
  }

  private setupZoomAndPan() {
    this.on("mouse:wheel", (opt) => {
      const event = opt.e as WheelEvent;

      if (event.ctrlKey) {
        event.preventDefault();

        const delta = event.deltaY;
        if (delta > 0) {
          this.virtualZoomOut();
        } else {
          this.virtualZoomIn();
        }
      }
    });

    const container = this.getElement().parentElement;
    if (!container) return;

    let initialPinchDistance = 0;
    let initialZoom = 1;
    let lastMidPoint = { x: 0, y: 0 };

    container.addEventListener(
        "touchstart",
        (e: TouchEvent) => {
          if (e.touches.length === 2) {
            this.selection = false;
            this.discardActiveObject();

            const touch1 = e.touches[0];
            const touch2 = e.touches[1];

            initialPinchDistance = Math.hypot(
                touch1.clientX - touch2.clientX,
                touch1.clientY - touch2.clientY,
            );
            initialZoom = this.getVirtualZoom();

            lastMidPoint = {
              x: (touch1.clientX + touch2.clientX) / 2,
              y: (touch1.clientY + touch2.clientY) / 2,
            };
          } else if (e.touches.length === 1) {

          }
        },
        { passive: false },
    );

    container.addEventListener(
        "touchmove",
        (e: TouchEvent) => {
          if (e.touches.length === 2) {
            e.preventDefault();

            const touch1 = e.touches[0];
            const touch2 = e.touches[1];

            // Zoom
            const currentPinchDistance = Math.hypot(
                touch1.clientX - touch2.clientX,
                touch1.clientY - touch2.clientY,
            );

            if (initialPinchDistance > 0) {
              const newZoom = currentPinchDistance / initialPinchDistance * initialZoom;
              if (Math.abs(newZoom - this.virtualZoomRatio) > 0.02) {
                if (isFinite(newZoom) && newZoom > 0) {
                  this.virtualZoom(newZoom);
                }
              }
            }

            // Pan
            const currentMidPoint = {
              x: (touch1.clientX + touch2.clientX) / 2,
              y: (touch1.clientY + touch2.clientY) / 2,
            };

            const dx = currentMidPoint.x - lastMidPoint.x;
            const dy = currentMidPoint.y - lastMidPoint.y;

            const wrapper = this.getElement().closest(".canvas-wrapper");
            if (wrapper) {
              wrapper.scrollLeft -= dx;
              wrapper.scrollTop -= dy;
            }
            lastMidPoint = currentMidPoint;
          }
        },
        { passive: false },
    );

    const stopTouch = (e: TouchEvent) => {
      if (e.touches.length === 0) {
        // If not adding this delay, it could happen that objects are selected after zooming/panning
        setTimeout(() => {
          this.selection = true;
        }, 10);
      }
    };
    container.addEventListener("touchend", stopTouch);
    container.addEventListener("touchcancel", stopTouch);
  }

  public virtualZoom(newZoom: number) {
    this.virtualZoomRatio = Math.min(Math.max(0.25, newZoom), 4);
    this.setDimensions(
      {
        width: this.virtualZoomRatio * this.getWidth() + "px",
        height: this.virtualZoomRatio * this.getHeight() + "px",
      },
      { cssOnly: true },
    );
    if (this.onZoomChange) {
      this.onZoomChange(this.virtualZoomRatio);
    }
  }

  public virtualZoomIn() {
    this.virtualZoom(this.virtualZoomRatio * 1.05);
  }

  public virtualZoomOut() {
    this.virtualZoom(this.virtualZoomRatio * 0.95);
  }

  public getVirtualZoom(): number {
    return this.virtualZoomRatio;
  }

  public resetVirtualZoom() {
    this.virtualZoom(1);
  }

  setLabelProps(value: LabelProps) {
    this.labelProps = value;
    this.requestRenderAll();
  }

  setCustomBackground(value: boolean) {
    this.customBackground = value;
  }

  setHighlightMirror(value: boolean) {
    this.highlightMirror = value;
  }

  setGridEnabled(value: boolean) {
    this.gridEnabled = value;
    this.requestRenderAll();
  }

  private paperRadius(): number {
    const bb = this.getLabelBounds();
    return Math.max(6, Math.round(Math.min(bb.width, bb.height) * 0.12));
  }

  /** Outline of the printable paper. Corners outside this stay empty. */
  private tracePaperPath(ctx: CanvasRenderingContext2D) {
    const width = this.width ?? 1;
    const height = this.height ?? 1;
    ctx.beginPath();

    if (this.labelProps.shape === "circle") {
      const radius = Math.min(width, height) / 2;
      ctx.arc(width / 2, height / 2, radius, 0, Math.PI * 2);
      return;
    }

    const bb = this.getLabelBounds();
    const splitParts = this.labelProps.splitParts ?? 2;
    const radiusFor = (partWidth: number, partHeight: number) =>
      Math.min(this.paperRadius(), partWidth / 2, partHeight / 2);

    if (this.labelProps.shape === "rounded_rect") {
      if (this.labelProps.split === "horizontal" && splitParts >= 2) {
        const segmentHeight = bb.height / splitParts;
        const radius = radiusFor(bb.width, segmentHeight);
        ctx.roundRect(bb.startX, bb.startY, bb.width, segmentHeight, radius);
        this.getFoldInfo().points.forEach((y) =>
          ctx.roundRect(bb.startX, y, bb.width, segmentHeight, radius),
        );
      } else if (this.labelProps.split === "vertical" && splitParts >= 2) {
        const segmentWidth = bb.width / splitParts;
        const radius = radiusFor(segmentWidth, bb.height);
        ctx.roundRect(bb.startX, bb.startY, segmentWidth, bb.height, radius);
        this.getFoldInfo().points.forEach((x) =>
          ctx.roundRect(x, bb.startY, segmentWidth, bb.height, radius),
        );
      } else {
        const radius = radiusFor(bb.width, bb.height);
        ctx.roundRect(bb.startX, bb.startY, bb.width, bb.height, radius);
      }
      return;
    }

    ctx.rect(bb.startX, bb.startY, bb.width, bb.height);
  }

  private drawTail(ctx: CanvasRenderingContext2D) {
    if (this.labelProps.tailLength === undefined || this.labelProps.tailLength <= 0) {
      return;
    }

    const bb = this.getLabelBounds();
    const roundRadius = this.labelProps.shape === "rounded_rect" ? this.paperRadius() : 0;
    ctx.fillStyle = this.GRAY;
    ctx.beginPath();

    if (this.labelProps.tailPos === "right") {
      ctx.rect(
        bb.endX - roundRadius,
        bb.endY / 2 - this.TAIL_WIDTH / 2,
        (this.width ?? 0) - bb.endX + roundRadius,
        this.TAIL_WIDTH,
      );
    } else if (this.labelProps.tailPos === "bottom") {
      ctx.rect(
        bb.endX / 2 - this.TAIL_WIDTH / 2,
        bb.endY - roundRadius,
        this.TAIL_WIDTH,
        (this.height ?? 0) - bb.endY + roundRadius,
      );
    } else if (this.labelProps.tailPos === "left") {
      ctx.rect(0, bb.endY / 2 - this.TAIL_WIDTH / 2, bb.startX + roundRadius, this.TAIL_WIDTH);
    } else if (this.labelProps.tailPos === "top") {
      ctx.rect(bb.endX / 2 - this.TAIL_WIDTH / 2, 0, this.TAIL_WIDTH, bb.startY + roundRadius);
    }

    ctx.fill();
  }

  private drawPrintStart(ctx: CanvasRenderingContext2D) {
    const width = this.width ?? 1;
    const height = this.height ?? 1;
    const bb = this.getLabelBounds();
    // Sit inside the paper. A stroke on the clip boundary disappears,
    // which used to hide the mark once it moved onto a side edge.
    const inset = 8;
    ctx.save();
    ctx.strokeStyle = "#c4554a";
    ctx.lineWidth = 3;
    ctx.lineCap = "butt";
    ctx.beginPath();

    const edge = workingEdge(this.labelProps.printDirection, this.labelProps.quarterTurns);
    if (this.labelProps.shape === "circle") {
      const radius = Math.min(width, height) / 2 - inset;
      const cx = width / 2;
      const cy = height / 2;
      const arc: Record<typeof edge, [number, number]> = {
        top: [-Math.PI * 0.8, -Math.PI * 0.2],
        right: [-Math.PI * 0.3, Math.PI * 0.3],
        bottom: [Math.PI * 0.2, Math.PI * 0.8],
        left: [Math.PI * 0.7, Math.PI * 1.3],
      };
      ctx.arc(cx, cy, Math.max(4, radius), arc[edge][0], arc[edge][1]);
    } else if (edge === "top") {
      ctx.moveTo(bb.startX, bb.startY + inset);
      ctx.lineTo(bb.endX, bb.startY + inset);
    } else if (edge === "bottom") {
      ctx.moveTo(bb.startX, bb.endY - inset);
      ctx.lineTo(bb.endX, bb.endY - inset);
    } else if (edge === "left") {
      ctx.moveTo(bb.startX + inset, bb.startY);
      ctx.lineTo(bb.startX + inset, bb.endY);
    } else {
      ctx.moveTo(bb.endX - inset, bb.startY);
      ctx.lineTo(bb.endX - inset, bb.endY);
    }

    ctx.stroke();
    ctx.restore();
  }

  private drawGrid(ctx: CanvasRenderingContext2D) {
    if (!this.gridEnabled) {
      return;
    }

    const bb = this.getLabelBounds();
    ctx.save();
    ctx.setLineDash([]);
    ctx.strokeStyle = "rgba(70, 78, 110, 0.55)";
    ctx.lineWidth = 1;
    ctx.beginPath();

    const step = GRID_SIZE * 5;
    for (let x = bb.startX + step; x < bb.endX; x += step) {
      ctx.moveTo(x, bb.startY);
      ctx.lineTo(x, bb.endY);
    }
    for (let y = bb.startY + step; y < bb.endY; y += step) {
      ctx.moveTo(bb.startX, y);
      ctx.lineTo(bb.endX, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  /** Get label bounds without tail */
  getLabelBounds(): LabelBounds {
    let endX = this.width ?? 1;
    let endY = this.height ?? 1;
    let startX = 0;
    let startY = 0;

    if (this.labelProps.tailPos === "right") {
      endX -= this.labelProps.tailLength ?? 0;
    } else if (this.labelProps.tailPos === "bottom") {
      endY -= this.labelProps.tailLength ?? 0;
    } else if (this.labelProps.tailPos === "left") {
      startX += this.labelProps.tailLength ?? 0;
    } else if (this.labelProps.tailPos === "top") {
      startY += this.labelProps.tailLength ?? 0;
    }

    const width = endX - startX;
    const height = endY - startY;

    return { startX, startY, endX, endY, width, height };
  }

  /** Get fold line position for splitted labels */
  getFoldInfo(): FoldInfo {
    const bb = this.getLabelBounds();
    const points: number[] = [];
    const segments: FoldSegment[] = [];
    const splitParts = this.labelProps.splitParts ?? 2;

    if (splitParts < 2) {
      return { axis: "none", points, segments };
    }

    if (this.labelProps.split === "horizontal") {
      const segmentHeight = bb.height / splitParts;
      let lastY: number = bb.startY;

      for (let i = 1; i < splitParts; i++) {
        const y =
          bb.startY + segmentHeight * i - this.SEPARATOR_LINE_WIDTH / 2 + 1;
        points.push(y);
        segments.push({ start: lastY, end: y });
        lastY = y;
      }

      segments.push({ start: lastY, end: bb.endY });

      return { axis: "horizontal", points, segments };
    } else if (this.labelProps.split === "vertical") {
      const segmentWidth = bb.width / splitParts;
      let lastX: number = bb.startX;

      for (let i = 1; i < splitParts; i++) {
        const x =
          bb.startX + segmentWidth * i - this.SEPARATOR_LINE_WIDTH / 2 + 1;
        points.push(x);
        segments.push({ start: lastX, end: x });
        lastX = x;
      }

      segments.push({ start: lastX, end: bb.endX });

      return { axis: "vertical", points, segments };
    }

    return { axis: "none", points, segments };
  }

  override _renderBackground(ctx: CanvasRenderingContext2D) {
    if (this.width === undefined || this.height === undefined) {
      return;
    }

    ctx.save();

    // Print preview wants a solid white bitmap. The editor leaves the
    // corners outside a round label empty so the desk shows through.
    if (!this.customBackground) {
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.restore();
      return;
    }

    if (this.labelProps.shape !== "circle") {
      this.drawTail(ctx);
    }

    ctx.fillStyle = "white";
    this.tracePaperPath(ctx);
    ctx.fill();

    ctx.strokeStyle = "rgba(40, 32, 22, 0.28)";
    ctx.lineWidth = 1;
    this.tracePaperPath(ctx);
    ctx.stroke();

    ctx.save();
    this.tracePaperPath(ctx);
    ctx.clip();
    this.drawGrid(ctx);
    this.drawPrintStart(ctx);
    ctx.restore();

    const bb = this.getLabelBounds();
    const fold = this.getFoldInfo();
    const roundRadius = this.labelProps.shape === "rounded_rect" ? this.paperRadius() : 0;
    ctx.strokeStyle = this.GRAY;
    ctx.lineWidth = this.SEPARATOR_LINE_WIDTH;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();

    if (fold.axis === "horizontal") {
      fold.points.forEach((y) => {
        ctx.moveTo(bb.startX + roundRadius, y);
        ctx.lineTo(bb.endX - roundRadius, y);
      });
    } else if (fold.axis === "vertical") {
      fold.points.forEach((x) => {
        ctx.moveTo(x, bb.startY + roundRadius);
        ctx.lineTo(x, bb.endY - roundRadius);
      });
    }

    ctx.stroke();
    ctx.restore();
  }
  override _renderObjects(
    ctx: CanvasRenderingContext2D,
    objects: fabric.FabricObject[],
  ) {
    const clipToPaper =
      this.customBackground &&
      (this.labelProps.shape === "circle" || this.labelProps.shape === "rounded_rect");

    if (clipToPaper) {
      ctx.save();
      this.tracePaperPath(ctx);
      ctx.clip();
    }

    super._renderObjects(ctx, objects);

    if (clipToPaper) {
      ctx.restore();
    }

    if (!this.highlightMirror || this.getActiveObjects().length > 1) {
      return;
    }

    ctx.save();

    objects.forEach((obj) => {
      const infos = this.getMirroredObjectCoords(obj);
      infos.forEach((info) => {
        const bbox = obj.getBoundingRect();
        ctx.fillStyle = this.MIRROR_GHOST_COLOR;
        ctx.fillRect(
          info.pos.x - bbox.width / 2,
          info.pos.y - bbox.height / 2,
          bbox.width,
          bbox.height,
        );
        ctx.restore();
      });
    });
    ctx.restore();
  }

  /**
   * Return new object positions (origin is center) if object needs mirroring
   **/
  getMirroredObjectCoords(obj: fabric.FabricObject): MirrorInfo[] {
    const fold = this.getFoldInfo();
    const result: MirrorInfo[] = [];

    if (
      fold.axis === "none" ||
      !(this.labelProps.mirror === "flip" || this.labelProps.mirror === "copy")
    ) {
      return result;
    }

    const bounds = this.getLabelBounds();

    if (fold.axis === "vertical") {
      if (this.labelProps.mirror === "copy") {
        fold.points.forEach((x) => {
          const pos = obj.getPointByOrigin("center", "center");
          pos.setX(x + (pos.x - bounds.startX));
          result.push({ pos, flip: false });
        });
      } else if (
        this.labelProps.mirror === "flip" &&
        fold.points.length === 1
      ) {
        // Half split only supported
        const axisX = fold.points[0];
        const pos = obj.getPointByOrigin("center", "center");
        pos.setX(axisX + (axisX - pos.x));
        pos.setY(bounds.startY + bounds.endY - pos.y);
        result.push({ pos, flip: true });
      }
    } else if (fold.axis === "horizontal") {
      if (this.labelProps.mirror === "copy") {
        fold.points.forEach((y) => {
          const pos = obj.getPointByOrigin("center", "center");
          pos.setY(y + (pos.y - bounds.startY));
          result.push({ pos, flip: false });
        });
      } else if (
        this.labelProps.mirror === "flip" &&
        fold.points.length === 1
      ) {
        // Half split only supported
        const axisY = fold.points[0];
        const pos = obj.getPointByOrigin("center", "center");
        pos.setY(axisY + (axisY - pos.y));
        pos.setX(bounds.startX + bounds.endX - pos.x);
        result.push({ pos, flip: true });
      }
    }

    return result;
  }

  /** Clone mirrored objects and add them to canvas */
  async createMirroredObjects() {
    const objects = this.getObjects();
    for (const obj of objects) {
      const infos = this.getMirroredObjectCoords(obj);

      for (const info of infos) {
        const newObj = await obj.clone();
        newObj.setPositionByOrigin(info.pos, "center", "center");
        if (info.flip) {
          newObj.centeredRotation = true;
          newObj.rotate((newObj.angle + 180) % 360);
        }
        this.add(newObj);
      }
    }
  }

  /** Centers object horizontally in the canvas or label part */
  override centerObjectH(object: fabric.FabricObject): void {
    if ((this.labelProps.split ?? "none") !== "none") {
      const pos = object.getPointByOrigin("center", "center");
      const bounds = this.getLabelBounds();
      const fold = this.getFoldInfo();
      let centerX = bounds.startX + bounds.width / 2;

      if (fold.axis !== "horizontal") {
        fold.segments.forEach((seg) => {
          if (pos.x >= seg.start && pos.x <= seg.end) {
            centerX = seg.start + (seg.end - seg.start) / 2;
          }
        });
      }
      pos.setX(centerX);

      object.setPositionByOrigin(pos, "center", "center");
      return;
    }

    super.centerObjectH(object);
  }

  /** Centers object vertically in the canvas or label part */
  override centerObjectV(object: fabric.FabricObject): void {
    if ((this.labelProps.split ?? "none") !== "none") {
      const pos = object.getPointByOrigin("center", "center");
      const bounds = this.getLabelBounds();
      const fold = this.getFoldInfo();
      let centerY = bounds.startY + bounds.height / 2;

      if (fold.axis !== "vertical") {
        fold.segments.forEach((seg) => {
          if (pos.y >= seg.start && pos.y <= seg.end) {
            centerY = seg.start + (seg.end - seg.start) / 2;
          }
        });
      }

      pos.setY(centerY);
      object.setPositionByOrigin(pos, "center", "center");
      return;
    }

    super.centerObjectV(object);
  }
}
