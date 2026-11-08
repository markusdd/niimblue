import type { DesignElement, DesignScene } from "../data/design_templates";
import { loadBundledFont } from "../data/bundled_fonts";

export type TextElement = Extract<DesignElement, { kind: "text" }>;
export const designFontFamily = (element: TextElement) =>
  element.family ?? (element.serif ? "NiimBlue Serif" : "Noto Sans Variable");
export function loadDesignSceneFonts(scene: DesignScene): Promise<unknown> {
  return Promise.all(
    scene.elements
      .filter((element) => element.kind === "text")
      .map((element) =>
        loadBundledFont({
          family: designFontFamily(element),
          weight: element.weight ?? 400,
          style: element.italic ? "italic" : "normal",
        }),
      ),
  );
}
let measureContext: CanvasRenderingContext2D | null | undefined;

/** Measure after bundled fonts have loaded, so preview and editable text agree. */
export function designTextSize(element: TextElement): number {
  if (measureContext === undefined && typeof document !== "undefined")
    measureContext = document.createElement("canvas").getContext("2d");
  const lines = element.text.split("\n");
  if (measureContext)
    measureContext.font = `${element.italic ? "italic " : ""}${element.weight ?? 400} 100px ${JSON.stringify(designFontFamily(element))}`;
  const emWidth = Math.max(
    ...lines.map((line) => {
      const measured = measureContext ? measureContext.measureText(line).width / 100 : line.length * 0.58;
      return measured + (Math.max(0, line.length - 1) * (element.spacing ?? 0)) / 1000;
    }),
  );
  return Math.min(
    element.size,
    (element.width * 0.96) / Math.max(emWidth, 0.1),
    element.height / (lines.length * 1.16),
  );
}
