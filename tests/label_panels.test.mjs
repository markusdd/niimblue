import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import test from "node:test";

registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("$/")) return nextResolve(new URL(`../src/${specifier.slice(2)}.ts`, import.meta.url).href, context);
  if (specifier.startsWith(".") && context.parentURL) {
    const candidate = new URL(`${specifier}.ts`, context.parentURL);
    if (existsSync(candidate)) return nextResolve(candidate.href, context);
  }
  return nextResolve(specifier, context);
} });

const { LabelPropsSchema, LabelPresetSchema } = await import("../src/types.ts");
const { LABEL_STOCK, labelPropsForStock, stockPanels } = await import("../src/data/label_stock.ts");
const { panelBoxes, turnPanels } = await import("../src/utils/label_panels.ts");
const { labelPropsFromPreset, presetIdentity } = await import("../src/utils/label_units.ts");
const { recordFromProps, labelPropsFromRoll, sameLabelGeometry } = await import("../src/utils/roll_memory.ts");
const { CustomCanvas } = await import("../src/fabric-object/custom_canvas.ts");
const { fitObjectsToLabel } = await import("../src/utils/label_fit.ts");
const { Rect } = await import("fabric");

const base = { size: { width: 591, height: 354 }, printDirection: "top", shape: "rect" };
const stock = (id) => LABEL_STOCK.find((item) => item.id === id);
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);

test("all catalogue layouts validate, with cells inside the carrier", () => {
  for (const entry of LABEL_STOCK) {
    const props = labelPropsForStock(entry, base);
    assert.equal(LabelPropsSchema.safeParse(props).success, true, entry.id);
  }
  assert.equal(LabelPropsSchema.safeParse({ ...base, panels: [{ left: 0.9, top: 0, width: 0.2, height: 1 }] }).success, false);
});

test("double circles keep the documented individual diameter and an adjustable blank gutter", () => {
  const entry = stock("b-double-20-round");
  const props = labelPropsForStock(entry, { ...base, size: { width: 420, height: 210 } });
  const cells = panelBoxes(props);
  assert.equal(cells.length, 2);
  assert.equal(cells[0].shape, "circle");
  close(cells[0].width / props.size.width, 20 / 42);
  assert.ok(cells[0].left + cells[0].width < cells[1].left);
  const wider = stockPanels(entry, 2);
  close(wider[0].left, 0);
  close(wider[1].left, 22 / 42);
  const touching = stockPanels(entry, 0);
  close(touching[0].left + touching[0].width, touching[1].left);
});

test("cable and jewellery stock exclude the unprinted tail from body regions", () => {
  for (const [id, body, total] of [["m-cable-25-78", 38, 78], ["b-jewellery-30-70", 25, 70]]) {
    const props = labelPropsForStock(stock(id), base);
    close(props.panels[0].height, body / total);
    assert.equal(props.tailPos, "bottom");
    assert.ok(props.tailLength > 0);
    assert.equal(props.split, "vertical");
  }
});

test("special layouts survive preset validation and reload, while names still replace by name", () => {
  const props = labelPropsForStock(stock("m-double-14"), base);
  const preset = LabelPresetSchema.parse({ title: "Spices", width: 34, height: 17, unit: "mm", printDirection: "top", shape: props.shape, panels: props.panels });
  assert.deepEqual(labelPropsFromPreset(preset).panels, props.panels);
  assert.equal(presetIdentity(preset), "name:spices");
  assert.notEqual(presetIdentity({ ...preset, title: undefined }), presetIdentity({ ...preset, title: undefined, panels: undefined }));
});

test("rotation and roll-memory restoration retain printable regions", () => {
  const props = labelPropsForStock(stock("m-double-14"), base);
  const rotated = { ...props, quarterTurns: 1, size: { width: props.size.height, height: props.size.width }, panels: turnPanels(props.panels) };
  const restored = labelPropsFromRoll(recordFromProps(rotated));
  restored.panels.forEach((panel, index) => {
    for (const key of ["left", "top", "width", "height"]) close(panel[key], rotated.panels[index][key]);
  });
  assert.equal(sameLabelGeometry(restored, rotated), true);
  let panels = props.panels;
  for (let i = 0; i < 4; i++) panels = turnPanels(panels);
  panels.forEach((panel, index) => {
    for (const key of ["left", "top", "width", "height"]) close(panel[key], props.panels[index][key]);
  });
});

test("print rendering clips the die-cut regions before drawing ink", () => {
  const props = labelPropsForStock(stock("b-double-20-round"), base);
  const events = [];
  const context = Object.fromEntries(["save", "restore", "beginPath", "moveTo", "arc", "rect", "roundRect", "clip"].map((name) => [name, (...args) => events.push([name, ...args])]));
  const canvas = {
    labelProps: props, customBackground: false, highlightMirror: false,
    labelSize: () => props.size,
    tracePaperPath: CustomCanvas.prototype.tracePaperPath,
  };
  CustomCanvas.prototype._renderObjects.call(canvas, context, [{ render: () => events.push(["ink"]) }]);
  assert.equal(events.filter(([name]) => name === "arc").length, 2);
  assert.equal(events.filter(([name]) => name === "moveTo").length, 2);
  assert.ok(events.findIndex(([name]) => name === "clip") < events.findIndex(([name]) => name === "ink"));
  assert.equal(events.filter(([name]) => name === "save").length, events.filter(([name]) => name === "restore").length);
});

test("changing the gutter refits each label's artwork into its own region", () => {
  const entry = stock("b-double-20-round");
  const from = labelPropsForStock(entry, base);
  const to = { ...from, panels: stockPanels(entry, 2) };
  const objects = panelBoxes(from).map((panel) => new Rect({ width: 10, height: 10, originX: "center", originY: "center", left: panel.left + panel.width / 2, top: panel.top + panel.height / 2 }));
  fitObjectsToLabel(objects, from, to);
  panelBoxes(to).forEach((panel, index) => {
    close(objects[index].getCenterPoint().x, panel.left + panel.width / 2);
    close(objects[index].getCenterPoint().y, panel.top + panel.height / 2);
  });
});
