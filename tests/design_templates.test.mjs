import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import test from "node:test";
import { JSDOM } from "jsdom";

registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("$/")) return nextResolve(new URL(`../src/${specifier.slice(2)}.ts`, import.meta.url).href, context);
  if (specifier.startsWith(".") && context.parentURL) {
    const candidate = new URL(`${specifier}.ts`, context.parentURL);
    if (existsSync(candidate)) return nextResolve(candidate.href, context);
  }
  return nextResolve(specifier, context);
} });
const dom = new JSDOM("<!doctype html><html><body></body></html>");
globalThis.window = dom.window;
globalThis.document = dom.window.document;
// Exercise real Fabric parsing and serialization; only glyph measurement is mocked.
dom.window.HTMLCanvasElement.prototype.getContext = () => ({
  font: "100px sans-serif",
  measureText(text) { return { width: [...text].length * (Number(this.font.match(/([\d.]+)px/)?.[1]) || 100) * .55 }; },
});
const fabric = await import("fabric");
fabric.setEnv({ ...fabric.getEnv(), window: dom.window, document: dom.window.document });
const { configureFabric } = await import("../src/defaults.ts");
configureFabric();
const { DESIGN_TEMPLATES, DESIGN_FORMATS, designScene, currentDesignFormat } = await import("../src/data/design_templates.ts");
const { BOTANICAL_ORNAMENTS } = await import("../src/data/botanical_ornaments.ts");
const { designPreviewSvg } = await import("../src/utils/design_template_preview.ts");
const { createDesignTemplate } = await import("../src/utils/design_template_factory.ts");
const { ExportedLabelTemplateSchema } = await import("../src/types.ts");

test("botanical and vintage designs compose within each stock format in both languages", () => {
  assert.equal(DESIGN_TEMPLATES.length, 10);
  assert.equal(new Set(DESIGN_TEMPLATES.map((item) => item.id)).size, 10);
  assert.equal(DESIGN_TEMPLATES.filter((item) => item.collection === "botanical").length, 6);
  assert.equal(DESIGN_TEMPLATES.filter((item) => item.collection === "vintage").length, 4);
  for (const design of DESIGN_TEMPLATES) for (const format of DESIGN_FORMATS) for (const language of ["en", "de"]) {
    const scene = designScene(design.id, format, language);
    for (const item of scene.elements) {
      assert.ok(item.x >= 0 && item.y >= 0);
      assert.ok(item.x + item.width <= scene.width + .001, `${design.id}: exceeds width`);
      assert.ok(item.y + item.height <= scene.height + .001, `${design.id}: exceeds height`);
    }
    assert.ok(scene.elements.filter((item) => item.kind === "text").length >= 3);
    const preview = new dom.window.DOMParser().parseFromString(designPreviewSvg(scene), "image/svg+xml");
    assert.equal(preview.querySelector("parsererror"), null);
    assert.equal(preview.querySelectorAll("image").length, 0);
  }
});

test("ornaments are self-contained SVG with in-bounds artwork", () => {
  assert.equal(BOTANICAL_ORNAMENTS.length, 6);
  for (const item of BOTANICAL_ORNAMENTS) {
    const parsed = new dom.window.DOMParser().parseFromString(item.svg, "image/svg+xml");
    assert.equal(parsed.querySelector("parsererror"), null);
    assert.equal(parsed.querySelector("use, image, script, foreignObject"), null);
    assert.ok(parsed.querySelector("path"));
  }
});

test("applying templates produces editable Fabric objects that survive JSON reload", async () => {
  for (const design of DESIGN_TEMPLATES) for (const format of DESIGN_FORMATS) {
    const template = await createDesignTemplate(design.id, format, "de");
    assert.equal(ExportedLabelTemplateSchema.safeParse(template).success, true);
    assert.equal(template.label.size.width, Math.round(format.width / 25.4 * 300));
    assert.equal(template.label.size.height, Math.round(format.height / 25.4 * 300));
    assert.equal(template.label.shape, format.shape);
    assert.ok(template.canvas.objects.some((item) => item.type.toLowerCase() === "textbox"));
    assert.ok(template.canvas.objects.some((item) => item.type.toLowerCase() === "group" && item.layerInfo?.name));
    assert.ok(template.canvas.objects.every((item) => item.type.toLowerCase() !== "image"));
    const objects = await fabric.util.enlivenObjects(JSON.parse(JSON.stringify(template.canvas.objects)));
    const text = objects.find((item) => item instanceof fabric.Textbox);
    assert.ok(text);
    for (const object of objects) {
      const box = object.getBoundingRect();
      assert.ok(box.left >= -1 && box.top >= -1, design.id);
      assert.ok(box.left + box.width <= template.label.size.width + 2, `${design.id}/${format.id} ${object.type} ${JSON.stringify(box)} vs ${JSON.stringify(template.label.size)}`);
      assert.ok(box.top + box.height <= template.label.size.height + 2, `${design.id}/${format.id} ${object.type} ${JSON.stringify(box)} vs ${JSON.stringify(template.label.size)}`);
    }
    const original = text.text;
    text.set({ text: "My own wording" });
    assert.equal(text.text, "My own wording");
    assert.notEqual(text.text, original);
  }
});

