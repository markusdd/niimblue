import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import test from "node:test";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("$/"))
      return nextResolve(new URL(`../src/${specifier.slice(2)}.ts`, import.meta.url).href, context);
    if (specifier.startsWith(".") && context.parentURL) {
      const candidate = new URL(`${specifier}.ts`, context.parentURL);
      if (existsSync(candidate)) return nextResolve(candidate.href, context);
    }
    return nextResolve(specifier, context);
  },
});

const { Group, Rect } = await import("fabric");
const { withPreviewPaint } = await import("../src/fabric-object/preview_paint.ts");
const { CustomCanvas } = await import("../src/fabric-object/custom_canvas.ts");

test("preview paints nested white SVG cutouts as paper and restores all source paints", () => {
  const whiteFill = new Rect({ width: 8, height: 8, fill: "#fff", stroke: "#000", strokeWidth: 1 });
  const whiteStroke = new Rect({ width: 8, height: 8, fill: "#000", stroke: "rgb(255, 255, 255)", strokeWidth: 1 });
  const colored = new Rect({ width: 8, height: 8, fill: "#cc3388", stroke: "transparent" });
  const nested = new Group([whiteStroke, colored]);
  const root = new Group([whiteFill, nested]);

  withPreviewPaint([root], "#c6a15a", "#1a1a1a", () => {
    assert.equal(whiteFill.fill, "#1a1a1a");
    assert.equal(whiteFill.stroke, "#c6a15a");
    assert.equal(whiteStroke.fill, "#c6a15a");
    assert.equal(whiteStroke.stroke, "#1a1a1a");
    assert.equal(colored.fill, "#cc3388");
  });

  assert.equal(whiteFill.fill, "#fff");
  assert.equal(whiteFill.stroke, "#000");
  assert.equal(whiteStroke.fill, "#000");
  assert.equal(whiteStroke.stroke, "rgb(255, 255, 255)");
  assert.equal(nested.dirty, true);
  assert.equal(root.dirty, true);
});

test("paint restoration also runs when rendering fails", () => {
  const source = new Rect({ width: 8, height: 8, fill: "white" });
  const failure = new Error("render failed");
  assert.throws(
    () =>
      withPreviewPaint([source], undefined, "#1a1a1a", () => {
        assert.equal(source.fill, "#1a1a1a");
        throw failure;
      }),
    failure,
  );
  assert.equal(source.fill, "white");
});

test("monochrome bitmap rendering leaves white cutout masks untouched", () => {
  const source = new Rect({ width: 8, height: 8, fill: "#fff" });
  let renderedFill;
  source.render = () => {
    renderedFill = source.fill;
  };
  const context = { save() {}, restore() {} };
  const canvas = { customBackground: false, highlightMirror: false, labelProps: { panels: undefined } };

  CustomCanvas.prototype._renderObjects.call(canvas, context, [source]);

  assert.equal(renderedFill, "#fff");
  assert.equal(source.fill, "#fff");
});
