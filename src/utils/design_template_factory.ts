import { designTextSize, designFontFamily, loadDesignSceneFonts } from "./design_typography";
import * as fabric from "fabric";
import type { ExportedLabelTemplate } from "$/types";
import { mmToPx } from "$/utils/label_units";
import {
  designScene,
  designName,
  type DesignId,
  type DesignFormat,
  type DesignLanguage,
} from "$/data/design_templates";
import { TextboxExt } from "$/fabric-object/textbox-ext";
import { markLayoutScale } from "$/fabric-object/scale_mode";
import { nameLayer } from "$/utils/layer_metadata";

/** Build real Fabric text and vector objects; no flattened label image. */
export async function createDesignTemplate(
  id: DesignId,
  format: DesignFormat,
  language: DesignLanguage,
): Promise<ExportedLabelTemplate> {
  const scene = designScene(id, format, language);
  await loadDesignSceneFonts(scene);
  const scale = mmToPx(scene.width) / scene.width;
  const objects: fabric.FabricObject[] = [];
  for (const element of scene.elements) {
    if (element.kind === "text") {
      const object = new TextboxExt(element.text, {
        left: element.x * scale,
        top: element.y * scale,
        width: element.width * scale,
        fontSize: designTextSize(element) * scale,
        fontFamily: designFontFamily(element),
        fontStyle: element.italic ? "italic" : "normal",
        fontWeight: element.weight ?? 400,
        charSpacing: element.spacing ?? 0,
        textAlign: "center",
        fill: "black",
        lineHeight: 1.1,
        originX: "left",
        originY: "top",
        fontAutoSize: false,
        snapAngle: 10,
      });
      // Keep small round formats legible and prevent unintended word wrapping.
      while (
        (object.height > element.height * scale || object.textLines.length > element.text.split("\n").length) &&
        object.fontSize > 10
      ) {
        object.set({ fontSize: object.fontSize - 0.5 });
      }
      objects.push(object);
    } else {
      const view = element.svg
        .match(/viewBox="([^"]+)"/)?.[1]
        .split(/\s+/)
        .map(Number) ?? [0, 0, element.width, element.height];
      // Transparent geometry retains the art's original margins when Fabric groups it.
      const source = element.svg.replace(
        /(<svg\b[^>]*>)/,
        `$1<rect x="0" y="0" width="${view[2]}" height="${view[3]}" fill="black" opacity="0" stroke="none" stroke-width="0"/>`,
      );
      const parsed = await fabric.loadSVGFromString(source);
      const shapes = parsed.objects.filter((object): object is fabric.FabricObject => object !== null);
      if (!shapes.length) throw new Error(`Empty ornament: ${element.name}`);
      const group = fabric.util.groupSVGElements(shapes, parsed.options);
      group.set({
        left: element.x * scale + (((view[2] - group.width) / 2) * element.width * scale) / view[2],
        top: element.y * scale + (((view[3] - group.height) / 2) * element.height * scale) / view[3],
        originX: "left",
        originY: "top",
        scaleX: (element.width * scale) / view[2],
        scaleY: (element.height * scale) / view[3],
        flipX: element.flipX ?? false,
        flipY: element.flipY ?? false,
        perPixelTargetFind: true,
        snapAngle: 10,
      });
      nameLayer(group, { kind: "clipart", name: element.name });
      markLayoutScale(group, "lock");
      objects.push(group);
    }
  }
  return {
    title: designName(id, language),
    label: {
      size: { width: mmToPx(scene.width), height: mmToPx(scene.height) },
      shape: scene.shape,
      printDirection: "top",
      paperColor: "white",
      inkColor: "black",
      split: "none",
      tailLength: 0,
      mirror: "none",
      quarterTurns: 0,
    },
    canvas: { version: fabric.version, objects: objects.map((object) => object.toObject()) },
  };
}
