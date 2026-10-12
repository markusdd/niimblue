<script lang="ts">
  import { tr } from "$/utils/i18n";
  import * as fabric from "fabric";

  interface Props {
    selectedObject: fabric.FabricObject;
    editRevision: number;
    valueUpdated: () => void;
  }

  let { selectedObject, editRevision, valueUpdated }: Props = $props();

  const roundRadiusChanged = (value: number) => {
    const rect = selectedObject as fabric.Rect;
    rect.set({
      rx: value,
      ry: value,
    });
    valueUpdated();
  };

  const strokeWidthChanged = (value: number) => {
    selectedObject.set({ strokeWidth: value });
    valueUpdated();
  };

  const fillChanged = (value: string) => {
    selectedObject.set({ fill: value });
    valueUpdated();
  };

  const strokeChanged = (value: string) => {
    selectedObject.set({ stroke: value });
    valueUpdated();
  };
</script>

<input type="hidden" value={editRevision}>

{#if selectedObject instanceof fabric.Rect}
  <div class="field">
    <label class="field-label" for="vector-radius">{$tr("params.vector.round_radius")}</label>
    <input
      id="vector-radius"
      type="number"
      min="0"
      max={Math.min(selectedObject.width, selectedObject.height) / 2}
      class="form-control form-control-sm"
      value={selectedObject.rx}
      oninput={(e) => roundRadiusChanged(e.currentTarget.valueAsNumber)} />
  </div>
{/if}

{#if selectedObject instanceof fabric.Rect || selectedObject instanceof fabric.Circle || selectedObject instanceof fabric.Line || selectedObject instanceof fabric.Polyline}
  <div class="field">
    <label class="field-label" for="vector-stroke-width">{$tr("params.vector.stroke_width")}</label>
    <input
      id="vector-stroke-width"
      type="number"
      min="1"
      class="form-control form-control-sm"
      value={selectedObject.strokeWidth}
      oninput={(e) => strokeWidthChanged(e.currentTarget.valueAsNumber)} />
  </div>
{/if}

{#if selectedObject instanceof fabric.Rect || selectedObject instanceof fabric.Circle || selectedObject instanceof fabric.Polyline}
  {#if !(selectedObject instanceof fabric.Polyline)}
    <div class="field">
      <label class="field-label" for="vector-fill">{$tr("params.vector.fill")}</label>
      <select id="vector-fill" class="form-select form-select-sm" value={selectedObject.fill} onchange={(e) => fillChanged(e.currentTarget.value)}>
        <option value="white">{$tr("params.color.white")}</option>
        <option value="black">{$tr("params.color.black")}</option>
        <option value="red">{$tr("params.color.red")}</option>
        <option value="transparent">{$tr("params.color.transparent")}</option>
      </select>
    </div>
  {/if}

  <div class="field">
    <label class="field-label" for="vector-stroke">{$tr("params.vector.stroke_color")}</label>
    <select id="vector-stroke" class="form-select form-select-sm" value={selectedObject.stroke} onchange={(e) => strokeChanged(e.currentTarget.value)}>
      <option value="white">{$tr("params.color.white")}</option>
      <option value="black">{$tr("params.color.black")}</option>
      <option value="red">{$tr("params.color.red")}</option>
      <option value="transparent">{$tr("params.color.transparent")}</option>
    </select>
  </div>
{/if}
