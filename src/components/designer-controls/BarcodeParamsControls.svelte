<script lang="ts">
  import { Barcode } from "$/fabric-object/barcode";
  import { tr } from "$/utils/i18n";

  interface Props {
    selectedBarcode: Barcode;
    editRevision: number;
    valueUpdated: () => void;
  }

  let { selectedBarcode, editRevision, valueUpdated }: Props = $props();
</script>

<input type="hidden" value={editRevision}>

<div class="field">
  <label class="field-label" for="barcode-encoding">{$tr("params.barcode.encoding")}</label>
  <select
    id="barcode-encoding"
    class="form-select form-select-sm"
    value={selectedBarcode.encoding}
    onchange={(e) => {
      selectedBarcode?.set("encoding", e.currentTarget.value ?? "EAN13");
      valueUpdated();
    }}>
    <option value="EAN13">EAN13</option>
    <option value="CODE128B">Code128 B</option>
  </select>
</div>

<div class="field">
  <label class="field-label" for="barcode-scale">{$tr("params.barcode.scale")}</label>
  <input
    id="barcode-scale"
    class="form-control form-control-sm"
    type="number"
    min="1"
    value={selectedBarcode.scaleFactor}
    oninput={(e) => {
      selectedBarcode?.set("scaleFactor", e.currentTarget.valueAsNumber ?? 1);
      valueUpdated();
    }} />
</div>

<button
  class="btn btn-sm btn-outline-secondary align-self-start"
  class:active={selectedBarcode.printText}
  type="button"
  onclick={() => {
    selectedBarcode?.set("printText", !selectedBarcode.printText);
    valueUpdated();
  }}>
  {$tr("params.barcode.enable_caption")}
</button>

<div class="field">
  <label class="field-label" for="barcode-font-size">{$tr("params.barcode.font_size")}</label>
  <input
    id="barcode-font-size"
    class="form-control form-control-sm"
    type="number"
    min="1"
    value={selectedBarcode.fontSize}
    oninput={(e) => {
      selectedBarcode?.set("fontSize", e.currentTarget.valueAsNumber ?? 12);
      valueUpdated();
    }} />
</div>

<div class="field">
  <label class="field-label" for="barcode-content">{$tr("params.barcode.content")}</label>
  <textarea
    id="barcode-content"
    class="barcode-content form-control form-control-sm"
    value={selectedBarcode.text}
    oninput={(e) => {
      selectedBarcode?.set("text", e.currentTarget.value);
      valueUpdated();
    }}></textarea>
</div>

<style>
  textarea.barcode-content {
    height: 6rem;
  }
</style>
