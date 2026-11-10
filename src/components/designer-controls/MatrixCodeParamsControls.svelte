<script lang="ts">
  import {
    MatrixCode,
    isMatrixCode,
    isRectangularMatrixEncoding,
    type MatrixEncoding,
  } from "$/fabric-object/matrixcode";
  import type { QRCode } from "$/fabric-object/qrcode";
  import QRCodeParamsControls from "$/components/designer-controls/QRCodeParamsControls.svelte";
  import { tr } from "$/utils/i18n";

  interface Props {
    selectedMatrixCode: MatrixCode | QRCode;
    onConvertQRCode: (code: QRCode, encoding: MatrixEncoding) => Promise<void>;
    editRevision: number;
    valueUpdated: () => void;
  }

  let { selectedMatrixCode, editRevision, valueUpdated, onConvertQRCode }: Props = $props();
  let current = $derived.by(() => {
    void editRevision;
    return {
      encoding: isMatrixCode(selectedMatrixCode) ? selectedMatrixCode.encoding : "QRCODE",
      text: selectedMatrixCode.text,
      width: selectedMatrixCode.width,
      height: selectedMatrixCode.height,
    };
  });
  let encodingError = $derived.by(() => {
    void editRevision;
    return isMatrixCode(selectedMatrixCode) ? selectedMatrixCode.getEncodingError() : undefined;
  });

  const updateSize = (side: "width" | "height", value: number) => {
    if (!Number.isFinite(value)) return;
    selectedMatrixCode.set(side, Math.max(1, Math.round(value)));
    if (current.encoding === "MICROQR") selectedMatrixCode.set("height", selectedMatrixCode.width);
    selectedMatrixCode.setCoords();
    valueUpdated();
  };
</script>

<input type="hidden" value={editRevision} />

<div class="field">
  <label class="field-label" for="matrixcode-encoding">{$tr("params.matrixcode.encoding")}</label>
  <select
    id="matrixcode-encoding"
    class="form-select form-select-sm"
    value={current.encoding}
    onchange={async (e) => {
      const encoding = e.currentTarget.value as MatrixEncoding;
      if (!isMatrixCode(selectedMatrixCode)) {
        await onConvertQRCode(selectedMatrixCode, encoding);
        return;
      }
      selectedMatrixCode.setEncoding(encoding);
      valueUpdated();
    }}>
    <option value="QRCODE">{$tr("editor.objectpicker.qrcode")}</option>
    <option value="DATAMATRIX">{$tr("params.matrixcode.datamatrix")}</option>
    <option value="DATAMATRIX_RECT">{$tr("params.matrixcode.datamatrix_rect")}</option>
    <option value="MICROQR">{$tr("params.matrixcode.microqr")}</option>
    <option value="AZTEC">{$tr("params.matrixcode.aztec")}</option>
    <option value="PDF417">{$tr("params.matrixcode.pdf417")}</option>
  </select>
</div>

{#if current.encoding === "QRCODE"}
  <QRCodeParamsControls selectedQRCode={selectedMatrixCode} {editRevision} {valueUpdated} showContent={false} />
{/if}

{#if current.encoding === "MICROQR"}
  <div class="field">
    <label class="field-label" for="microqr-size">{$tr("params.matrixcode.size_px")}</label>
    <input
      id="microqr-size"
      class="form-control form-control-sm"
      type="number"
      min="15"
      step="1"
      value={current.width}
      onchange={(e) => updateSize("width", e.currentTarget.valueAsNumber)} />
    <small class="text-muted">{$tr("params.matrixcode.microqr_hint")}</small>
  </div>
{:else if isRectangularMatrixEncoding(current.encoding)}
  <div class="field">
    <span class="field-label">{$tr("params.label.size")}</span>
    <div class="input-group input-group-sm">
      <span class="input-group-text">{$tr("shell.pos.w")}</span>
      <input
        aria-label={$tr("shell.pos.w")}
        class="form-control"
        type="number"
        min="1"
        value={current.width}
        onchange={(e) => updateSize("width", e.currentTarget.valueAsNumber)} />
      <span class="input-group-text">{$tr("shell.pos.h")}</span>
      <input
        aria-label={$tr("shell.pos.h")}
        class="form-control"
        type="number"
        min="1"
        value={current.height}
        onchange={(e) => updateSize("height", e.currentTarget.valueAsNumber)} />
    </div>
  </div>
{/if}

<div class="field">
  <label class="field-label" for="matrixcode-content">{$tr("params.barcode.content")}</label>
  <textarea
    id="matrixcode-content"
    class="matrixcode-content form-control form-control-sm"
    value={current.text}
    oninput={(e) => {
      selectedMatrixCode.set("text", e.currentTarget.value);
      valueUpdated();
    }}></textarea>
</div>

{#if encodingError}
  <p class="invalid-feedback d-block">{encodingError}</p>
{/if}

<style>
  .matrixcode-content {
    height: 6rem;
  }
</style>
