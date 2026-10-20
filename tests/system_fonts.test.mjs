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
const { normalizeFontFamilies } = await import("../src/utils/font_names.ts");
const { discoverSystemFonts, canDiscoverSystemFonts } = await import("../src/utils/system_fonts.ts");
const { enumerateSystemFonts, localFontRequestAllowed } = await import("../devtools/system_fonts.ts");

test("font families retain Unicode names and deduplicate weights and aliases", () => {
  assert.deepEqual(normalizeFontFamilies([" Zulu ", "Alpha", "alpha", "Zulu", "日本語", null, "", "bad\x00font"]), ["Alpha", "Zulu", "日本語"]);
});

test("desktop uses native enumeration even if a browser API is present", async () => {
  const fonts = await discoverSystemFonts(false, {
    nativeInvoke: async (command) => { assert.equal(command, "list_system_fonts"); return ["Serif", "Sans", "Serif"]; },
    query: async () => { throw new Error("Browser permission must not be requested"); },
  });
  assert.deepEqual(fonts, { source: "desktop", families: ["Sans", "Serif"] });
});

test("automatic discovery never requests browser font permission", async () => {
  const env = { query: async () => { throw new Error("Needs a user gesture"); } };
  assert.equal(await discoverSystemFonts(false, env), undefined);
  assert.equal(canDiscoverSystemFonts(env), true);
  assert.equal(canDiscoverSystemFonts({}), false);
});

test("manual browser discovery uses its permission API", async () => {
  const result = await discoverSystemFonts(true, { query: async () => [{ family: "Local Sans" }] });
  assert.deepEqual(result, { source: "browser", families: ["Local Sans"] });
});

test("localhost development can list host fonts without a browser API", async () => {
  const fonts = await discoverSystemFonts(false, { dev: true, fetch: async (url) => {
    assert.equal(url, "/__niimblue/system-fonts");
    return Response.json({ families: ["Local Serif"] });
  } });
  assert.deepEqual(fonts, { source: "dev", families: ["Local Serif"] });
});

test("enumeration rejects failures and invalid responses", async () => {
  await assert.rejects(discoverSystemFonts(false, { nativeInvoke: async () => ({}) }), /Invalid font list/);
  await assert.rejects(discoverSystemFonts(false, { dev: true, fetch: async () => new Response("", { status: 500 }) }), /Could not list/);
  await assert.rejects(discoverSystemFonts(true, { query: async () => { throw new Error("Permission denied"); }, dev: true, fetch: async () => { assert.fail("must respect denied permission"); } }), /Permission denied/);
});

test("Linux fontconfig metadata includes family aliases", async () => {
  const fonts = await enumerateSystemFonts("linux", async (file, args) => {
    assert.equal(file, "fc-list");
    assert.deepEqual(args, ["--format", "%{family}\\n"]);
    return "Noto Sans,Noto Sans Regular\nDejaVu Serif\nNoto Sans\n";
  });
  assert.deepEqual(fonts, ["DejaVu Serif", "Noto Sans", "Noto Sans Regular"]);
});

test("Windows and macOS font metadata handles Unicode and a single family", async () => {
  assert.deepEqual(await enumerateSystemFonts("win32", async () => '\uFEFF"日本語"'), ["日本語"]);
  assert.deepEqual(await enumerateSystemFonts("darwin", async () => '["Serif", "Sans"]'), ["Sans", "Serif"]);
});

test("host font discovery is limited to localhost and same-origin requests", () => {
  assert.equal(localFontRequestAllowed("localhost:5173", undefined, "127.0.0.1"), true);
  assert.equal(localFontRequestAllowed("[::1]:5173", "http://[::1]:5173", "::1"), true);
  assert.equal(localFontRequestAllowed("localhost:5173", "http://localhost:5173", "::ffff:127.0.0.1"), true);
  assert.equal(localFontRequestAllowed("localhost:5173", "https://other.example", "127.0.0.1"), false);
  assert.equal(localFontRequestAllowed("localhost:5173", undefined, "192.168.1.2"), false);
  assert.equal(localFontRequestAllowed("other.example", undefined, "127.0.0.1"), false);
});
