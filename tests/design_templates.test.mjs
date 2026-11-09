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
const { ORNAMENT_DESIGNS } = await import("../src/data/ornament_templates.ts");
const { DECORATIVE_ORNAMENTS } = await import("../src/data/decorative_ornaments.ts");
const { BOTANICAL_ORNAMENTS } = await import("../src/data/botanical_ornaments.ts");
const { designPreviewSvg } = await import("../src/utils/design_template_preview.ts");
const { createDesignTemplate } = await import("../src/utils/design_template_factory.ts");
const { ExportedLabelTemplateSchema } = await import("../src/types.ts");

test("all design collections compose within each stock format in both languages", () => {
  assert.equal(DESIGN_TEMPLATES.length, 44);
  assert.equal(new Set(DESIGN_TEMPLATES.map((item) => item.id)).size, 44);
  assert.equal(DESIGN_TEMPLATES.filter((item) => item.collection === "botanical").length, 10);
  assert.equal(DESIGN_TEMPLATES.filter((item) => item.collection === "vintage").length, 13);
  assert.equal(DESIGN_TEMPLATES.filter((item) => item.collection === "artdeco").length, 10);
  assert.equal(DESIGN_TEMPLATES.filter((item) => item.collection === "cyber").length, 11);
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

test("ornaments are self-contained SVG with in-bounds artwork", async () => {
  assert.equal(BOTANICAL_ORNAMENTS.length, 17);
  assert.equal(DECORATIVE_ORNAMENTS.length, 38);
  const ornaments = [...BOTANICAL_ORNAMENTS, ...DECORATIVE_ORNAMENTS];
  assert.equal(new Set(ornaments.map((item) => item.id)).size, ornaments.length);
  for (const item of ornaments) {
    const parsed = new dom.window.DOMParser().parseFromString(item.svg, "image/svg+xml");
    assert.equal(parsed.querySelector("parsererror"), null);
    assert.equal(parsed.querySelector("use, image, script, foreignObject"), null);
    assert.ok(parsed.querySelector("path"));
    {
      const [, , width, height] = item.viewBox.split(/\s+/).map(Number);
      const artwork = await fabric.loadSVGFromString(item.svg);
      for (const object of artwork.objects.filter(Boolean)) {
        const box = object.getBoundingRect();
        assert.ok(box.left >= 0 && box.top >= 0, item.id);
        assert.ok(box.left + box.width <= width && box.top + box.height <= height, item.id);
      }
    }
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
  assert.equal(VINTAGE_FRAME_KINDS.length, 12);
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
  for (const entry of DESIGN_TEMPLATES.filter((item) => item.collection === "vintage" && "frame" in item)) {
    const template = await createDesignTemplate(entry.id, DESIGN_FORMATS[0], "en");
    const frame = template.canvas.objects.find((item) => item.layerInfo?.kind === "frame");
    assert.equal(frame.layerInfo.name, entry.frame);
    assert.equal(frame.layoutScale, "free");
    assert.ok(template.canvas.objects.filter((item) => item.type.toLowerCase() === "textbox").length >= 4);
  }
});

test("Art Deco painted geometry stays in bounds in every format", async () => {
  const { ART_DECO_FRAME_KINDS, artDecoFrameSvg } = await import("../src/utils/art_deco_frames.ts");
  const { BORDER_KINDS, borderSvg } = await import("../src/utils/label_borders.ts");
  assert.equal(ART_DECO_FRAME_KINDS.length, 16);
  for (const kind of ART_DECO_FRAME_KINDS) for (const [width,height,shape] of [[591,354,"rect"],[472,709,"rect"],[591,354,"rounded_rect"],[472,472,"circle"]]) {
    assert.ok(BORDER_KINDS.includes(kind));
    const svg = artDecoFrameSvg(kind,width,height,shape);
    assert.equal(borderSvg(kind,width,height,shape),svg);
    const parsed = await fabric.loadSVGFromString(svg);
    for (const object of parsed.objects.filter((item) => item && item.opacity > 0)) {
      const box = object.getBoundingRect();
      assert.ok(box.left >= 0 && box.top >= 0, `${kind}/${shape}`);
      assert.ok(box.left+box.width <= width && box.top+box.height <= height, `${kind}/${shape}`);
    }
  }
});

test("Art Deco templates preserve named frames and bundled typography on reload", async () => {
  for (const entry of DESIGN_TEMPLATES.filter((item) => item.collection === "artdeco" && "frame" in item)) {
    const template = await createDesignTemplate(entry.id, DESIGN_FORMATS[0], "en");
    const frame = template.canvas.objects.find((item) => item.layerInfo?.kind === "frame");
    assert.equal(frame.layerInfo.name, entry.frame);
    assert.equal(frame.layoutScale, "free");
    const objects = await fabric.util.enlivenObjects(JSON.parse(JSON.stringify(template.canvas.objects)));
    const textObjects = objects.filter((object) => object instanceof fabric.Textbox);
    assert.equal(textObjects.at(-1).fontFamily, entry.id === "deco-archive" ? "NiimBlue Condensed" : "NiimBlue Mono");
  }
});

test("current-size option avoids flattening special label layouts", () => {
  const props = { size: { width: 591, height: 354 }, shape: "rect", printDirection: "top" };
  assert.equal(currentDesignFormat(props).id, "current");
  assert.equal(currentDesignFormat({ ...props, panels: [{ left: 0, top: 0, width: .5, height: 1 }] }), undefined);
  assert.equal(currentDesignFormat({ ...props, tailLength: 20 }), undefined);
  assert.equal(currentDesignFormat({ ...props, size: { width: 473, height: 142 } }), undefined);
});

test("Cyber frames keep painted geometry within every stock shape", async () => {
  const { CYBER_FRAME_KINDS, cyberFrameSvg } = await import("../src/utils/cyber_frames.ts");
  const { BORDER_KINDS, borderSvg } = await import("../src/utils/label_borders.ts");
  assert.equal(CYBER_FRAME_KINDS.length, 13);
  for (const kind of CYBER_FRAME_KINDS) for (const [width, height, shape] of [[591,354,"rect"],[472,709,"rect"],[591,354,"rounded_rect"],[472,472,"circle"]]) {
    assert.ok(BORDER_KINDS.includes(kind));
    const svg = cyberFrameSvg(kind, width, height, shape);
    assert.equal(borderSvg(kind, width, height, shape), svg);
    const parsed = await fabric.loadSVGFromString(svg);
    assert.ok(parsed.objects.length > 5);
    for (const object of parsed.objects.filter((item) => item && item.opacity > 0)) {
      const box = object.getBoundingRect();
      assert.ok(box.left >= 0 && box.top >= 0, `${kind}/${shape}`);
      assert.ok(box.left + box.width <= width && box.top + box.height <= height, `${kind}/${shape}`);
    }
  }
});

test("Cyber text alignment matches previews and survives editable template reload", async () => {
  for (const entry of DESIGN_TEMPLATES.filter((item) => item.collection === "cyber" && "frame" in item)) {
    const scene = designScene(entry.id, DESIGN_FORMATS[0], "en");
    const preview = new dom.window.DOMParser().parseFromString(designPreviewSvg(scene), "image/svg+xml");
    const textElements = scene.elements.filter((item) => item.kind === "text");
    [...preview.querySelectorAll("text")].forEach((node, i) => assert.equal(node.getAttribute("text-anchor"), textElements[i].align === "center" ? "middle" : "start"));
    const template = await createDesignTemplate(entry.id, DESIGN_FORMATS[0], "en");
    assert.equal(template.canvas.objects.find((item) => item.layerInfo?.kind === "frame").layerInfo.name, entry.frame);
    const objects = await fabric.util.enlivenObjects(JSON.parse(JSON.stringify(template.canvas.objects)));
    objects.filter((item) => item instanceof fabric.Textbox).forEach((object, i) => assert.equal(object.textAlign, textElements[i].align ?? "center"));
  }
  const scene = designScene("pantry", DESIGN_FORMATS[0], "en");
  const preview = new dom.window.DOMParser().parseFromString(designPreviewSvg(scene), "image/svg+xml");
  assert.equal(preview.querySelector("text").getAttribute("text-anchor"), "middle");
});

test("module housing has one straight right rail between its corners", async () => {
  const { cyberFrameSvg } = await import("../src/utils/cyber_frames.ts");
  for (const [width, height] of [[591, 354], [472, 709]]) {
    const parsed = await fabric.loadSVGFromString(cyberFrameSvg("cyber-module", width, height));
    const outline = parsed.objects.find((item) => item instanceof fabric.Path);
    const points = outline.path.filter((command) => command[0] === "L");
    const right = Math.max(...points.map((command) => command[1]));
    const rail = points.filter((command) => command[1] === right);
    assert.equal(rail.length, 2, "right rail must have only its two endpoints");
    assert.equal(points.indexOf(rail[1]) - points.indexOf(rail[0]), 1, "right rail must have no intermediate kink");
  }
});

test("saved serif designs load bundled fonts even inside a group", async () => {
  const { usesBundledDesignFonts } = await import("../src/data/bundled_fonts.ts");
  assert.equal(usesBundledDesignFonts({ objects: [{ objects: [{ fontFamily: "NiimBlue Serif" }] }] }), true);
  assert.equal(usesBundledDesignFonts({ objects: [{ fontFamily: "Local User Font" }] }), false);
  assert.equal(usesBundledDesignFonts(null), false);
});


test("ornament compositions use independent illustrations and preserve asymmetric alignment", async () => {
  assert.equal(ORNAMENT_DESIGNS.length, 9);
  for (const collection of ["vintage", "artdeco", "cyber"]) {
    assert.equal(ORNAMENT_DESIGNS.filter((item) => item.collection === collection).length, 3);
    assert.equal(DECORATIVE_ORNAMENTS.filter((item) => item.collection === collection).length, collection === "vintage" ? 20 : collection === "artdeco" ? 12 : 6);
  }
  for (const entry of ORNAMENT_DESIGNS) for (const format of DESIGN_FORMATS) for (const language of ["en", "de"]) {
    const scene = designScene(entry.id, format, language);
    assert.equal(scene.elements.filter((item) => item.kind === "svg").length, entry.id === "deco-orbit-pendant" ? 1 : 2, entry.id);
    assert.ok(!scene.elements.some((item) => item.role === "frame"), entry.id);
    assert.ok(scene.elements.some((item) => item.kind === "text" && ["left", "right"].includes(item.align)), entry.id);
    const artwork = scene.elements.filter((item) => item.kind === "svg");
    const captions = scene.elements.filter((item) => item.kind === "text");
    for (const art of artwork) for (const caption of captions) {
      const overlapX = Math.min(art.x + art.width, caption.x + caption.width) - Math.max(art.x, caption.x);
      const overlapY = Math.min(art.y + art.height, caption.y + caption.height) - Math.max(art.y, caption.y);
      assert.ok(overlapX <= .01 || overlapY <= .01, `${entry.id}/${format.id}: ${art.name} overlaps ${caption.text}`);
    }
    const template = await createDesignTemplate(entry.id, format, language);
    assert.ok(!template.canvas.objects.some((item) => item.layerInfo?.kind === "frame"), entry.id);
    const objects = await fabric.util.enlivenObjects(JSON.parse(JSON.stringify(template.canvas.objects)));
    const texts = objects.filter((item) => item instanceof fabric.Textbox);
    const elements = scene.elements.filter((item) => item.kind === "text");
    assert.deepEqual(texts.map((item) => item.textAlign), elements.map((item) => item.align ?? "center"));
    // Every illustrated element on round stock stays within the physical disc,
    // including its transparent retained margins after flips and serialization.
    if (format.shape === "circle") {
      for (const element of scene.elements.filter((item) => item.kind === "svg")) {
        for (const x of [element.x, element.x + element.width]) for (const y of [element.y, element.y + element.height]) {
          assert.ok(Math.hypot(x - format.width / 2, y - format.height / 2) <= format.width / 2 + .001, `${entry.id}: art outside circular paper`);
        }
      }
    }
  }
});
