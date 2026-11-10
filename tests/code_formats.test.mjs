import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import test from 'node:test';
import { rasterCode } from './code_raster.mjs';
import { prepareZXingModule, readBarcodes } from 'zxing-wasm/reader';

registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('$/')) return nextResolve(new URL(`../src/${specifier.slice(2)}.ts`, import.meta.url).href, context);
  if (specifier.startsWith('.') && context.parentURL) {
    const candidate = new URL(`${specifier}.ts`, context.parentURL);
    if (existsSync(candidate)) return nextResolve(candidate.href, context);
  }
  return nextResolve(specifier, context);
} });

// Never fetch a decoder from a CDN: CI and desktop builds must be reproducible offline.
const wasm = readFileSync(new URL('../node_modules/zxing-wasm/dist/reader/zxing_reader.wasm', import.meta.url));
prepareZXingModule({ overrides: { wasmBinary: wasm.buffer.slice(wasm.byteOffset, wasm.byteOffset + wasm.byteLength) } });
const { util, Group } = await import('fabric');
const { MatrixCode } = await import('../src/fabric-object/matrixcode.ts');
const { Barcode } = await import('../src/fabric-object/barcode.ts');
const { QRCode } = await import('../src/fabric-object/qrcode.ts');
const { encodeCode } = await import('../src/utils/code_encoder.ts');
const { withPreviewPaint } = await import('../src/fabric-object/preview_paint.ts');
const { CanvasUtils } = await import('../src/utils/canvas_utils.ts');
const { canvasPreprocess } = await import('../src/utils/canvas_preprocess.ts');

async function decoded(object) {
  const raster = rasterCode(object);
  const results = await readBarcodes(raster, { tryHarder: true, maxNumberOfSymbols: 1 });
  assert.equal(results.length, 1, `No readable symbol for ${object.type}/${object.encoding}`);
  return results[0].text;
}

for (const encoding of ['DATAMATRIX', 'AZTEC']) {
  test(`${encoding} survives editing, integer resizing and Fabric JSON reload`, async () => {
    const code = new MatrixCode({ encoding, text: 'NiimBlue 0123456789', width: 144, height: 144 });
    assert.equal(code.getEncodingError(), undefined);
    assert.equal(await decoded(code), code.text);
    code.set('text', 'Changed payload 0042');
    code.set({ scaleX: 1.5, scaleY: 1.5 });
    CanvasUtils.fixFabricObjectScale(code);
    assert.equal(code.scaleX, 1);
    assert.equal(code.scaleY, 1);
    assert.equal(await decoded(code), code.text);
    const [reloaded] = await util.enlivenObjects([JSON.parse(JSON.stringify(code.toObject()))]);
    assert.ok(reloaded instanceof MatrixCode);
    assert.equal(reloaded.encoding, encoding);
    assert.equal(await decoded(reloaded), code.text);
  });

  test(`${encoding} preserves Unicode and literal escape-like text`, async () => {
    for (const text of ['Grüße aus Köln · 日本語', '^ECI000003 ^FNC1 ^123 literal']) {
      const code = new MatrixCode({ encoding, text, width: 240, height: 240 });
      assert.equal(code.getEncodingError(), undefined);
      assert.equal(await decoded(code), text);
    }
  });

  test(`${encoding} respects colour preview and restores its monochrome print data`, async () => {
    const code = new MatrixCode({ encoding, text: 'Colour 0042', width: 144, height: 144 });
    const source = code.toObject();
    const group = new Group([code]);
    const paints = rasterCode(code, draw => withPreviewPaint([group], '#c6a15a', '#1a1a1a', draw)).paints;
    assert.equal(paints[0], '#1a1a1a');
    assert.ok(paints.slice(1).every(paint => paint === '#c6a15a'));
    assert.equal(code.fill, source.fill);
    assert.equal(code.stroke, source.stroke);
    group.remove(code);
    assert.equal(await decoded(code), code.text);
  });
}

