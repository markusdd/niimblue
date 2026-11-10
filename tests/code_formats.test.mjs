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
const { qrCodeGeometry } = await import('../src/utils/qrcode.ts');
const { convertLegacyQRCode } = await import('../src/utils/code_2d.ts');
const { withPreviewPaint } = await import('../src/fabric-object/preview_paint.ts');
const { CanvasUtils } = await import('../src/utils/canvas_utils.ts');
const { canvasPreprocess } = await import('../src/utils/canvas_preprocess.ts');

async function decoded(object) {
  const raster = rasterCode(object);
  const results = await readBarcodes(raster, { tryHarder: true, maxNumberOfSymbols: 1 });
  assert.equal(results.length, 1, `No readable symbol for ${object.type}/${object.encoding}`);
  // ZXing normalizes UPC-A to its equivalent EAN-13 representation.
  if (object.encoding === 'UPCA' && results[0].text.length === 13) {
    assert.equal(results[0].text[0], '0');
    return results[0].text.slice(1);
  }
  return results[0].text;
}

for (const encoding of ['QRCODE', 'DATAMATRIX', 'DATAMATRIX_RECT', 'AZTEC', 'PDF417']) {
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

for (const [encoding, text] of [['CODE128', '00123456789012345678'], ['CODE128', 'Label-09 / aBc'], ['CODE39', 'LABEL-09/123'], ['EAN8', '96385074'], ['UPCA', '036000291452']]) {
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
  for (const encoding of ['QRCODE', 'DATAMATRIX', 'DATAMATRIX_RECT', 'AZTEC', 'PDF417']) {
    const code = new MatrixCode({ encoding, text: '0042', width: 131, height: 131 });
    const raster = rasterCode(code);
    const quiet = encoding === 'QRCODE' ? 4 : 2;
    const geometry = encoding === 'QRCODE' ? qrCodeGeometry(code.text, code.ecl, code.mode, code.qrVersion) : encodeCode(encoding, code.text);
    const module = Math.floor(131 / Math.max(geometry.width + quiet * 2, geometry.height + quiet * 2));
    assert.ok(module >= 1);
    for (let y = 16; y < 147; y++) for (let x = 16; x < 147; x++) {
      if (x < 16 + module * quiet || x >= 147 - module * quiet || y < 16 + module * quiet || y >= 147 - module * quiet)
        assert.equal(raster.data[(y * raster.width + x) * 4], 255, `${encoding}: ink in quiet zone`);
    }
  }
  for (const [encoding, text] of [['CODE128', 'ABC123'], ['CODE39', 'ABC123'], ['EAN8', '96385074'], ['UPCA', '036000291452']]) {
    const code = new Barcode({ encoding, text, height: 64, scaleFactor: 2, printText: false });
    const raster = rasterCode(code);
    for (let y = 16; y < 80; y++) for (const start of [16, raster.width - 36])
      for (let x = start; x < start + 20; x++)
        assert.equal(raster.data[(y * raster.width + x) * 4], 255);
  }
});

