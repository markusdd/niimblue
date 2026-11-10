import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

const { compile } = createRequire(import.meta.url)('svelte/compiler');
const root = fileURLToPath(new URL('..', import.meta.url));
const bundle = await build({
  stdin: { contents: `
    import {mount, flushSync} from 'svelte';
    import Designer from './src/components/LabelDesigner.svelte';
    import {Canvas, util} from 'fabric';
    import {QRCode} from './src/fabric-object/qrcode.ts';
    import {configureFabric} from './src/defaults.ts';
    configureFabric();
    window.probe={mount, flushSync, Designer, Canvas, QRCode, util};`, resolveDir: root },
  bundle: true, write: false, platform: 'browser', format: 'iife',
  alias: { $: resolve(root, 'src') },
  define: {
    __APP_VERSION__: '"test"', __APP_COMMIT__: '"test"', __BUILD_DATE__: '"test"',
    'import.meta.url': '"http://localhost/entry.js"', 'import.meta.env.DEV': 'true',
  },
  loader: { '.css': 'empty', '.scss': 'empty', '.svg': 'text' },
  plugins: [{ name: 'designer-components', setup(builder) {
    builder.onLoad({ filter: /\.svelte$/ }, ({ path }) => ({
      contents: compile(readFileSync(path, 'utf8'), { filename: path, generate: 'client', dev: true }).js.code,
      resolveDir: dirname(path),
    }));
  } }],
});

