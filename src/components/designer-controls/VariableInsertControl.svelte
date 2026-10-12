<script lang="ts">
  import * as fabric from "fabric";
  import { tr } from "$/utils/i18n";
  import QRCode from "$/fabric-object/qrcode";
  import Barcode from "$/fabric-object/barcode";

  interface Props {
    selectedObject: fabric.FabricObject;
    valueUpdated: () => void;
  }

  let { selectedObject, valueUpdated }: Props = $props();

  const insertDateTime = (format?: string) => {
    let value = "{dt}";
    if (format) {
      value = `{dt|${format}}`;
    }

    if (selectedObject instanceof fabric.IText) {
      selectedObject.exitEditing();
      selectedObject.set({ text: `${selectedObject.text}${value}` });
    } else if (selectedObject instanceof QRCode) {
      selectedObject.set({ text: `${selectedObject.text}${value}` });
    } else if (selectedObject instanceof Barcode) {
      selectedObject.set({ text: `${selectedObject.text}${value}` });
    }

    valueUpdated();
  };
</script>

<div class="field">
  <span class="field-label">{$tr("params.variables.insert")}</span>
  <div class="choice-row">
    <button class="btn btn-outline-secondary btn-sm" type="button" onclick={() => insertDateTime()}>
      {$tr("params.variables.insert.datetime")}
    </button>
    <button class="btn btn-outline-secondary btn-sm" type="button" onclick={() => insertDateTime("YYYY-MM-DD")}>
      {$tr("params.variables.insert.date")}
    </button>
    <button class="btn btn-outline-secondary btn-sm" type="button" onclick={() => insertDateTime("HH:mm:ss")}>
      {$tr("params.variables.insert.time")}
    </button>
  </div>
</div>
