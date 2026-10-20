import * as fabric from "fabric";
import type { LabelProps } from "$/types";
import { panelBoxes } from "./label_panels";

type FitLabel = Pick<LabelProps, "size" | "shape" | "tailPos" | "tailLength" | "panels">;

export type FitMap = {
  scale: number;
  fromCx: number;
  fromCy: number;
  toCx: number;
  toCy: number;
};

/** Printable body, tail excluded. Origin is the top-left of the label. */
export function paperBody(props: FitLabel): { left: number; top: number; width: number; height: number } {
  const panel = panelBoxes(props)[0];
  if (panel) return panel;
  const tail = Math.max(0, props.tailLength ?? 0);
  const pos = props.tailPos ?? "right";
  let left = 0;
  let top = 0;
  let width = props.size.width;
  let height = props.size.height;
  if (pos === "right") width -= tail;
  else if (pos === "left") {
    left += tail;
    width -= tail;
  } else if (pos === "bottom") height -= tail;
  else if (pos === "top") {
    top += tail;
    height -= tail;
  }
  return {
    left,
    top,
    width: Math.max(1, width),
    height: Math.max(1, height),
  };
}

/**
 * Area the design should occupy. A circle uses the largest square that stays
 * inside the disk, so the same circle maps to itself and a rectangle fitted
 * onto a circle does not hang out of the round label.
 */
export function fitFrame(props: FitLabel): { left: number; top: number; width: number; height: number } {
  const body = paperBody(props);
  if ((props.panels?.[0]?.shape ?? props.shape) !== "circle") return body;
  const side = Math.min(body.width, body.height) / Math.SQRT2;
  return {
    left: body.left + (body.width - side) / 2,
    top: body.top + (body.height - side) / 2,
    width: side,
    height: side,
  };
}

/** Uniform map from one label's fit frame onto another's. Null when nothing would move. */
export function fitMapping(from: FitLabel, to: FitLabel): FitMap | null {
  const source = fitFrame(from);
  const target = fitFrame(to);
  const scale = Math.min(target.width / source.width, target.height / source.height);
  if (!Number.isFinite(scale) || scale <= 0) return null;
  const fromCx = source.left + source.width / 2;
  const fromCy = source.top + source.height / 2;
  const toCx = target.left + target.width / 2;
  const toCy = target.top + target.height / 2;
  if (Math.abs(scale - 1) < 0.004 && Math.abs(fromCx - toCx) < 0.5 && Math.abs(fromCy - toCy) < 0.5) {
    return null;
  }
  return { scale, fromCx, fromCy, toCx, toCy };
}

/** Keep the layout's proportions and place it as large as the new label allows. */
export function fitObjectsToLabel(objects: fabric.FabricObject[], from: LabelProps, to: LabelProps) {
  if (objects.length === 0) return;
  const sourcePanels = panelBoxes(from);
  const targetPanels = panelBoxes(to);
  for (const obj of objects) {
    const center = obj.getPointByOrigin("center", "center");
    let source = from;
    let target = to;
    if (sourcePanels.length > 1 && targetPanels.length > 1) {
      const found = sourcePanels.findIndex((panel) => center.x >= panel.left && center.x <= panel.left + panel.width
        && center.y >= panel.top && center.y <= panel.top + panel.height);
      const sourceIndex = Math.max(0, found);
      const targetIndex = Math.min(sourceIndex, targetPanels.length - 1);
      source = { ...from, panels: [from.panels![sourceIndex]] };
      target = { ...to, panels: [to.panels![targetIndex]] };
    } else if (sourcePanels.length > 1) {
      // Keep the whole multi-label design when switching back to ordinary paper.
      source = { ...from, panels: undefined };
    }
    const map = fitMapping(source, target);
    if (!map) continue;
    obj.scaleX = (obj.scaleX || 1) * map.scale;
    obj.scaleY = (obj.scaleY || 1) * map.scale;
    if (obj.strokeUniform && typeof obj.strokeWidth === "number" && obj.strokeWidth > 0) {
      obj.strokeWidth *= map.scale;
    }
    obj.setPositionByOrigin(
      new fabric.Point(map.toCx + (center.x - map.fromCx) * map.scale, map.toCy + (center.y - map.fromCy) * map.scale),
      "center",
      "center",
    );
    obj.setCoords();
    obj.dirty = true;
  }
}