test('the full editor exposes all 2D formats after insertion and after selecting another object', async () => {
  const dom = new JSDOM('<html><body><main id="app"></main></body></html>', {
    url: 'http://localhost', runScripts: 'dangerously', pretendToBeVisual: true,
  });
  const { window } = dom;
  // Keep the real Fabric selection/event flow. Only the unavailable native
  // drawing surface is replaced; this test asserts controls, not pixels.
  window.document.fonts = { check: () => true, load: async () => [], ready: Promise.resolve(), addEventListener() {}, removeEventListener() {} };
  window.HTMLCanvasElement.prototype.getContext = function () {
    return new Proxy({ canvas: this, measureText: () => ({ width: 8 }), getImageData: () => ({ data: new Uint8ClampedArray(4) }) }, {
      get: (target, key) => key in target ? target[key] : () => {},
    });
  };
  window.HTMLCanvasElement.prototype.toDataURL = () => 'data:image/png;base64,';
  window.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  window.localStorage.setItem('locale', 'en');
  try {
    window.eval(bundle.outputFiles[0].text);
    const { mount, flushSync, Designer, Canvas, QRCode, util } = window.probe;
    Canvas.prototype.requestRenderAll = function () { window.probe.canvas = this; return this; };
    mount(Designer, { target: window.document.querySelector('#app') });
    flushSync();
    await new Promise(resolve => setTimeout(resolve, 20));
    flushSync();
    const insert = label => {
      const button = Array.from(window.document.querySelectorAll('.insert-rail > button.rail-item')).find(button => Array.from(button.querySelectorAll('span')).some(span => span.textContent.trim() === label));
      assert.ok(button, `missing insert button: ${label}`);
      button.click();
      flushSync();
    };
    const change = (selector, value, event = 'change') => {
      const input = window.document.querySelector(selector);
      assert.ok(input, `missing control: ${selector}`);
      input.value = value;
      input.dispatchEvent(new window.Event(event, { bubbles: true }));
      flushSync();
    };
    const settle = async () => { await new Promise(resolve => setTimeout(resolve, 20)); flushSync(); };
    assert.equal(Array.from(window.document.querySelectorAll('.insert-rail > button.rail-item')).some(button => button.textContent.trim().endsWith('QR Code')), false);
    insert('2D code');
    assert.equal(window.document.querySelector('#insert-2d-formats'), null, 'left-hand button inserts directly');
    const select = window.document.querySelector('#matrixcode-encoding');
    assert.ok(select);
    assert.deepEqual(Array.from(select.options, option => option.value), ['QRCODE', 'DATAMATRIX', 'DATAMATRIX_RECT', 'MICROQR', 'AZTEC', 'PDF417']);
    assert.equal(select.value, 'QRCODE');
    const canvas = window.probe.canvas;
    const code = canvas.getActiveObject();
    const count = canvas.getObjects().length;
    code.set({ left: 31, top: 47, angle: 17 });
    change('#matrixcode-content', 'PCB-0042', 'input');
    change('#qr-ecl', 'Q');
    change('#qr-version', '2');
    for (const encoding of ['MICROQR', 'DATAMATRIX', 'DATAMATRIX_RECT', 'AZTEC', 'PDF417', 'QRCODE']) {
      change('#matrixcode-encoding', encoding);
      assert.equal(canvas.getActiveObject(), code, 'switch formats on the same object');
      assert.equal(canvas.getObjects().length, count, 'switching must not insert another code');
      assert.equal(code.text, 'PCB-0042');
      assert.equal(window.document.querySelector('#matrixcode-content').value, code.text);
      assert.deepEqual([code.left, code.top, code.angle], [31, 47, 17]);
      assert.equal(code.getEncodingError(), undefined);
      if (encoding === 'MICROQR') {
        change('#microqr-size', '34');
        assert.equal(code.width, 34);
        assert.equal(code.height, 34);
      }
    }
    assert.equal(window.document.querySelector('#qr-ecl').value, 'Q');
    assert.equal(window.document.querySelector('#qr-version').value, '2');
    assert.ok(window.document.querySelector('.layer-item.active').textContent.includes('QR Code'));
    insert('Barcode');
    assert.ok(window.document.querySelector('#barcode-encoding'));
    assert.equal(window.document.querySelector('#matrixcode-encoding'), null);

    // A saved QR still opens with its original class and settings. Its first
    // format change converts it in place in the layer stack, as one undo step.
    const legacySource = new QRCode({ text: 'LEGACY-001', ecl: 'M', mode: 'Byte', qrVersion: 2, width: 160, height: 160, left: 53, top: 67, angle: 11 });
    const [legacy] = await util.enlivenObjects([JSON.parse(JSON.stringify(legacySource.toObject()))]);
    canvas.add(legacy);
    canvas.setActiveObject(legacy);
    flushSync();
    assert.equal(window.document.querySelector('#matrixcode-encoding').value, 'QRCODE');
    assert.equal(window.document.querySelector('#matrixcode-content').value, 'LEGACY-001');
    assert.equal(window.document.querySelector('#qr-version').value, '2');
    change('#qr-ecl', 'Q'); // Record the original object before changing its format.
    const legacyIndex = canvas.getObjects().indexOf(legacy);
    const legacyCount = canvas.getObjects().length;
    change('#matrixcode-encoding', 'MICROQR');
    await settle();
    const converted = canvas.getActiveObject();
    assert.ok(converted.isType('MatrixCode'));
    assert.equal(converted.encoding, 'MICROQR');
    assert.equal(converted.text, 'LEGACY-001');
    assert.deepEqual([converted.left, converted.top, converted.angle], [53, 67, 11]);
    assert.equal(canvas.getObjects().indexOf(converted), legacyIndex);
    assert.equal(canvas.getObjects().length, legacyCount);
    window.document.querySelector('button[title="Undo"]').click();
    await settle();
    const restored = canvas.getObjects().find(object => object.text === 'LEGACY-001');
    assert.ok(restored.isType('QRCode'), 'one undo restores the saved QR class');
    assert.equal(restored.ecl, 'Q');
    assert.equal(canvas.getObjects().length, legacyCount);
    window.document.querySelector('button[title="Redo"]').click();
    await settle();
    const redone = canvas.getObjects().find(object => object.text === 'LEGACY-001');
    assert.ok(redone.isType('MatrixCode'));
    assert.equal(redone.encoding, 'MICROQR');
    canvas.setActiveObject(redone);
    flushSync();
    change('#matrixcode-encoding', 'QRCODE');
    assert.equal(window.document.querySelector('#qr-ecl').value, 'Q');
    assert.equal(window.document.querySelector('#qr-version').value, '2');
    assert.equal(window.document.querySelector('#matrixcode-content').value, 'LEGACY-001');
  } finally {
    dom.window.close();
  }
});
