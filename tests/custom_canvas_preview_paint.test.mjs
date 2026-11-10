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

const { QRCode } = await import("../src/fabric-object/qrcode.ts");
const { Barcode } = await import("../src/fabric-object/barcode.ts");
const { inkPaint, paperCss } = await import("../src/utils/label_colors.ts");

function recordingContext() {
  const marks = [];
  const stack = [];
  return {
    marks,
    fillStyle: "#ff00ff", // Catch renderers that accidentally inherit an unrelated paint.
    save() { stack.push(this.fillStyle); },
    restore() { this.fillStyle = stack.pop(); },
    translate() {},
    measureText() { return { width: 6 }; },
    fillRect(...geometry) { marks.push({ kind: "rect", color: this.fillStyle, geometry }); },
    fillText(...geometry) { marks.push({ kind: "text", color: this.fillStyle, geometry }); },
  };
}

function renderCode(object, paperColor, inkColor, preview = true) {
  const context = recordingContext();
  const canvas = { customBackground: preview, highlightMirror: false, labelProps: { paperColor, inkColor } };
  // Exercise the actual CustomCanvas preview/print switch and each code's renderer.
  object.render = (ctx) => { object._renderBackground(ctx); object._render(ctx); };
  CustomCanvas.prototype._renderObjects.call(canvas, context, [object]);
  return context.marks;
}

const schemes = [
  ["black", "gold"], ["black", "white"], ["pink", "blue"], ["kraft", "red"], ["white", "black"], ["yellow", "red_black"],
];

test("QR modules follow changing paper/ribbon previews while retaining monochrome source and print data", () => {
  const qr = new QRCode({ text: "NiimBlue colour regression", width: 128, height: 128 });
  const source = qr.toObject();
  const bitmap = renderCode(qr, "black", "gold", false);
  assert.equal(bitmap[0].color, "#ffffff");
  assert.ok(bitmap.slice(1).every((mark) => mark.color === "#000000"));
  assert.ok(bitmap.length > 100);
  for (const [paper, ribbon] of schemes) {
    const marks = renderCode(qr, paper, ribbon);
    assert.equal(marks[0].color, paperCss(paper));
    assert.ok(marks.slice(1).every((mark) => mark.color === (inkPaint(ribbon) ?? "#000000")));
    assert.deepEqual(marks.map((mark) => mark.geometry), bitmap.map((mark) => mark.geometry));
    assert.deepEqual(qr.toObject(), source, "preview colours must not enter saved QR data");
    assert.deepEqual(renderCode(qr, paper, ribbon, false), bitmap, "printing must not inherit preview paints");
  }
});

test("EAN-13 and Code128 bars, captions and backing follow the selected scheme", () => {
  for (const [encoding, text] of [["EAN13", "5901234123457"], ["CODE128B", "LABEL-09"]]) {
    const barcode = new Barcode({ encoding, text, height: 64, printText: true });
    const source = barcode.toObject();
    const bitmap = renderCode(barcode, "black", "gold", false);
    assert.equal(bitmap[0].color, "#ffffff");
    assert.ok(bitmap.slice(1).every((mark) => mark.color === "#000000"));
    assert.ok(bitmap.some((mark) => mark.kind === "text"));
    for (const [paper, ribbon] of schemes) {
      const marks = renderCode(barcode, paper, ribbon);
      assert.equal(marks[0].color, paperCss(paper));
      assert.ok(marks.slice(1).every((mark) => mark.color === (inkPaint(ribbon) ?? "#000000")));
      assert.deepEqual(marks.map((mark) => mark.geometry), bitmap.map((mark) => mark.geometry));
      assert.deepEqual(barcode.toObject(), source);
      assert.deepEqual(renderCode(barcode, paper, ribbon, false), bitmap);
    }
  }
});

test("legacy saved codes acquire preview colours after Fabric JSON reload", async () => {
  const qr = new QRCode({ text: "Saved QR", width: 96, height: 96 });
  const barcode = new Barcode({ encoding: "CODE128B", text: "SAVED-01", height: 64 });
  const saved = [qr.toObject(), barcode.toObject()];
  saved[1].backgroundColor = ""; // Barcode JSON written before paper backing was supported.
  const { util } = await import("fabric");
  const reloaded = await util.enlivenObjects(JSON.parse(JSON.stringify(saved)));
  for (const object of reloaded) {
    const marks = renderCode(object, "black", "gold");
    assert.equal(marks[0].color, paperCss("black"));
    assert.ok(marks.slice(1).every((mark) => mark.color === inkPaint("gold")));
  }
});

test("nested paper backings restore their source colour when drawing throws", () => {
  const source = new Rect({ width: 8, height: 8, backgroundColor: "#fff" });
  const group = new Group([source]);
  assert.throws(() => withPreviewPaint([group], "#c6a15a", "#1a1a1a", () => {
    assert.equal(source.backgroundColor, "#1a1a1a");
    throw new Error("draw failed");
  }), /draw failed/);
  assert.equal(source.backgroundColor, "#fff");
  assert.equal(group.dirty, true);
});
