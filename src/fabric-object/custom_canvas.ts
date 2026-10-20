import * as fabric from "fabric";
import { panelBoxes } from "$/utils/label_panels";
import { DEFAULT_LABEL_PROPS, GRID_SIZE } from "$/defaults";
import type { LabelProps } from "$/types";
import { isFrameGroup, prepareObjectScale } from "$/fabric-object/scale_mode";
import { inkPaint, isBlackInk, paperCss } from "$/utils/label_colors";
import { workingEdge } from "$/utils/label_orientation";
import { mmToPx } from "$/utils/label_units";

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
type InkTouch = { obj: fabric.FabricObject; fill?: string; stroke?: string };

/**
 * Recolor black vector ink for the editor frame only. Fills are put back
 * before the function returns, so the saved objects and the print mask stay black.
 * Gold and white would otherwise disappear in the 1-bit threshold.
 */
const tintBlackInk = (objects: fabric.FabricObject[], color: string): InkTouch[] => {
  const touched: InkTouch[] = [];

  const visit = (obj: fabric.FabricObject): boolean => {
    if (obj instanceof fabric.FabricImage) return false;
    let changed = false;
    if (obj instanceof fabric.Group) {
      for (const child of obj.getObjects()) {
        if (visit(child)) changed = true;
      }
    }
    const touch: InkTouch = { obj };
    if (isBlackInk(obj.fill)) {
      touch.fill = obj.fill;
      obj.fill = color;
      changed = true;
    }
    if (isBlackInk(obj.stroke)) {
      touch.stroke = obj.stroke;
      obj.stroke = color;
      changed = true;
    }
    if (changed) {
      obj.dirty = true;
      if (touch.fill !== undefined || touch.stroke !== undefined) touched.push(touch);
    }
    return changed;
  };

  for (const obj of objects) visit(obj);
  return touched;
};

