<script lang="ts">
  import * as fabric from "fabric";
  import type { LabelProps, OjectType } from "$/types";
  import type { MaterialIcon } from "$/styles/mdi_icons";
  import { tr, type TranslationKey } from "$/utils/i18n";
  import MdIcon from "$/components/basic/MdIcon.svelte";
  import FramePicker from "$/components/designer-controls/FramePicker.svelte";
  import IconPicker from "$/components/designer-controls/IconPicker.svelte";
  import PdfImportButton from "$/components/designer-controls/PdfImportButton.svelte";
  import ZplImportButton from "$/components/designer-controls/ZplImportButton.svelte";
  import { ArUcoMarker } from "$/fabric-object/aruco";
  import { Barcode } from "$/fabric-object/barcode";
  import { QRCode } from "$/fabric-object/qrcode";
  import type { BorderKind } from "$/utils/label_borders";

  interface InsertItem {
    type: OjectType;
    icon: MaterialIcon;
    label: TranslationKey;
  }

  interface Props {
    labelProps: LabelProps;
    onInsert: (type: OjectType) => void;
    onTime: () => void;
    iconOpen: boolean;
    onToggleIcons: () => void;
    frameOpen: boolean;
    onToggleFrames: () => void;
    onIcon: (icon: MaterialIcon) => void;
    onSvgIcon: (svg: string) => void;
    onClipart: (svg: string) => void;
    onFrame: (kind: BorderKind) => void;
    zplImageReady: (img: Blob) => void;
    pdfImageReady: (img: HTMLCanvasElement) => void;
    canvas: fabric.Canvas | undefined;
    layersRevision: number;
    selectedObject: fabric.FabricObject | undefined;
  }

  let {
    labelProps,
    onInsert,
    onTime,
    iconOpen,
    onToggleIcons,
    frameOpen,
    onToggleFrames,
    onIcon,
    onSvgIcon,
    onClipart,
    onFrame,
    zplImageReady,
    pdfImageReady,
    canvas,
    layersRevision,
    selectedObject,
  }: Props = $props();

  const items: InsertItem[] = [
    { type: "text", icon: "title", label: "editor.objectpicker.text" },
    { type: "image", icon: "image", label: "editor.objectpicker.image" },
    { type: "barcode", icon: "view_week", label: "editor.objectpicker.barcode" },
    { type: "qrcode", icon: "qr_code_2", label: "editor.objectpicker.qrcode" },
    { type: "line", icon: "horizontal_rule", label: "editor.objectpicker.line" },
    { type: "rectangle", icon: "crop_square", label: "editor.objectpicker.rectangle" },
    { type: "circle", icon: "radio_button_unchecked", label: "editor.objectpicker.circle" },
    { type: "aruco", icon: "grid_on", label: "editor.objectpicker.aruco" },
  ];

  const layerName = (obj: fabric.FabricObject): string => {
    if (obj instanceof QRCode) {
      return $tr("editor.objectpicker.qrcode");
    }
    if (obj instanceof Barcode) {
      return $tr("editor.objectpicker.barcode");
    }
    if (obj instanceof ArUcoMarker) {
      return $tr("editor.objectpicker.aruco");
    }
    if (obj instanceof fabric.Textbox || obj instanceof fabric.IText) {
      const text = obj.text?.trim().split("\n")[0] ?? "";
      return text.slice(0, 28) || $tr("editor.objectpicker.text");
    }
    if (obj instanceof fabric.FabricText) {
      if (obj.fontFamily === "Material Icons") {
        return $tr("shell.icons");
      }
      const text = obj.text?.trim().split("\n")[0] ?? "";
      return text.slice(0, 28) || $tr("editor.objectpicker.text");
    }
    if (obj instanceof fabric.FabricImage) {
      return $tr("editor.objectpicker.image");
    }
    if (obj instanceof fabric.Circle) {
      return $tr("editor.objectpicker.circle");
    }
    if (obj instanceof fabric.Rect) {
      return $tr("editor.objectpicker.rectangle");
    }
    if (obj instanceof fabric.Polyline || obj instanceof fabric.Line) {
      return $tr("editor.objectpicker.line");
    }
    return $tr("shell.layer.object");
  };

  const layerIcon = (obj: fabric.FabricObject): MaterialIcon => {
    if (obj instanceof QRCode) return "qr_code_2";
    if (obj instanceof Barcode) return "view_week";
    if (obj instanceof ArUcoMarker) return "grid_on";
    if (obj instanceof fabric.FabricImage) return "image";
    if (obj instanceof fabric.Circle) return "radio_button_unchecked";
    if (obj instanceof fabric.Rect) return "crop_square";
    if (obj instanceof fabric.Polyline || obj instanceof fabric.Line) return "horizontal_rule";
    if (obj instanceof fabric.FabricText && obj.fontFamily === "Material Icons") return "emoji_emotions";
    return "title";
  };

  let layers = $derived.by(() => {
    layersRevision;
    return canvas?.getObjects().slice().reverse() ?? [];
  });

  const selectLayer = (obj: fabric.FabricObject) => {
    if (!canvas) {
      return;
    }
    canvas.setActiveObject(obj);
    canvas.requestRenderAll();
  };
</script>

<div class="rail-heading">{$tr("shell.insert")}</div>

{#each items as item (item.type)}
  <button
    class="rail-item"
    type="button"
    title={item.type === "aruco" ? $tr("shell.aruco.help") : undefined}
    onclick={() => onInsert(item.type)}>
    <MdIcon icon={item.icon} />
    <span>{$tr(item.label)}</span>
  </button>
  {#if item.type === "circle"}
    <button class="rail-item" class:active={frameOpen} type="button" aria-expanded={frameOpen} onclick={onToggleFrames}>
      <MdIcon icon="border_outer" />
      <span>{$tr("shell.frames")}</span>
    </button>
    {#if frameOpen}
      <div class="icon-browser">
        <FramePicker labelShape={labelProps.shape ?? "rect"} {onFrame} />
      </div>
    {/if}
  {/if}
{/each}

<button class="rail-item" type="button" onclick={onTime}>
  <MdIcon icon="schedule" />
  <span>{$tr("shell.time")}</span>
</button>

<button class="rail-item" class:active={iconOpen} type="button" aria-expanded={iconOpen} onclick={onToggleIcons}>
  <MdIcon icon="emoji_emotions" />
  <span>{$tr("shell.icons")}</span>
</button>

{#if iconOpen}
  <div class="icon-browser">
    <IconPicker
      embedded
      onSubmit={onIcon}
      onSubmitSvg={onSvgIcon}
      {onClipart} />
  </div>
{/if}

<div class="rail-heading">{$tr("shell.import")}</div>
<div class="rail-import">
  <PdfImportButton {labelProps} onImageReady={pdfImageReady} />
  <ZplImportButton {labelProps} onImageReady={zplImageReady} />
</div>

<div class="rail-heading">{$tr("shell.layers")}</div>
{#if layers.length === 0}
  <p class="layer-empty">{$tr("shell.layers.empty")}</p>
{:else}
  <div class="layer-list">
    {#each layers as obj (obj)}
      <button
        class="layer-item"
        class:active={selectedObject === obj}
        type="button"
        onclick={() => selectLayer(obj)}>
        <MdIcon icon={layerIcon(obj)} />
        <span>{layerName(obj)}</span>
      </button>
    {/each}
  </div>
{/if}
