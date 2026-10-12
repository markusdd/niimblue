<script lang="ts">
  import {
    LabelPresetSchema,
    type LabelPreset,
    type LabelProps,
    type LabelShape,
    type LabelSplit,
    type LabelUnit,
    type MirrorType,
    type TailPosition,
  } from "$/types";
  import LabelPresetsBrowser from "$/components/designer-controls/LabelPresetsBrowser.svelte";
  import { printerMeta } from "$/stores";
  import { tr } from "$/utils/i18n";
  import { DEFAULT_LABEL_PRESETS } from "$/defaults";
  import { onMount, tick } from "svelte";
  import { LocalStoragePersistence } from "$/utils/persistence";
  import type { PrintDirection } from "@mmote/niimbluelib";
  import MdIcon from "$/components/basic/MdIcon.svelte";
  import { Toasts } from "$/utils/toasts";
  import { FileUtils } from "$/utils/file_utils";
  import { z } from "zod";
  import { formatMm, formatMmValue, mmToPx, normalizeLabelPresets, pxToEditableMm, pxToMm } from "$/utils/label_units";
  import { normalizeTurns, swapIfOdd } from "$/utils/label_orientation";

  interface Props {
    labelProps: LabelProps;
    onChange: (newProps: LabelProps) => void;
    onRotate?: () => void;
    embedded?: boolean;
  }

  let { labelProps, onChange, onRotate, embedded = false }: Props = $props();

  const tailPositions: TailPosition[] = ["right", "bottom", "left", "top"];
  const printDirections: PrintDirection[] = ["left", "top"];
  const labelShapes: LabelShape[] = ["rect", "rounded_rect", "circle"];
  const labelSplits: LabelSplit[] = ["none", "vertical", "horizontal"];
  const mirrorTypes: MirrorType[] = ["none", "flip", "copy"];

  let labelPresets = $state<LabelPreset[]>(DEFAULT_LABEL_PRESETS);

  let title = $state<string | undefined>("");
  let prevUnit: LabelUnit = "mm";
  let unit = $state<LabelUnit>("mm");
  let width = $state<number>(0);
  let height = $state<number>(0);
  let printDirection = $state<PrintDirection>("left");
  let shape = $state<LabelShape>("rect");
  let split = $state<LabelSplit>("none");
  let splitParts = $state<number>(2);
  let tailLength = $state<number>(0);
  let tailPos = $state<TailPosition>("right");
  let mirror = $state<MirrorType>("none");

  let error = $derived.by<string>(() => {
    let error = "";

    if ($printerMeta !== undefined) {
      const physical = swapIfOdd(labelProps.size.width, labelProps.size.height, labelProps.quarterTurns);
      const headPx = labelProps.printDirection == "left" ? physical.height : physical.width;
      const headMm = pxToMm(headPx);
      const maxMm = pxToMm($printerMeta.printheadPixels, $printerMeta.dpi);
      if (headMm > maxMm + 0.05) {
        error += $tr("params.label.warning.width") + " ";
        error += `(${formatMm(headPx)} > ${formatMmValue(maxMm)} ${$tr("params.label.mm")})`;
        error += "\n";
      }

      if ($printerMeta.printDirection !== labelProps.printDirection) {
        error += $tr("params.label.warning.direction") + " ";
        if ($printerMeta.printDirection == "left") {
          error += $tr("params.label.direction.left");
        } else {
          error += $tr("params.label.direction.top");
        }
      }
    }

    return error;
  });

  const toDesignPx = (value: number): number => {
    return unit === "mm" ? mmToPx(value) : Math.max(1, Math.round(value));
  };

  const toDesignLength = (value: number): number => {
    if (value <= 0) {
      return 0;
    }
    return unit === "mm" ? mmToPx(value) : Math.round(value);
  };

  const applyWith = (quarterTurns: number | undefined) => {
    onChange({
      printDirection: printDirection,
      size: {
        width: toDesignPx(width),
        height: toDesignPx(height),
      },
      shape,
      split: shape === "circle" ? "none" : split,
      splitParts,
      tailPos,
      tailLength: toDesignLength(tailLength),
      mirror,
      quarterTurns: normalizeTurns(quarterTurns),
    });
  };

  const onApply = () => applyWith(labelProps.quarterTurns);

  const onLabelPresetSelected = (index: number) => {
    const preset = labelPresets[index];

    if (preset !== undefined) {
      prevUnit = preset.unit;
      unit = preset.unit;
      printDirection = preset.printDirection;
      width = preset.width;
      height = preset.height;
      title = preset.title ?? "";
      shape = preset.shape ?? "rect";
      split = preset.split ?? "none";
      splitParts = preset.splitParts ?? 2;
      tailPos = preset.tailPos ?? "right";
      tailLength = preset.tailLength ?? 0;
      mirror = preset.mirror ?? "none";
    }

    applyWith(0);
  };

  const onLabelPresetDelete = (idx: number) => {
    const result = [...labelPresets];
    result.splice(idx, 1);
    labelPresets = result;
    LocalStoragePersistence.saveLabelPresets(labelPresets);
  };

  const onLabelPresetAdd = () => {
    const newPreset: LabelPreset = {
      printDirection,
      unit,
      width,
      height,
      title,
      shape,
      split,
      splitParts,
      tailPos,
      tailLength,
      mirror,
    };
    const newPresets = [...labelPresets, newPreset];
    try {
      LocalStoragePersistence.saveLabelPresets(newPresets);
      labelPresets = newPresets;
    } catch (e) {
      Toasts.zodErrors(e, "Presets save error:");
    }
  };

  const onFlip = () => {
    const widthTmp = width;
    width = height;
    height = widthTmp;
  };

  const onUnitChange = () => {
    if (prevUnit === "mm" && unit === "px") {
      width = mmToPx(width);
      height = mmToPx(height);
      tailLength = tailLength <= 0 ? 0 : mmToPx(tailLength);
    } else if (prevUnit === "px" && unit === "mm") {
      width = pxToEditableMm(width);
      height = pxToEditableMm(height);
      tailLength = tailLength <= 0 ? 0 : pxToEditableMm(tailLength);
    }
    prevUnit = unit;
  };

  const fillWithCurrentParams = () => {
    printDirection = labelProps.printDirection;
    shape = labelProps.shape ?? "rect";
    split = labelProps.split ?? "none";
    splitParts = labelProps.splitParts ?? 2;
    tailPos = labelProps.tailPos ?? "right";
    mirror = labelProps.mirror ?? "none";
    if (unit === "mm") {
      width = pxToEditableMm(labelProps.size.width);
      height = pxToEditableMm(labelProps.size.height);
      tailLength = pxToEditableMm(labelProps.tailLength ?? 0);
    } else {
      width = labelProps.size.width;
      height = labelProps.size.height;
      tailLength = labelProps.tailLength ?? 0;
    }
    prevUnit = unit;
  };

  const onImportClicked = async () => {
    const contents = await FileUtils.pickAndReadSingleTextFile("json");
    const rawData = JSON.parse(contents);

    if (!confirm($tr("params.label.warning.import"))) {
      return;
    }

    try {
      const presets = normalizeLabelPresets(z.array(LabelPresetSchema).parse(rawData));
      LocalStoragePersistence.saveLabelPresets(presets);
      labelPresets = presets;
    } catch (e) {
      Toasts.zodErrors(e, "Presets load error:");
    }
  };

  const onExportClicked = () => {
    try {
      FileUtils.saveLabelPresetsAsJson(labelPresets);
    } catch (e) {
      Toasts.zodErrors(e, "Presets save error:");
    }
  };

  onMount(() => {
    const defaultPreset: LabelPreset = DEFAULT_LABEL_PRESETS[0];
    width = defaultPreset.width;
    height = defaultPreset.height;
    prevUnit = defaultPreset.unit;
    unit = defaultPreset.unit;
    printDirection = defaultPreset.printDirection;
    shape = defaultPreset.shape ?? "rect";
    split = defaultPreset.split ?? "none";
    tailPos = defaultPreset.tailPos ?? "right";
    tailLength = defaultPreset.tailLength ?? 0;
    mirror = defaultPreset.mirror ?? "none";

    try {
      const savedPresets: LabelPreset[] | null = LocalStoragePersistence.loadLabelPresets();
      if (savedPresets !== null) {
        const normalized = normalizeLabelPresets(savedPresets);
        labelPresets = normalized;
        const signature = (items: LabelPreset[]) =>
          JSON.stringify(
            items.map((p) => ({
              width: p.width,
              height: p.height,
              unit: p.unit,
              printDirection: p.printDirection,
              title: p.title ?? "",
              shape: p.shape ?? "rect",
              split: p.split ?? "none",
              splitParts: p.splitParts ?? 2,
              tailPos: p.tailPos ?? "right",
              tailLength: p.tailLength ?? 0,
              mirror: p.mirror ?? "none",
            })),
          );
        const storedDensity = savedPresets.some(
          (p) => p.dpmm !== undefined || (p.title !== undefined && /\d+\s*dpi/i.test(p.title)),
        );
        if (storedDensity || signature(savedPresets) !== signature(normalized)) {
          LocalStoragePersistence.saveLabelPresets(normalized);
        }
      }
    } catch (e) {
      Toasts.zodErrors(e, "Presets load error:");
    }

    tick().then(() => fillWithCurrentParams());
  });

  $effect(() => {
    labelProps.printDirection;
    labelProps.size.width;
    labelProps.size.height;
    labelProps.shape;
    labelProps.split;
    labelProps.splitParts;
    labelProps.tailPos;
    labelProps.tailLength;
    labelProps.mirror;
    fillWithCurrentParams();
  });

  $effect(() => {
    if (shape === "circle" && split !== "none") split = "none";
  });

  $effect(() => {
    if (split === "none" || tailLength < 0) tailLength = 0;
  });

  $effect(() => {
    if (mirror === "flip" && splitParts !== 2) mirror = "copy";
  });