const restoreInk = (touched: InkTouch[]) => {
  for (const touch of touched) {
    if (touch.fill !== undefined) touch.obj.fill = touch.fill;
    if (touch.stroke !== undefined) touch.obj.stroke = touch.stroke;
    touch.obj.dirty = true;
    const parent = touch.obj.group ?? touch.obj.parent;
    if (parent) parent.dirty = true;
  }
};

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
  private fittingWorkspace = false;
  private workspaceQueued = false;
  /** Pasteboard around the paper so objects can sit outside the label. */
  private readonly workspacePad = mmToPx(4);
  onZoomChange?: (zoom: number) => void;

  constructor(
    el?: string | HTMLCanvasElement,
    options?: fabric.TOptions<fabric.CanvasOptions>,
  ) {
    super(el, options);
    this.setupZoomAndPan();
    this.preserveObjectStacking = true;
    // Corner handles resize freely. Shift keeps the ratio. Circles and icons lock it.
    this.uniformScaling = false;
    this.on("object:added", (event) => {
      if (event.target) prepareObjectScale(event.target);
      // Position updates in the same turn, after add, have to land first.
      this.queueWorkspace();
    });
    this.on("object:removed", () => this.queueWorkspace());
    this.on("object:modified", () => this.queueWorkspace());
  }

  /**
   * A frame's empty middle is not a target, even when an older preset never
   * stored perPixelTargetFind. The stroke still is. Keep the flag so the next
   * save does not grow the hit box back.
   */
  override _checkTarget(obj: fabric.FabricObject, pointer: fabric.Point): boolean {
    if (isFrameGroup(obj)) obj.perPixelTargetFind = true;
    return super._checkTarget(obj, pointer);
  }

  private queueWorkspace() {
    if (this.workspaceQueued) return;
    this.workspaceQueued = true;
    queueMicrotask(() => {
      this.workspaceQueued = false;
      this.fitWorkspace();
    });
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

  private labelSize() {
    const width = this.labelProps.size?.width;
    const height = this.labelProps.size?.height;
    return {
      width: width && width > 0 ? width : (this.width ?? 1),
      height: height && height > 0 ? height : (this.height ?? 1),
    };
  }

  /** Paper rectangle in canvas pixels, after the pasteboard offset. */
  labelBitmapRect() {
    const v = this.viewportTransform ?? [1, 0, 0, 1, 0, 0];
    const size = this.labelSize();
    return {
      left: v[4] || 0,
      top: v[5] || 0,
      width: size.width,
      height: size.height,
    };
  }

  /**
   * Grow the canvas past the label so objects and handles outside the paper
   * stay visible. Print preview leaves this alone.
   */
  fitWorkspace() {
    if (!this.customBackground || this.fittingWorkspace) return;
    const labelW = this.labelProps.size?.width ?? 0;
    const labelH = this.labelProps.size?.height ?? 0;
    if (labelW < 1 || labelH < 1) return;
    this.fittingWorkspace = true;
    try {
      this.fitWorkspaceBody(labelW, labelH);
    } finally {
      this.fittingWorkspace = false;
    }
  }

  private fitWorkspaceBody(labelW: number, labelH: number) {

    let minX = 0;
    let minY = 0;
    let maxX = labelW;
    let maxY = labelH;
    for (const obj of this.getObjects()) {
      obj.setCoords();
      const box = obj.getBoundingRect();
      minX = Math.min(minX, box.left);
      minY = Math.min(minY, box.top);
      maxX = Math.max(maxX, box.left + box.width);
      maxY = Math.max(maxY, box.top + box.height);
    }

    const pad = this.workspacePad;
    const offsetX = Math.max(pad, Math.ceil(-minX + pad));
    const offsetY = Math.max(pad, Math.ceil(-minY + pad));
    const width = Math.ceil(offsetX + Math.max(labelW, maxX) + pad);
    const height = Math.ceil(offsetY + Math.max(labelH, maxY) + pad);
    const current = this.viewportTransform ?? [1, 0, 0, 1, 0, 0];
    if (
      Math.abs((this.width ?? 0) - width) < 1 &&
      Math.abs((this.height ?? 0) - height) < 1 &&
      Math.abs((current[4] ?? 0) - offsetX) < 1 &&
      Math.abs((current[5] ?? 0) - offsetY) < 1
    ) {
      return;
    }

    const zoom = this.virtualZoomRatio;
    this.setDimensions({ width, height });
    this.setViewportTransform([1, 0, 0, 1, offsetX, offsetY]);
    this.virtualZoom(zoom);
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
    const { width, height } = this.labelSize();
    ctx.beginPath();

    if (this.labelProps.panels?.length) {
      for (const panel of panelBoxes(this.labelProps)) {
        if (panel.shape === "circle") {
          const radius = Math.min(panel.width, panel.height) / 2;
          ctx.moveTo(panel.left + panel.width / 2 + radius, panel.top + panel.height / 2);
          ctx.arc(panel.left + panel.width / 2, panel.top + panel.height / 2, radius, 0, Math.PI * 2);
        } else if (panel.shape === "rounded_rect") {
          ctx.roundRect(panel.left, panel.top, panel.width, panel.height, Math.min(panel.width, panel.height) * 0.12);
        } else {
          ctx.rect(panel.left, panel.top, panel.width, panel.height);
        }
      }
      return;
    }

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
    const label = this.labelSize();
    const roundRadius = this.labelProps.shape === "rounded_rect" ? this.paperRadius() : 0;
    ctx.fillStyle = this.GRAY;
    ctx.beginPath();

    if (this.labelProps.tailPos === "right") {
      ctx.rect(
        bb.endX - roundRadius,
        bb.endY / 2 - this.TAIL_WIDTH / 2,
        label.width - bb.endX + roundRadius,
        this.TAIL_WIDTH,
      );
    } else if (this.labelProps.tailPos === "bottom") {
      ctx.rect(
        bb.endX / 2 - this.TAIL_WIDTH / 2,
        bb.endY - roundRadius,
        this.TAIL_WIDTH,
        label.height - bb.endY + roundRadius,
      );
    } else if (this.labelProps.tailPos === "left") {
      ctx.rect(0, bb.endY / 2 - this.TAIL_WIDTH / 2, bb.startX + roundRadius, this.TAIL_WIDTH);
    } else if (this.labelProps.tailPos === "top") {
      ctx.rect(bb.endX / 2 - this.TAIL_WIDTH / 2, 0, this.TAIL_WIDTH, bb.startY + roundRadius);
    }

    ctx.fill();
  }

  private drawPrintStart(ctx: CanvasRenderingContext2D) {
    const { width, height } = this.labelSize();
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
    const panel = panelBoxes(this.labelProps)[0];
    if (panel) {
      return {
        startX: panel.left, startY: panel.top,
        endX: panel.left + panel.width, endY: panel.top + panel.height,
        width: panel.width, height: panel.height,
      };
    }
    const size = this.labelSize();
    let endX = size.width;
    let endY = size.height;
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
    if ((this.labelProps.panels?.length ?? 0) > 1) return { axis: "none", points: [], segments: [] };
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
    const v = this.viewportTransform;
    if (v) ctx.transform(v[0], v[1], v[2], v[3], v[4], v[5]);

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

    ctx.fillStyle = paperCss(this.labelProps.paperColor);
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
    const paint = this.customBackground ? inkPaint(this.labelProps.inkColor) : undefined;
    const touched = paint ? tintBlackInk(objects, paint) : [];

    try {
      // Objects draw past the paper so a smaller label does not hide them.
      ctx.save();
      try {
        // Die-cut gutters and tails must stay blank in the actual print bitmap.
        if (!this.customBackground && this.labelProps.panels?.length) {
          this.tracePaperPath(ctx);
          ctx.clip();
        }
        super._renderObjects(ctx, objects);
      } finally {
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
    } finally {
      restoreInk(touched);
    }
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
    const panels = panelBoxes(this.labelProps);
    if (panels.length > 1) {
      const pos = object.getPointByOrigin("center", "center");
      const panel = panels.find((item) => pos.x >= item.left && pos.x <= item.left + item.width && pos.y >= item.top && pos.y <= item.top + item.height) ?? panels[0];
      pos.setX(panel.left + panel.width / 2);
      object.setPositionByOrigin(pos, "center", "center");
      return;
    }
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

    const pos = object.getPointByOrigin("center", "center");
    const bounds = this.getLabelBounds();
    pos.setX(bounds.startX + bounds.width / 2);
    object.setPositionByOrigin(pos, "center", "center");
  }

  /** Centers object vertically in the canvas or label part */
  override centerObjectV(object: fabric.FabricObject): void {
    const panels = panelBoxes(this.labelProps);
    if (panels.length > 1) {
      const pos = object.getPointByOrigin("center", "center");
      const panel = panels.find((item) => pos.x >= item.left && pos.x <= item.left + item.width && pos.y >= item.top && pos.y <= item.top + item.height) ?? panels[0];
      pos.setY(panel.top + panel.height / 2);
      object.setPositionByOrigin(pos, "center", "center");
      return;
    }
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

    const pos = object.getPointByOrigin("center", "center");
    const bounds = this.getLabelBounds();
    pos.setY(bounds.startY + bounds.height / 2);
    object.setPositionByOrigin(pos, "center", "center");
  }

  /** The pasteboard is larger than the paper. New objects belong on the label. */
  override centerObject(object: fabric.FabricObject): void {
    this.centerObjectH(object);
    this.centerObjectV(object);
  }
}
