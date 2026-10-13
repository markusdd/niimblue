import * as fabric from "fabric";

const CORNERS = ["tl", "tr", "bl", "br"] as const;

/**
 * Corner drag on a locked object always keeps its proportions.
 * The canvas default is free scaling, and Shift turns that into a lock.
 */
const scalingLocked: fabric.TransformActionHandler = (eventData, transform, x, y) => {
  const canvas = transform.target.canvas;
  if (!canvas) return false;
  const previous = canvas.uniformScaling;
  canvas.uniformScaling = true;
  const key = canvas.uniScaleKey ?? "shiftKey";
  const proxied = new Proxy(eventData, {
    get(target, prop, receiver) {
      if (prop === key) return false;
      const value = Reflect.get(target, prop, receiver);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
  try {
    return fabric.controlsUtils.scalingEqually(proxied as typeof eventData, transform, x, y);
  } finally {
    canvas.uniformScaling = previous;
  }
};

export function markLayoutScale(obj: fabric.FabricObject, mode: "free" | "lock") {
  (obj as fabric.FabricObject & { layoutScale?: "free" | "lock" }).layoutScale = mode;
}

/** A full-size invisible rect that keeps a frame as big as the paper. */
function isTransparentFill(fill: unknown): boolean {
  if (fill == null || fill === "" || fill === "transparent" || fill === "none") return true;
  if (typeof fill !== "string") return false;
  const match = fill.replace(/\s+/g, "").match(/^rgba\([^,]+,[^,]+,[^,]+,([0-9.]+)\)$/i);
  return !!match && Number(match[1]) === 0;
}

/**
 * Frames saved before layoutScale existed are still groups with that spacer.
 * Icons are not: they have no full-bleed transparent rect.
 */
export function isFrameGroup(obj: fabric.FabricObject): obj is fabric.Group {
  if (!(obj instanceof fabric.Group) && obj.type !== "group") return false;
  // Enlivened groups are not always `instanceof` the imported class.
  const group = obj as fabric.Group;
  const marked = (group as { layoutScale?: string }).layoutScale;
  if (marked === "free") return true;
  if (marked === "lock") return false;
  const width = group.width || 1;
  const height = group.height || 1;
  return group.getObjects().some((child) => {
    const rect = child instanceof fabric.Rect || child.type === "rect";
    if (!rect) return false;
    if (child.stroke && child.stroke !== "transparent" && (child.strokeWidth ?? 0) > 0) return false;
    if (!isTransparentFill(child.fill)) return false;
    return child.width >= width * 0.9 && child.height >= height * 0.9;
  });
}

/** Rectangles and frames stretch. Circles, icons, photos and text keep their ratio. */
export function wantsFreeCornerScale(obj: fabric.FabricObject): boolean {
  if (obj instanceof fabric.ActiveSelection) return true;
  const marked = (obj as { layoutScale?: string }).layoutScale;
  if (marked === "free") return true;
  if (marked === "lock") return false;
  if (obj instanceof fabric.Rect) return true;
  if (isFrameGroup(obj)) return true;
  // Frames are placed with per-pixel hit testing. Icons are not.
  if (obj.perPixelTargetFind) return true;
  return false;
}

export function applyCornerScale(obj: fabric.FabricObject) {
  const free = wantsFreeCornerScale(obj);
  const controls = { ...obj.controls };
  let changed = false;
  for (const name of CORNERS) {
    const control = controls[name];
    if (!control || !obj.isControlVisible(name)) continue;
    const lockedHandler = control.actionHandler === scalingLocked;
    if (free) {
      // A frame can be marked free after an earlier pass locked its corners.
      if (!lockedHandler) continue;
      controls[name] = new fabric.Control({
        ...control,
        actionHandler: fabric.controlsUtils.scalingEqually,
      });
    } else {
      if (lockedHandler) continue;
      controls[name] = new fabric.Control({ ...control, actionHandler: scalingLocked });
    }
    changed = true;
  }
  if (changed) obj.controls = controls;
}

/**
 * A frame covers the label. Its box must not take the click, or the rectangle
 * and circle under it can only be reached from the layer list. Rectangles stay
 * box-selectable because their fill is transparent.
 */
export function prepareObjectScale(obj: fabric.FabricObject) {
  if (isFrameGroup(obj)) {
    markLayoutScale(obj, "free");
    obj.set({ perPixelTargetFind: true });
  }
  applyCornerScale(obj);
}

/**
 * A side baked down to 0 stays there, because the next drag multiplies that 0.
 * Lift a missing base to 1px and keep the scale this drag just computed.
 * Lift a live scale that would draw under 1px. Locked objects are left alone,
 * or a tiny uniform scale would pull their axes apart.
 */
export function preventCollapsedSize(obj: fabric.FabricObject) {
  if (!wantsFreeCornerScale(obj)) return;
  liftSide(obj, "width", "scaleX");
  liftSide(obj, "height", "scaleY");
}

function liftSide(
  obj: fabric.FabricObject,
  dim: "width" | "height",
  scaleKey: "scaleX" | "scaleY",
) {
  const base = obj[dim];
  const scale = obj[scaleKey] ?? 1;
  if (!Number.isFinite(base) || !Number.isFinite(scale)) return;
  if (base === 0) {
    obj.set(dim, 1);
    return;
  }
  if (Math.abs(scale * base) >= 1) return;
  // set() turns a negative scale into a flip. Keep the scale positive.
  obj.set(scaleKey, 1 / Math.abs(base));
}