</script>

<div class="label-props" class:dropdown={!embedded} class:embedded>
  {#if !embedded}
    <button class="btn btn-sm btn-secondary" type="button" data-bs-toggle="dropdown" data-bs-auto-close="outside">
      <MdIcon icon="settings" />
    </button>
  {/if}
  <div class={embedded ? "label-props-body" : "dropdown-menu"}>
    {#if !embedded}
      <h6 class="dropdown-header">{$tr("params.label.menu_title")}</h6>
    {/if}

    <div class="px-3">
      <div class="p-1">
        <button class="btn btn-sm btn-outline-secondary" onclick={onImportClicked}>
          <MdIcon icon="data_object" />
          {$tr("params.label.import")}
        </button>
        <button class="btn btn-sm btn-outline-secondary" onclick={onExportClicked}>
          <MdIcon icon="data_object" />
          {$tr("params.label.export")}
        </button>
      </div>
      <div class="mb-3 {error ? 'cursor-help text-warning' : 'text-secondary'}" title={error}>
        {$tr("params.label.current")}
        {formatMm(labelProps.size.width)} × {formatMm(labelProps.size.height)}
        {$tr("params.label.mm")}
        {#if labelProps.printDirection === "top"}
          ({$tr("params.label.direction")} {$tr("params.label.direction.top")})
        {:else if labelProps.printDirection === "left"}
          ({$tr("params.label.direction")} {$tr("params.label.direction.left")})
        {/if}
        <button class="btn btn-sm" onclick={fillWithCurrentParams}><MdIcon icon="arrow_downward" /></button>
      </div>

      <LabelPresetsBrowser
        class="mb-1"
        presets={labelPresets}
        onItemSelected={onLabelPresetSelected}
        onItemDelete={onLabelPresetDelete} />

      <div class="input-group flex-nowrap input-group-sm mb-2">
        <span class="input-group-text">{$tr("params.label.size")}</span>
        <input class="form-control" type="number" min="1" step={unit === "px" ? 1 : 0.1} bind:value={width} />
        <button class="btn btn-sm btn-secondary" type="button" onclick={onFlip}>
          <MdIcon icon="swap_horiz" />
        </button>
        <input class="form-control" type="number" min="1" step={unit === "px" ? 1 : 0.1} bind:value={height} />
        <select class="form-select" bind:value={unit} onchange={onUnitChange}>
          <option value="mm"> {$tr("params.label.mm")}</option>
          <option value="px"> {$tr("params.label.px")}</option>
        </select>
      </div>

      {#if onRotate}
      <button
        class="btn btn-sm btn-outline-secondary w-100 mb-2"
        type="button"
        onclick={onRotate}
        title={$tr("shell.rotate_hint")}>
        <MdIcon icon="rotate_right" />
        {$tr("shell.rotate")}
        {#if labelProps.size.width > labelProps.size.height}
          · {$tr("params.label.landscape")}
        {:else if labelProps.size.height > labelProps.size.width}
          · {$tr("params.label.portrait")}
        {/if}
      </button>
      {/if}

      <div class="input-group flex-nowrap input-group-sm print-dir-switch mb-2" role="group">
        <span class="input-group-text w-100">{$tr("params.label.direction")}</span>
        {#each printDirections as v (v)}
          <input
            type="radio"
            class="btn-check"
            name="print-dir"
            id="print-dir-{v}"
            autocomplete="off"
            bind:group={printDirection}
            value={v} />
          <label class="btn btn-outline-secondary px-3" for="print-dir-{v}">
            <div class="svg-icon"></div>
          </label>
        {/each}
      </div>

      <div class="input-group flex-nowrap input-group-sm label-shape-switch mb-2" role="group">
        <span class="input-group-text w-100">{$tr("params.label.shape")}</span>
        {#each labelShapes as v (v)}
          <input
            type="radio"
            class="btn-check"
            name="label-shape"
            id="label-shape-{v}"
            autocomplete="off"
            bind:group={shape}
            value={v}
            onchange={onApply} />
          <label class="btn btn-outline-secondary px-3" for="label-shape-{v}">
            <div class="svg-icon"></div>
          </label>
        {/each}
      </div>

      {#if shape !== "circle"}
        <div class="input-group flex-nowrap input-group-sm label-split-switch mb-2" role="group">
          <span class="input-group-text w-100">{$tr("params.label.split")}</span>
          {#each labelSplits as v (v)}
            <input
              type="radio"
              class="btn-check"
              name="label-split"
              id="label-split-{v}"
              autocomplete="off"
              bind:group={split}
              value={v} />
            <label class="btn btn-outline-secondary px-3" for="label-split-{v}">
              <div class="svg-icon"></div>
            </label>
          {/each}
        </div>

        {#if split !== "none"}
          <div class="input-group flex-nowrap input-group-sm mb-2">
            <span class="input-group-text">{$tr("params.label.split.count")}</span>
            <input class="form-control" type="number" min="1" bind:value={splitParts} />
          </div>
        {/if}
      {/if}

      {#if split !== "none"}
        <div class="input-group flex-nowrap input-group-sm mirror-switch mb-2" role="group">
          <span class="input-group-text w-100">{$tr("params.label.mirror")}</span>
          {#each mirrorTypes as v (v)}
            <input
              type="radio"
              class="btn-check"
              name="mirror"
              id="mirror-{v}"
              autocomplete="off"
              bind:group={mirror}
              value={v} />
            <label class="btn btn-outline-secondary px-3" for="mirror-{v}">
              <div class="svg-icon"></div>
            </label>
          {/each}
        </div>

        <div class="input-group flex-nowrap input-group-sm tail-pos-switch mb-2" role="group">
          <span class="input-group-text w-100">{$tr("params.label.tail.position")}</span>
          {#each tailPositions as v (v)}
            <input
              type="radio"
              class="btn-check"
              name="tail-pos"
              id="tail-{v}"
              autocomplete="off"
              bind:group={tailPos}
              value={v} />
            <label class="btn btn-outline-secondary px-3" for="tail-{v}">
              <div class="svg-icon"></div>
            </label>
          {/each}
        </div>

        <div class="input-group flex-nowrap input-group-sm mb-2">
          <span class="input-group-text">{$tr("params.label.tail.length")}</span>
          <input class="form-control" type="number" min="1" bind:value={tailLength} />
          <span class="input-group-text">
            {#if unit === "mm"}{$tr("params.label.mm")}{/if}
            {#if unit === "px"}{$tr("params.label.px")}{/if}
          </span>
        </div>
      {/if}

      <div class="input-group flex-nowrap input-group-sm mb-2">
        <span class="input-group-text">{$tr("params.label.label_title")}</span>
        <input class="form-control" type="text" bind:value={title} />
      </div>

      <div class="text-end">
        <button class="btn btn-sm btn-secondary" onclick={onLabelPresetAdd}>
          {$tr("params.label.save_template")}
        </button>
        <button class="btn btn-sm btn-primary" onclick={onApply}>{$tr("params.label.apply")}</button>
      </div>
    </div>
  </div>
</div>

<style>
  .dropdown-menu {
    width: 100vw;
    max-width: 450px;
  }

  .label-props.embedded,
  .label-props.embedded .label-props-body {
    width: 100%;
  }

  .embedded :global(.input-group) {
    max-width: 100%;
  }

  .cursor-help {
    cursor: help;
  }

  .svg-icon {
    height: 1.7em;
    width: 1.7em;
    background-color: #2a2622;
    background-repeat: no-repeat;
    background-position: center;
    background-size: cover;
    border-radius: 3px;
    box-shadow: 0 0 0 2px #f6f3ec;
  }

  .tail-pos-switch .svg-icon {
    background-image: url("../assets/tail-pos.svg");
  }
  .tail-pos-switch label[for="tail-bottom"] .svg-icon {
    transform: rotate(90deg);
  }
  .tail-pos-switch label[for="tail-bottom"] .svg-icon {
    transform: rotate(90deg);
  }
  .tail-pos-switch label[for="tail-left"] .svg-icon {
    transform: rotate(180deg);
  }
  .tail-pos-switch label[for="tail-top"] .svg-icon {
    transform: rotate(270deg);
  }
  .print-dir-switch .svg-icon {
    background-image: url("../assets/print-dir.svg");
  }
  .print-dir-switch label[for="print-dir-top"] .svg-icon {
    transform: rotate(90deg);
  }

  .label-shape-switch label[for="label-shape-rect"] .svg-icon {
    background-image: url("../assets/shape-rect.svg");
  }
  .label-shape-switch label[for="label-shape-rounded_rect"] .svg-icon {
    background-image: url("../assets/shape-rrect.svg");
  }
  .label-shape-switch label[for="label-shape-circle"] .svg-icon {
    background-image: url("../assets/shape-circle.svg");
  }

  .label-split-switch label[for="label-split-none"] .svg-icon {
    background-image: url("../assets/shape-rrect.svg");
  }
  .label-split-switch label[for="label-split-vertical"] .svg-icon {
    background-image: url("../assets/split-vertical.svg");
    transform: rotate(90deg);
  }
  .label-split-switch label[for="label-split-horizontal"] .svg-icon {
    background-image: url("../assets/split-vertical.svg");
  }

  .mirror-switch label[for="mirror-none"] .svg-icon {
    background-image: url("../assets/mirror-none.svg");
  }
  .mirror-switch label[for="mirror-copy"] .svg-icon {
    background-image: url("../assets/mirror-copy.svg");
  }
  .mirror-switch label[for="mirror-flip"] .svg-icon {
    background-image: url("../assets/mirror-flip.svg");
  }
</style>