test("preview text is escaped and root stroke-width attributes remain intact", () => {
  const scene = designScene("pantry", DESIGN_FORMATS[0]);
  scene.elements.find((item) => item.kind === "text").text = '<script>alert("bad")</script> & herbs';
  const result = designPreviewSvg(scene);
  assert.ok(result.includes("&lt;script&gt;"));
  assert.ok(/stroke-width="[\d.]+"/.test(result));
  assert.ok(!result.includes("<script>"));
});

test("new botanical frames keep painted paths inside all three label shapes", async () => {
  const { borderSvg } = await import("../src/utils/label_borders.ts");
  for (const kind of ["botanical-corners", "herbarium", "botanical-wreath"]) {
    for (const shape of ["rect", "rounded_rect", "circle"]) {
      const width = shape === "circle" ? 472 : 591, height = shape === "circle" ? 472 : 354;
      const parsed = await fabric.loadSVGFromString(borderSvg(kind, width, height, shape));
      const paths = parsed.objects.filter((item) => item instanceof fabric.Path);
      assert.ok(paths.length >= 3);
      for (const path of paths) {
        const box = path.getBoundingRect();
        assert.ok(box.left >= 0 && box.top >= 0, `${kind}/${shape}`);
        assert.ok(box.left + box.width <= width && box.top + box.height <= height, `${kind}/${shape}`);
      }
    }
  }
});

test("vintage frames stay inside paper and preserve blank centres across aspect ratios", async () => {
  const { VINTAGE_FRAME_KINDS, vintageFrameSvg } = await import("../src/utils/vintage_frames.ts");
  const { borderSvg, BORDER_KINDS } = await import("../src/utils/label_borders.ts");
  assert.equal(VINTAGE_FRAME_KINDS.length, 6);
  for (const kind of VINTAGE_FRAME_KINDS) {
    assert.ok(BORDER_KINDS.includes(kind));
    for (const [width, height, shape] of [[591,354,"rect"], [472,709,"rect"], [591,354,"rounded_rect"], [472,472,"circle"]]) {
      const source = vintageFrameSvg(kind, width, height, shape);
      assert.equal(borderSvg(kind, width, height, shape), source);
      const parsed = await fabric.loadSVGFromString(source);
      const painted = parsed.objects.filter((item) => item && item.opacity > 0);
      assert.ok(painted.length >= 2);
      for (const item of painted) {
        const box = item.getBoundingRect();
        assert.ok(box.left >= 0 && box.top >= 0, `${kind}/${shape} ${JSON.stringify(box)}`);
        assert.ok(box.left + box.width <= width && box.top + box.height <= height, `${kind}/${shape}`);
      }
      const svgDoc = new dom.window.DOMParser().parseFromString(source, "image/svg+xml");
      assert.equal(svgDoc.querySelector("parsererror"), null);
      assert.equal(svgDoc.querySelector("image, text, use"), null);
    }
  }
});

test("vintage template frames retain frame metadata and stretch layout behavior", async () => {
  for (const entry of DESIGN_TEMPLATES.filter((item) => item.collection === "vintage")) {
    const template = await createDesignTemplate(entry.id, DESIGN_FORMATS[0], "en");
    const frame = template.canvas.objects.find((item) => item.layerInfo?.kind === "frame");
    assert.equal(frame.layerInfo.name, entry.frame);
    assert.equal(frame.layoutScale, "free");
    assert.ok(template.canvas.objects.filter((item) => item.type.toLowerCase() === "textbox").length >= 4);
  }
});

test("current-size option avoids flattening special label layouts", () => {
  const props = { size: { width: 591, height: 354 }, shape: "rect", printDirection: "top" };
  assert.equal(currentDesignFormat(props).id, "current");
  assert.equal(currentDesignFormat({ ...props, panels: [{ left: 0, top: 0, width: .5, height: 1 }] }), undefined);
  assert.equal(currentDesignFormat({ ...props, tailLength: 20 }), undefined);
  assert.equal(currentDesignFormat({ ...props, size: { width: 473, height: 142 } }), undefined);
});

test("saved serif designs load bundled fonts even inside a group", async () => {
  const { usesBundledDesignFonts } = await import("../src/data/bundled_fonts.ts");
  assert.equal(usesBundledDesignFonts({ objects: [{ objects: [{ fontFamily: "NiimBlue Serif" }] }] }), true);
  assert.equal(usesBundledDesignFonts({ objects: [{ fontFamily: "Local User Font" }] }), false);
  assert.equal(usesBundledDesignFonts(null), false);
});
