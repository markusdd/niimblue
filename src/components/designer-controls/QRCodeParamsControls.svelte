<script lang="ts">
  import { QRCode } from "$/fabric-object/qrcode";
  import { tr } from "$/utils/i18n";

  interface Props {
    selectedQRCode: QRCode;
    editRevision: number;
    valueUpdated: () => void;
  }

  let { selectedQRCode, editRevision, valueUpdated }: Props = $props();
</script>

<input type="hidden" value={editRevision}>

<div class="field">
  <label class="field-label" for="qr-ecl">{$tr("params.qrcode.ecl")}</label>
  <select
    id="qr-ecl"
    class="form-select form-select-sm"
    value={selectedQRCode.ecl}
    onchange={(e) => {
      selectedQRCode?.set("ecl", e.currentTarget.value);
      valueUpdated();
    }}>
    <option value="L">Level L</option>
    <option value="M">Level M</option>
    <option value="Q">Level Q</option>
    <option value="H">Level H</option>
  </select>
</div>

<div class="field">
  <label class="field-label" for="qr-mode">{$tr("params.qrcode.mode")}</label>
  <select
    id="qr-mode"
    class="form-select form-select-sm"
    value={selectedQRCode.mode}
    onchange={(e) => {
      selectedQRCode?.set("mode", e.currentTarget.value);
      valueUpdated();
    }}>
    <option value="Byte">Byte</option>
    <option value="Numeric">Numeric</option>
    <option value="Alphanumeric">Alphanumeric</option>
    <option value="Kanji">Kanji</option>
  </select>
</div>

<div class="field">
  <label class="field-label" for="qr-version">{$tr("params.qrcode.version")}</label>
  <select
    id="qr-version"
    class="form-select form-select-sm"
    value={selectedQRCode.qrVersion}
    onchange={(e) => {
      selectedQRCode?.set("qrVersion", parseInt(e.currentTarget.value));
      valueUpdated();
    }}>
    <option value={0}>Auto</option>
    {#each { length: 40 }, i (i)}
      <option value={i + 1}>{i + 1}</option>
    {/each}
  </select>
</div>

<div class="field">
  <label class="field-label" for="qr-content">{$tr("params.barcode.content")}</label>
  <textarea
    id="qr-content"
    class="qrcode-content form-control form-control-sm"
    value={selectedQRCode.text}
    oninput={(e) => {
      selectedQRCode?.set("text", e.currentTarget.value);
      valueUpdated();
    }}></textarea>
</div>

<style>
  .qrcode-content {
    height: 6rem;
  }
</style>
