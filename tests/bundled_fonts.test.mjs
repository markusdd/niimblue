import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import test from "node:test";

registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier.startsWith(".") && context.parentURL) {
    const candidate = new URL(`${specifier}.ts`, context.parentURL);
    if (existsSync(candidate)) return nextResolve(candidate.href, context);
  }
  return nextResolve(specifier, context);
} });
const { BUNDLED_FONTS, BUNDLED_FONT_FAMILIES, bundledFontsInCanvas, loadBundledFont, loadBundledCanvasFonts } = await import("../src/data/bundled_fonts.ts");

test("every included font has local faces and a shipped license notice", () => {
  assert.equal(BUNDLED_FONT_FAMILIES.length, 8);
  assert.equal(new Set(BUNDLED_FONT_FAMILIES).size, 8);
  const css = readFileSync(new URL("../src/styles/font.scss", import.meta.url), "utf8");
  const faces = [...css.matchAll(/@font-face\s*\{([^}]+)\}/g)].map((match) => match[1]);
  for (const font of BUNDLED_FONTS) {
    assert.ok(existsSync(new URL(`../public/licenses/${font.notice}`, import.meta.url)), font.notice);
    const matched = faces.filter((face) => face.includes(`font-family: "${font.family}"`));
    assert.ok(matched.length, font.family);
    for (const face of matched) {
      const source = face.match(/url\("?(\.\.\/assets\/fonts\/[^"\)]+)"?\)/)?.[1];
      if (!source) continue; // Existing Noto Sans comes from the installed, locked package.
      const bytes = readFileSync(new URL(source, new URL("../src/styles/font.scss", import.meta.url)));
      assert.equal(bytes.subarray(0, 4).toString(), "wOF2", source);
    }
  }
});

test("canvas requests retain bold/italic styles inside groups and character overrides", () => {
  const requests = bundledFontsInCanvas({ objects: [{ objects: [{
    fontFamily: "NiimBlue Modern", fontWeight: 700, fontStyle: "italic",
    styles: { 0: { 2: { fontFamily: "NiimBlue Book", fontWeight: 400 } } },
  }] }] });
  assert.deepEqual(requests, [
    { family: "NiimBlue Modern", weight: 700, style: "italic" },
    { family: "NiimBlue Book", weight: 400, style: "italic" },
  ]);
  assert.deepEqual(bundledFontsInCanvas({ objects: [{ fontFamily: "Installed Only" }] }), []);
});

test("font faces finish loading before canvas creation and repeat requests share a load", async () => {
  const previous = globalThis.document;
  const calls = [];
  let release;
  globalThis.document = { fonts: { load(css, sample) { calls.push({ css, sample }); return new Promise((resolve) => { release = resolve; }); } } };
  try {
    let finished = false;
    const task = loadBundledCanvasFonts({ objects: [{ fontFamily: "NiimBlue Mono", fontWeight: 700, fontStyle: "italic" }] }).then(() => { finished = true; });
    const repeated = loadBundledFont({ family: "NiimBlue Mono", weight: 700, style: "italic" });
    await Promise.resolve();
    assert.equal(finished, false);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].css, 'italic 700 16px "NiimBlue Mono"');
    assert.ok(calls[0].sample.includes("Ä") && calls[0].sample.includes("А"));
    release([]);
    await Promise.all([task, repeated]);
    assert.equal(finished, true);
    await loadBundledFont({ family: "Installed Only" });
    assert.equal(calls.length, 1);
  } finally { globalThis.document = previous; }
});

test("a failed font download can be retried", async () => {
  const previous = globalThis.document;
  let calls = 0;
  globalThis.document = { fonts: { async load() { if (++calls === 1) throw new Error("font unavailable"); return []; } } };
  try {
    await assert.rejects(loadBundledFont({ family: "NiimBlue Humanist" }), /font unavailable/);
    await loadBundledFont({ family: "NiimBlue Humanist" });
    assert.equal(calls, 2);
  } finally { globalThis.document = previous; }
});
