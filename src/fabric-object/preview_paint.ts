import * as fabric from "fabric";
import { isBlackInk } from "$/utils/label_colors";

type PaintTouch = { obj: fabric.FabricObject; fill?: string; stroke?: string };

const isWhitePaint = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  const paint = value.trim().toLowerCase().replace(/\s+/g, "");
  if (
    [
      "white",
      "#fff",
      "#ffffff",
      "#ffffffff",
      "rgb(255,255,255)",
      "rgba(255,255,255,1)",
      "rgba(255,255,255,1.0)",
    ].includes(paint)
  )
    return true;
  return /^rgba\(255,255,255,1(?:\.0+)?\)$/.test(paint);
};

/** Paint vector ink and paper cutouts for the colour editor preview, then restore stored paints. */
export const withPreviewPaint = (
  objects: fabric.FabricObject[],
  ink: string | undefined,
  paper: string,
  draw: () => void,
): void => {
  const touched: PaintTouch[] = [];

  const visit = (obj: fabric.FabricObject): boolean => {
    if (obj instanceof fabric.FabricImage) return false;
    let changed = false;
    if (obj instanceof fabric.Group) {
      for (const child of obj.getObjects()) {
        if (visit(child)) changed = true;
      }
    }
    const touch: PaintTouch = { obj };
    if (isWhitePaint(obj.fill)) {
      touch.fill = obj.fill;
      obj.fill = paper;
      changed = true;
    } else if (ink && isBlackInk(obj.fill)) {
      touch.fill = obj.fill;
      obj.fill = ink;
      changed = true;
    }
    if (isWhitePaint(obj.stroke)) {
      touch.stroke = obj.stroke;
      obj.stroke = paper;
      changed = true;
    } else if (ink && isBlackInk(obj.stroke)) {
      touch.stroke = obj.stroke;
      obj.stroke = ink;
      changed = true;
    }
    if (changed) {
      obj.dirty = true;
      if (touch.fill !== undefined || touch.stroke !== undefined) touched.push(touch);
    }
    return changed;
  };

  const restore = () => {
    for (const touch of touched) {
      if (touch.fill !== undefined) touch.obj.fill = touch.fill;
      if (touch.stroke !== undefined) touch.obj.stroke = touch.stroke;
      touch.obj.dirty = true;
      const parent = touch.obj.group ?? touch.obj.parent;
      if (parent) parent.dirty = true;
    }
  };

  try {
    for (const obj of objects) visit(obj);
    draw();
  } finally {
    restore();
  }
};
