<script lang="ts">
  import { MatrixCode } from "$/fabric-object/matrixcode";
  import { tr } from "$/utils/i18n";

  interface Props {
    selectedMatrixCode: MatrixCode;
    editRevision: number;
    valueUpdated: () => void;
  }

  let { selectedMatrixCode, editRevision, valueUpdated }: Props = $props();
  let encodingError = $derived.by(() => {
    void editRevision;
    return selectedMatrixCode.getEncodingError();
  });
</script>

<input type="hidden" value={editRevision} />

<div class="field">
  <label class="field-label" for="matrixcode-encoding">{$tr("params.matrixcode.encoding")}</label>
  <select
    id="matrixcode-encoding"
    class="form-select form-select-sm"
    value={selectedMatrixCode.encoding}
    onchange={(e) => {
      selectedMatrixCode.set("encoding", e.currentTarget.value);
      valueUpdated();
    }}>
    <option value="DATAMATRIX">{$tr("params.matrixcode.datamatrix")}</option>
    <option value="AZTEC">{$tr("params.matrixcode.aztec")}</option>
  </select>
</div>

<div class="field">
  <label class="field-label" for="matrixcode-content">{$tr("params.barcode.content")}</label>
  <textarea
    id="matrixcode-content"
    class="matrixcode-content form-control form-control-sm"
    value={selectedMatrixCode.text}
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
