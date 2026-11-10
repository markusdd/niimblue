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
const harness = `
<script>
  import Inspector from './src/components/shell/InspectorPanel.svelte';
  let { code } = $props();
  let revision = $state(0);
</script>
<Inspector selectedObject={code} selectedCount={1} editRevision={revision}
  labelProps={{size:{width:300,height:150}}}
  onValueUpdated={() => revision++} onUpdateLabelProps={() => {}}
  onRotate={() => {}} onDelete={() => {}} onClone={() => {}} />`;

// Exercise the real inspector and code controls in a DOM. Unrelated panels are
// stubbed so this regression needs neither a printer nor a native canvas.
const bundle = await build({
  stdin: { contents: `
    import { mount, flushSync } from 'svelte';
    import Harness from 'inspector-harness';
    import { MatrixCode, isMatrixCode } from './src/fabric-object/matrixcode.ts';
    import { MatrixCode as RetainedMatrixCode } from 'retained-matrixcode';
    window.probe = { mount, flushSync, Harness, MatrixCode, RetainedMatrixCode, isMatrixCode };`, resolveDir: root },
  bundle: true, write: false, platform: 'browser', format: 'iife',
  alias: { $: resolve(root, 'src') },
  plugins: [{ name: 'inspector-test', setup(builder) {
    builder.onResolve({ filter: /^inspector-harness$/ }, () => ({ path: 'harness', namespace: 'harness' }));
    builder.onLoad({ filter: /.*/, namespace: 'harness' }, () => ({
      contents: compile(harness, { filename: 'Harness.svelte', generate: 'client' }).js.code, resolveDir: root,
    }));
    // Evaluate the real class twice, as happens across a hot update, while
    // sharing Fabric and all other dependencies between the two constructors.
    builder.onResolve({ filter: /^retained-matrixcode$/ }, () => ({
      path: resolve(root, 'src/fabric-object/matrixcode.ts'), namespace: 'retained',
    }));
    builder.onLoad({ filter: /.*/, namespace: 'retained' }, ({ path }) => ({
      contents: readFileSync(path, 'utf8'), loader: 'ts', resolveDir: dirname(path),
    }));
    builder.onResolve({ filter: /utils\/i18n$/ }, () => ({ path: 'i18n', namespace: 'i18n' }));
    builder.onLoad({ filter: /.*/, namespace: 'i18n' }, () => ({
      contents: `import {writable} from 'svelte/store'; export const tr=writable(key=>key);`, resolveDir: root,
    }));
    builder.onLoad({ filter: /\.svelte$/ }, ({ path }) => ({
      contents: compile(/\/(InspectorPanel|MatrixCodeParamsControls|QRCodeParamsControls|VariableInsertControl|MdIcon)\.svelte$/.test(path)
        ? readFileSync(path, 'utf8') : '', { filename: path, generate: 'client' }).js.code,
      resolveDir: dirname(path),
    }));
  } }],
});

for (const retained of [false, true]) {
  test(`2D inspector can select and edit all formats with a ${retained ? 'retained' : 'current'} constructor`, () => {
    const dom = new JSDOM('<html><body><main></main></body></html>', {
      url: 'http://localhost', runScripts: 'dangerously', pretendToBeVisual: true,
    });
    try {
      dom.window.eval(bundle.outputFiles[0].text);
      const { mount, flushSync, Harness, MatrixCode, RetainedMatrixCode, isMatrixCode } = dom.window.probe;
      const code = retained ? new RetainedMatrixCode() : new MatrixCode();
      assert.equal(code instanceof MatrixCode, !retained);
      assert.equal(isMatrixCode(code), true);
      mount(Harness, { target: dom.window.document.querySelector('main'), props: { code } });
      flushSync();
      const doc = dom.window.document;
      assert.equal(doc.querySelector('.inspector-tools').hidden, false);
      const select = doc.querySelector('#matrixcode-encoding');
      assert.ok(select, 'the selected 2D code must expose its format selector');
      assert.deepEqual(Array.from(select.options, option => option.value), ['QRCODE', 'DATAMATRIX', 'DATAMATRIX_RECT', 'MICROQR', 'AZTEC', 'PDF417']);
      select.value = 'MICROQR';
      select.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
      flushSync();
      const size = doc.querySelector('#microqr-size');
      assert.ok(size, 'Micro QR exposes an exact square size');
      size.value = '24';
      size.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
      flushSync();
      assert.equal(code.width, 24);
      assert.equal(code.height, 24);
      assert.equal(code.getEncodingError(), undefined);
      select.value = 'DATAMATRIX_RECT';
      select.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
      flushSync();
      assert.ok(code.width > code.height);
      assert.equal(code.getEncodingError(), undefined);
      assert.ok(doc.querySelector('input[aria-label="shell.pos.w"]'));
      assert.equal(doc.querySelector('#microqr-size'), null);
      select.value = 'PDF417';
      select.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
      flushSync();
      assert.equal(code.encoding, 'PDF417');
      assert.equal(code.width, 288);
      const width = doc.querySelector('input[aria-label="shell.pos.w"]');
      assert.ok(width, 'rectangular sizing controls appear immediately');
      width.value = '384';
      width.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
      flushSync();
      assert.equal(code.width, 384);
      select.value = 'AZTEC';
      select.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
      flushSync();
      assert.equal(code.encoding, 'AZTEC');
      assert.equal(code.width, code.height);
      assert.equal(doc.querySelector('input[aria-label="shell.pos.w"]'), null);
      const content = doc.querySelector('#matrixcode-content');
      content.value = 'Editable payload';
      content.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
      flushSync();
      assert.equal(code.text, 'Editable payload');
      const dateButton = Array.from(doc.querySelectorAll('button')).find(button => button.textContent.trim() === 'params.variables.insert.date');
      dateButton.click();
      flushSync();
      assert.equal(code.text, 'Editable payload{dt|YYYY-MM-DD}');
      assert.equal(content.value, code.text);
    } finally {
      dom.window.close();
    }
  });
}