test('invalid data and undersized matrix symbols report errors and can recover', async () => {
  for (const encoding of ['QRCODE', 'DATAMATRIX', 'DATAMATRIX_RECT', 'AZTEC', 'PDF417']) {
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
  const fixtures = [
    [new MatrixCode({ text: '{item}', width: 144, height: 144 }), 'PART-0042'],
    [new MatrixCode({ encoding: 'QRCODE', text: '{item}', width: 144, height: 144 }), 'PART-0042'],
    [new MatrixCode({ encoding: 'PDF417', text: '{item}' }), 'PART-0042'],
    [new MatrixCode({ encoding: 'DATAMATRIX_RECT', text: '{item}' }), 'PART-0042'],
    [new MatrixCode({ encoding: 'MICROQR', text: '{item}' }), 'PART-0042'],
    [new Barcode({ encoding: 'CODE128', text: '{item}', height: 96 }), 'PART-0042'],
    [new Barcode({ encoding: 'EAN8', text: '{ean}', height: 96 }), '96385074'],
    [new Barcode({ encoding: 'UPCA', text: '{upc}', height: 96 }), '036000291452'],
  ];
  canvasPreprocess({ forEachObject: visit => fixtures.forEach(([code]) => visit(code)) }, { item: 'PART-0042', ean: '9638507', upc: '03600029145' });
  for (const [code, expected] of fixtures) assert.equal(await decoded(code), expected);
});

for (const [encoding, data, complete] of [['EAN8', '9638507', '96385074'], ['UPCA', '03600029145', '036000291452']]) {
  test(`${encoding} calculates missing check digits, captions them and rejects invalid input`, async () => {
    const code = new Barcode({ encoding, text: data, height: 96, scaleFactor: 2 });
    assert.equal(code.getEncodingError(), undefined);
    assert.equal(await decoded(code), complete);
    assert.equal(rasterCode(code).texts.join(''), complete);
    assert.equal(code.text, data, 'keep the user input editable without silently appending digits');
    assert.deepEqual(encodeCode(encoding, data), encodeCode(encoding, complete));
    const [reloaded] = await util.enlivenObjects([JSON.parse(JSON.stringify(code.toObject()))]);
    assert.equal(reloaded.text, data);
    assert.equal(await decoded(reloaded), complete);
    const wrongCheck = complete.slice(0, -1) + ((Number(complete.at(-1)) + 1) % 10);
    code.set('text', wrongCheck);
    assert.match(code.getEncodingError(), /check digit/);
    for (const invalid of ['', data.slice(1), complete + '0', 'A' + data.slice(1), data + '\n', ' ' + data]) {
      code.set('text', invalid);
      assert.ok(code.getEncodingError(), `must reject ${JSON.stringify(invalid)}`);
    }
    code.set('text', '0'.repeat(data.length));
    assert.equal(await decoded(code), '0'.repeat(complete.length));
    code.set('text', complete);
    assert.equal(code.getEncodingError(), undefined);
    assert.equal(await decoded(code), complete);
  });
}

test('PDF417 defaults to a rectangle and stays readable after uneven resizing and reload', async () => {
  const code = new MatrixCode({ encoding: 'PDF417', text: 'Shipment 0042\nDestination: Köln\nContents: 日本語' });
  assert.ok(code.width > code.height);
  assert.equal(code.getEncodingError(), undefined);
  assert.equal(await decoded(code), code.text);
  code.set({ scaleX: 1.5, scaleY: 2 });
  CanvasUtils.fixFabricObjectScale(code);
  assert.equal(code.width, 432);
  assert.equal(code.height, 192);
  assert.equal(await decoded(code), code.text);
  const [reloaded] = await util.enlivenObjects([JSON.parse(JSON.stringify(code.toObject()))]);
  assert.equal(reloaded.width, 432);
  assert.equal(reloaded.height, 192);
  assert.equal(await decoded(reloaded), code.text);
});


test('automatic Code128 compacts long numeric payloads compared with legacy Code128 B', () => {
  const text = '012345678901234567890123456789';
  const automatic = new Barcode({ encoding: 'CODE128', text, height: 64 });
  const legacy = new Barcode({ encoding: 'CODE128B', text, height: 64 });
  assert.ok(automatic.width < legacy.width, 'automatic mode should select numeric code set C');
});

for (const text of ['12345', 'PCB-R2-0042', 'sn:aB-0042', '^ECI000026', '^FNC1 ^123']) {
  test(`Micro QR decodes small PCB identifiers and literal data: ${text}`, async () => {
    const geometry = encodeCode('MICROQR', text);
    assert.ok([11, 13, 15, 17].includes(geometry.width));
    assert.equal(geometry.width, geometry.height);
    for (const moduleSize of [1, 2, 3]) {
      const side = (geometry.width + 4) * moduleSize;
      const code = new MatrixCode({ encoding: 'MICROQR', text, width: side, height: side });
      assert.equal(code.getEncodingError(), undefined);
      assert.equal(await decoded(code), text);
      const raster = rasterCode(code);
      for (let y = 16; y < side + 16; y++) for (let x = 16; x < side + 16; x++) {
        if (x < 16 + 2 * moduleSize || x >= side + 16 - 2 * moduleSize || y < 16 + 2 * moduleSize || y >= side + 16 - 2 * moduleSize)
          assert.equal(raster.data[(y * raster.width + x) * 4], 255, 'Micro QR quiet zone must stay empty');
      }
      const [reloaded] = await util.enlivenObjects([JSON.parse(JSON.stringify(code.toObject()))]);
      assert.equal(reloaded.encoding, 'MICROQR');
      assert.equal(await decoded(reloaded), text);
    }
  });
}

test('Micro QR reports capacity and character limits without truncating data, then recovers', async () => {
  const code = new MatrixCode({ encoding: 'MICROQR' });
  for (const text of ['12345678901234567890123456789012345', 'ABCDEFGHIJKLMNOPQRSTU', 'abcdefghijklmno']) {
    code.set('text', text);
    assert.equal(code.getEncodingError(), undefined);
    assert.equal(await decoded(code), text);
  }
  for (const text of ['123456789012345678901234567890123456', 'abcdefghijklmnop']) {
    code.set('text', text);
    assert.match(code.getEncodingError(), /Micro QR capacity/);
    assert.equal(code.text, text);
  }
  for (const text of ['Köln', '日本語']) {
    code.set('text', text);
    assert.match(code.getEncodingError(), /non-ASCII/);
    assert.equal(code.text, text);
  }
  code.set('text', 'PCB-01');
  assert.equal(code.getEncodingError(), undefined);
  assert.equal(await decoded(code), 'PCB-01');
  code.set({ width: 4, height: 4 });
  assert.match(code.getEncodingError(), /size/);
  code.set({ width: 32, height: 32, scaleX: .625, scaleY: .625 });
  CanvasUtils.fixFabricObjectScale(code);
  assert.equal(code.width, 20, 'Micro QR can be resized below the generic 42px floor');
  assert.equal(code.height, 20);
  assert.equal(await decoded(code), 'PCB-01');
});

test('Micro QR uses the paper/ribbon preview colours and restores printable data', async () => {
  const code = new MatrixCode({ encoding: 'MICROQR', text: 'PCB-01', width: 34, height: 34 });
  const source = code.toObject();
  const paints = rasterCode(code, draw => withPreviewPaint([code], '#c6a15a', '#1a1a1a', draw)).paints;
  assert.equal(paints[0], '#1a1a1a');
  assert.ok(paints.slice(1).every(paint => paint === '#c6a15a'));
  assert.deepEqual(code.toObject(), source);
  assert.equal(await decoded(code), code.text);
});

test('rectangular Data Matrix keeps a wide shape through resizing and reports capacity limits', async () => {
  const code = new MatrixCode({ encoding: 'DATAMATRIX_RECT', text: 'PCB-R2-0042' });
  const geometry = encodeCode(code.encoding, code.text);
  assert.ok(geometry.width > geometry.height);
  assert.ok(code.width > code.height);
  assert.equal(await decoded(code), code.text);
  code.set({ scaleX: 1.25, scaleY: 2 });
  CanvasUtils.fixFabricObjectScale(code);
  assert.equal(code.width, 240);
  assert.equal(code.height, 128);
  assert.equal(await decoded(code), code.text);
  const [reloaded] = await util.enlivenObjects([JSON.parse(JSON.stringify(code.toObject()))]);
  assert.equal(reloaded.width, 240);
  assert.equal(reloaded.height, 128);
  assert.equal(await decoded(reloaded), code.text);
  const excessive = 'A'.repeat(200);
  code.set('text', excessive);
  assert.match(code.getEncodingError(), /rectangular Data Matrix capacity/);
  assert.equal(code.text, excessive);
  code.set('text', 'PCB-02');
  assert.equal(await decoded(code), 'PCB-02');
});

test('changing 2D format retains payload, placement and QR settings through JSON reload', async () => {
  let code = new MatrixCode({ encoding: 'QRCODE', text: '001234', ecl: 'H', mode: 'Numeric', qrVersion: 2, width: 160, height: 160, left: 31, top: 47, angle: 17 });
  assert.equal(await decoded(code), code.text);
  for (const encoding of ['MICROQR', 'DATAMATRIX', 'DATAMATRIX_RECT', 'AZTEC', 'PDF417', 'QRCODE']) {
    code.setEncoding(encoding);
    assert.equal(code.text, '001234');
    assert.deepEqual([code.left, code.top, code.angle], [31, 47, 17]);
    assert.deepEqual([code.ecl, code.mode, code.qrVersion], ['H', 'Numeric', 2]);
    assert.equal(code.getEncodingError(), undefined);
    assert.equal(await decoded(code), code.text);
    [code] = await util.enlivenObjects([JSON.parse(JSON.stringify(code.toObject()))]);
  }
  code.set('qrVersion', 3);
  assert.equal(qrCodeGeometry(code.text, code.ecl, code.mode, code.qrVersion).width, 29);
  assert.equal(await decoded(code), code.text);
  code.set('text', 'Letters');
  assert.ok(code.getEncodingError(), 'numeric-only QR mode must reject letters');
  code.set('mode', 'Byte');
  assert.equal(code.getEncodingError(), undefined);
  assert.equal(await decoded(code), 'Letters');
  code.set('ecl', 'Q');
  assert.equal(await decoded(code), 'Letters');
  code.setEncoding('MICROQR');
  code.set('text', '日本語');
  assert.ok(code.getEncodingError());
  assert.equal(code.text, '日本語', 'an unsupported format must not discard user data');
  code.setEncoding('QRCODE');
  assert.equal(await decoded(code), '日本語');
});

test('legacy QR conversion preserves settings, paints and metadata while leaving the original untouched', async () => {
  const { configureFabric } = await import('../src/defaults.ts');
  configureFabric();
  const qr = new QRCode({ text: 'PCB-001', ecl: 'Q', mode: 'Byte', qrVersion: 2, width: 160, height: 160, left: 31, top: 47, angle: 17, opacity: .8 });
  qr.set('layerInfo', { kind: 'icon', name: 'Board marker' });
  const source = JSON.parse(JSON.stringify(qr.toObject()));
  const code = await convertLegacyQRCode(qr, 'MICROQR');
  assert.ok(code instanceof MatrixCode);
  assert.equal(code.encoding, 'MICROQR');
  assert.equal(code.text, qr.text);
  assert.deepEqual([code.left, code.top, code.angle, code.opacity, code.fill, code.stroke], [qr.left, qr.top, qr.angle, qr.opacity, qr.fill, qr.stroke]);
  assert.deepEqual(code.toObject().layerInfo, source.layerInfo);
  assert.deepEqual([code.ecl, code.mode, code.qrVersion], ['Q', 'Byte', 2]);
  assert.deepEqual(JSON.parse(JSON.stringify(qr.toObject())), source);
  assert.equal(await decoded(code), qr.text);
  code.setEncoding('QRCODE');
  const [reloaded] = await util.enlivenObjects([JSON.parse(JSON.stringify(code.toObject()))]);
  assert.deepEqual([reloaded.ecl, reloaded.mode, reloaded.qrVersion], ['Q', 'Byte', 2]);
  assert.equal(await decoded(reloaded), qr.text);
});
