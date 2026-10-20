<script lang="ts">
  import * as fabric from "fabric";
  import type { FabricJson, LabelPreset, LabelProps, LabelShape } from "$/types";
  import { tr } from "$/utils/i18n";
  import { ArUcoMarker } from "$/fabric-object/aruco";
  import { Barcode } from "$/fabric-object/barcode";
  import { QRCode } from "$/fabric-object/qrcode";
  import ArUcoParamsPanel from "$/components/designer-controls/ArUcoParamsControls.svelte";
  import BarcodeParamsPanel from "$/components/designer-controls/BarcodeParamsControls.svelte";
  import GenericObjectParamsControls from "$/components/designer-controls/GenericObjectParamsControls.svelte";
  import LabelPropsEditor from "$/components/designer-controls/LabelPropsEditor.svelte";
  import QrCodeParamsPanel from "$/components/designer-controls/QRCodeParamsControls.svelte";
  import TextParamsControls from "$/components/designer-controls/TextParamsControls.svelte";
  import VariableInsertControl from "$/components/designer-controls/VariableInsertControl.svelte";
  import VectorParamsControls from "$/components/designer-controls/VectorParamsControls.svelte";
  import MdIcon from "$/components/basic/MdIcon.svelte";
  import RibbonStatus from "$/components/shell/RibbonStatus.svelte";

  interface Props {
    labelProps: LabelProps;
    onUpdateLabelProps: (props: LabelProps, fit?: boolean) => void;
    onRotate: () => void;
    onRepeatPanels?: () => void;
    loadedRoll?: { widthMm: number; heightMm: number; tailMm: number; shape: LabelShape };
    onUseLoadedRoll?: () => void;
    getCanvas?: () => FabricJson;
    capturePreview?: () => string | undefined;
    onPresetSelected?: (preset: LabelPreset) => void;
    selectedObject: fabric.FabricObject | undefined;
    selectedCount: number;
    editRevision: number;
    onDelete: () => void;
    onClone: () => void;
    onValueUpdated: () => void;
  }

  let {
    labelProps,
    onUpdateLabelProps,
    onRotate,
    onRepeatPanels,
    loadedRoll,
    onUseLoadedRoll,
    getCanvas,
    capturePreview,
    onPresetSelected,
    selectedObject,
    selectedCount,
    editRevision,
    onDelete,
    onClone,
    onValueUpdated,
  }: Props = $props();

  let tab = $state<"label" | "selection">("label");

  $effect(() => {
    void selectedObject;
    tab = selectedCount > 0 ? "selection" : "label";
  });
</script>

<div class="inspector-tabs">
  <button class="inspector-tab" class:active={tab === "label"} type="button" onclick={() => (tab = "label")}>
    {$tr("shell.label")}
  </button>
  <button
    class="inspector-tab"
    class:active={tab === "selection"}
    type="button"
    onclick={() => (tab = "selection")}>
    {$tr("shell.selection")}
  </button>
</div>

<div hidden={tab !== "label"}>
  <RibbonStatus
    inkColor={labelProps.inkColor}
    onInk={(color) => onUpdateLabelProps({ ...labelProps, inkColor: color })} />
  <LabelPropsEditor
    embedded
    {labelProps}
    onChange={onUpdateLabelProps}
    {onRotate}
    {onRepeatPanels}
    {loadedRoll}
    {onUseLoadedRoll}
    {getCanvas}
    {capturePreview}
    {onPresetSelected} />
</div>

<div class="inspector-tools" hidden={tab !== "selection"}>
  {#if selectedCount === 0}
    <p class="muted">{$tr("shell.empty")}</p>
  {:else}
    <div class="choice-row">
      <button class="tool-btn danger" type="button" onclick={onDelete}>
        <MdIcon icon="delete" />
        {$tr("editor.delete")}
      </button>
      <button class="tool-btn" type="button" onclick={onClone}>
        <MdIcon icon="content_copy" />
        {$tr("editor.clone")}
      </button>
    </div>

    {#if selectedCount > 1}
      <p class="muted">{$tr("shell.selected_count").replace("{count}", String(selectedCount))}</p>
    {/if}

    {#if selectedObject && selectedCount === 1}
      <GenericObjectParamsControls {selectedObject} {editRevision} valueUpdated={onValueUpdated} />
      <VectorParamsControls {selectedObject} {editRevision} valueUpdated={onValueUpdated} />
    {/if}

    {#if selectedObject instanceof fabric.IText}
      <TextParamsControls selectedText={selectedObject} {editRevision} valueUpdated={onValueUpdated} />
    {/if}

    {#if selectedObject instanceof QRCode}
      <QrCodeParamsPanel selectedQRCode={selectedObject} {editRevision} valueUpdated={onValueUpdated} />
    {/if}

    {#if selectedObject instanceof ArUcoMarker}
      <ArUcoParamsPanel selectedArUco={selectedObject} {editRevision} valueUpdated={onValueUpdated} />
    {/if}

    {#if selectedObject instanceof Barcode}
      <BarcodeParamsPanel selectedBarcode={selectedObject} {editRevision} valueUpdated={onValueUpdated} />
    {/if}

    {#if selectedObject instanceof fabric.IText || selectedObject instanceof QRCode || (selectedObject instanceof Barcode && selectedObject.encoding === "CODE128B")}
      <VariableInsertControl {selectedObject} valueUpdated={onValueUpdated} />
    {/if}
  {/if}
</div>