for (const [encoding, text] of [['CODE128', '00123456789012345678'], ['CODE128', 'Label-09 / aBc'], ['CODE39', 'LABEL-09/123']]) {
  test(`${encoding} decodes the rendered bars and reloads with the same payload: ${text}`, async () => {
    const code = new Barcode({ encoding, text, scaleFactor: 2, height: 96, printText: true });
    assert.equal(code.getEncodingError(), undefined);
    assert.equal(await decoded(code), text);
    const source = code.toObject();
    const preview = rasterCode(code, draw => withPreviewPaint([code], '#f7f4ee', '#1a1a1a', draw));
    assert.equal(preview.paints[0], '#1a1a1a');
    assert.ok(preview.paints.slice(1).every(paint => paint === '#f7f4ee'));
    assert.deepEqual(code.toObject(), source);
    const [reloaded] = await util.enlivenObjects([JSON.parse(JSON.stringify(source))]);
    assert.equal(await decoded(reloaded), text);
  });
}

test('legacy EAN13, Code128 B and QR objects retain their original encoders and content', async () => {
  for (const [encoding, text] of [['EAN13', '5901234123457'], ['CODE128B', 'Legacy-09']]) {
    const code = new Barcode({ encoding, text, scaleFactor: 2, height: 96, backgroundColor: '' });
    const [reloaded] = await util.enlivenObjects([code.toObject()]);
    assert.equal(reloaded.encoding, encoding);
    assert.equal(await decoded(reloaded), text);
  }
  const qr = new QRCode({ text: 'Legacy QR', width: 128, height: 128 });
  const [reloaded] = await util.enlivenObjects([qr.toObject()]);
  assert.equal(await decoded(reloaded), qr.text);
});

test('quiet zones remain empty and matrix dimensions use whole modules', () => {
  for (const encoding of ['DATAMATRIX', 'AZTEC']) {
    const code = new MatrixCode({ encoding, text: '0042', width: 131, height: 131 });
    const raster = rasterCode(code);
    const geometry = encodeCode(encoding, code.text);
    const module = Math.floor(131 / Math.max(geometry.width + 4, geometry.height + 4));
    assert.ok(module >= 1);
    for (let y = 16; y < 147; y++) for (let x = 16; x < 147; x++) {
      if (x < 16 + module * 2 || x >= 147 - module * 2 || y < 16 + module * 2 || y >= 147 - module * 2)
        assert.equal(raster.data[(y * raster.width + x) * 4], 255, `${encoding}: ink in quiet zone`);
    }
  }
  for (const encoding of ['CODE128', 'CODE39']) {
    const code = new Barcode({ encoding, text: 'ABC123', height: 64, scaleFactor: 2, printText: false });
    const raster = rasterCode(code);
    for (let y = 16; y < 80; y++) for (const start of [16, raster.width - 36])
      for (let x = start; x < start + 20; x++)
        assert.equal(raster.data[(y * raster.width + x) * 4], 255);
  }
});

test('invalid data and undersized matrix symbols report errors and can recover', async () => {
  for (const encoding of ['DATAMATRIX', 'AZTEC']) {
    const code = new MatrixCode({ encoding, text: '', width: 128, height: 128 });
    assert.ok(code.getEncodingError());
    code.set('text', 'Recoverable content');
    code.set({ width: 4, height: 4 });
    assert.match(code.getEncodingError(), /size|shorten/);
    code.set({ width: 144, height: 144 });
    assert.equal(code.getEncodingError(), undefined);
    assert.equal(await decoded(code), code.text);
  }
  const barcode = new Barcode({ encoding: 'CODE39', text: 'lowercase', height: 64 });
  assert.ok(barcode.getEncodingError());
  barcode.set('text', 'UPPERCASE');
  assert.equal(barcode.getEncodingError(), undefined);
  assert.equal(await decoded(barcode), 'UPPERCASE');
  barcode.set('encoding', 'CODE128');
  barcode.set('text', '日本語');
  assert.ok(barcode.getEncodingError());
});

test('CSV substitution re-encodes new matrix and linear formats before printing', async () => {
  const objects = [new MatrixCode({ text: '{item}', width: 144, height: 144 }), new Barcode({ encoding: 'CODE128', text: '{item}', height: 96 })];
  canvasPreprocess({ forEachObject: visit => objects.forEach(visit) }, { item: 'PART-0042' });
  for (const code of objects) assert.equal(await decoded(code), 'PART-0042');
});


test('automatic Code128 compacts long numeric payloads compared with legacy Code128 B', () => {
  const text = '012345678901234567890123456789';
  const automatic = new Barcode({ encoding: 'CODE128', text, height: 64 });
  const legacy = new Barcode({ encoding: 'CODE128B', text, height: 64 });
  assert.ok(automatic.width < legacy.width, 'automatic mode should select numeric code set C');
});
