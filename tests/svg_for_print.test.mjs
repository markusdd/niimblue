import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { JSDOM } from "jsdom";
import { svgForPrint } from "../src/utils/svg_for_print.ts";

const { window } = new JSDOM("");
globalThis.DOMParser = window.DOMParser;
globalThis.XMLSerializer = window.XMLSerializer;
const parse = (svg) => new DOMParser().parseFromString(svg, "image/svg+xml");

test("outline icons retain group paint and stroke properties", () => {
  const svg = svgForPrint('<svg xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M1 1L9 9"/><circle cx="5" cy="5" r="2" fill="currentColor"/></g></svg>');
  const document = parse(svg);
  assert.equal(document.querySelector("path").getAttribute("fill"), "none");
  assert.equal(document.querySelector("path").getAttribute("stroke"), "#000");
  assert.equal(document.querySelector("path").getAttribute("stroke-width"), "2");
  assert.equal(document.querySelector("path").getAttribute("stroke-linecap"), "round");
  assert.equal(document.querySelector("circle").getAttribute("fill"), "#000");
});

test("filled icons keep holes and default to black", () => {
  const document = parse(svgForPrint('<svg xmlns="http://www.w3.org/2000/svg"><g fill-rule="evenodd"><path d="M0 0H9V9H0Z M2 2H7V7H2Z"/></g></svg>'));
  assert.equal(document.querySelector("path").getAttribute("fill"), "#000");
  assert.equal(document.querySelector("path").getAttribute("fill-rule"), "evenodd");
});

test("every bundled icon converts to valid SVG with explicit monochrome paint", () => {
  let count = 0;
  for (const [collection, defaultSize] of [["tabler", 24], ["health", 48]]) {
    const icons = JSON.parse(readFileSync(new URL(`../src/data/${collection}_icons.json`, import.meta.url)));
    for (const [id, icon] of Object.entries(icons)) {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${icon.width ?? defaultSize} ${icon.height ?? defaultSize}"${collection === "tabler" ? ' fill="none"' : ""}>${icon.body}</svg>`;
      const document = parse(svgForPrint(svg));
      assert.equal(document.querySelector("parsererror"), null, id);
      const shapes = [...document.querySelectorAll("path, circle, rect, polygon, ellipse, polyline, line")];
      assert.ok(shapes.length > 0, id);
      assert.ok(shapes.every((shape) => ["none", "#000"].includes(shape.getAttribute("fill"))), id);
      if (collection === "tabler") assert.ok(shapes.some((shape) => shape.getAttribute("stroke") === "#000"), id);
      count++;
    }
  }
  assert.equal(count, 41);
});

test("malformed SVG is rejected", () => {
  assert.throws(() => svgForPrint('<svg><path d="broken"></svg>'), /Invalid icon SVG/);
});
