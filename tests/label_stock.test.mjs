import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import test from "node:test";

registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier.startsWith(".") && context.parentURL) {
    const candidate = new URL(`${specifier}.ts`, context.parentURL);
    if (existsSync(candidate)) return nextResolve(candidate.href, context);
  }
  return nextResolve(specifier, context);
} });

const { LABEL_STOCK, STOCK_FAMILIES, labelPropsForStock } = await import("../src/data/label_stock.ts");
const current = {
  size: { width: 100, height: 200 }, printDirection: "left", shape: "circle",
  split: "vertical", splitParts: 3, tailLength: 50, tailPos: "bottom",
  mirror: "flip", quarterTurns: 3, paperColor: "white", inkColor: "black",
};

test("stock catalogue has unique sourced formats and valid round geometry", () => {
  assert.equal(new Set(LABEL_STOCK.map((item) => item.id)).size, LABEL_STOCK.length);
  for (const stock of LABEL_STOCK) {
    assert.ok(STOCK_FAMILIES.includes(stock.family));
    assert.ok(stock.widthMm > 0 && stock.heightMm > 0);
    assert.equal(new URL(stock.source).protocol, "https:");
    if (stock.shape === "circle") assert.equal(stock.widthMm, stock.heightMm);
  }
});

test("M2 50x30 sets physical paper size and clears incompatible special layouts", () => {
  const original = structuredClone(current);
  const paper = labelPropsForStock(LABEL_STOCK.find((item) => item.id === "m-50-30"), current);
  assert.deepEqual(paper.size, { width: 591, height: 354 });
  assert.equal(paper.printDirection, "top");
  assert.equal(paper.shape, "rect");
  assert.equal(paper.quarterTurns, 0);
  assert.equal(paper.split, "none");
  assert.equal(paper.tailLength, 0);
  assert.equal(paper.mirror, "none");
  assert.equal(paper.paperColor, current.paperColor);
  assert.equal(paper.inkColor, current.inkColor);
  assert.deepEqual(current, original);
});

test("narrow labels put the short dimension across the head", () => {
  for (const stock of LABEL_STOCK.filter((item) => item.family === "d")) {
    const paper = labelPropsForStock(stock, current);
    assert.equal(paper.printDirection, "left");
    assert.ok(paper.size.width > paper.size.height);
    assert.ok(stock.heightMm <= 15);
  }
});

test("square and circular stock of the same size remain separate choices", () => {
  const square = labelPropsForStock(LABEL_STOCK.find((item) => item.id === "b-30-square"), current);
  const circle = labelPropsForStock(LABEL_STOCK.find((item) => item.id === "b-30-round"), current);
  assert.deepEqual(square.size, circle.size);
  assert.equal(square.shape, "rect");
  assert.equal(circle.shape, "circle");
});
