<script lang="ts">
  import {
    inkColors,
    FabricJsonSchema,
    LabelPresetSchema,
    paperColors,
    type FabricJson,
    type InkColor,
    type LabelPreset,
    type LabelProps,
    type LabelPanel,
    type LabelShape,
    type LabelSplit,
    type LabelUnit,
    type MirrorType,
    type PaperColor,
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
  import { formatMm, formatMmValue, mmToPx, normalizeLabelPresets, presetIdentity, pxToEditableMm, pxToMm } from "$/utils/label_units";
  import { normalizeTurns, swapIfOdd } from "$/utils/label_orientation";
  import { inkSwatch, paperSwatch } from "$/utils/label_colors";
  import { paperBody } from "$/utils/label_fit";
  import type { TranslationKey } from "$/utils/i18n";
  import { LABEL_STOCK, STOCK_FAMILIES, labelPropsForStock, stockPanelGap, stockPanels, type LabelStock, type StockFamily } from "$/data/label_stock";

  interface Props {
    labelProps: LabelProps;
    onChange: (newProps: LabelProps, fit?: boolean) => void;
    onRotate?: () => void;
    onRepeatPanels?: () => void;
    loadedRoll?: { widthMm: number; heightMm: number; tailMm: number; shape: LabelShape };
    onUseLoadedRoll?: () => void;
    /** Current design, including objects. Used when saving a template. */
    getCanvas?: () => FabricJson;
    /** Picture of the current label, used on the preset card. */
    capturePreview?: () => string | undefined;
    /** Loads a template that stored its own objects. */
    onPresetSelected?: (preset: LabelPreset) => void;
    embedded?: boolean;
  }

  let { labelProps, onChange, onRotate, onRepeatPanels, loadedRoll, onUseLoadedRoll, getCanvas, capturePreview, onPresetSelected, embedded = false }: Props = $props();

  const shapeKey = (value: LabelShape | undefined): TranslationKey => {
    if (value === "circle") return "shell.shape.circle";
    if (value === "rounded_rect") return "shell.shape.rounded_rect";
    return "shell.shape.rect";
  };

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
  let previewTicket = 0;
  let selectedStock = $state("");
  let panels = $state<LabelPanel[] | undefined>();
  let panelGap = $state(0);
  let cellWidth = $state(0);
  let cellHeight = $state(0);
  const activeStock = $derived(LABEL_STOCK.find((item) => item.id === selectedStock));
  const stockFamilyKey = (family: StockFamily): TranslationKey => `params.label.stock.${family}` as TranslationKey;
  const stockCaption = (stock: LabelStock): string => {
    const size = stock.dimensionText ?? `${stock.shape === "circle" ? `Ø ${formatMmValue(stock.widthMm)}` : `${formatMmValue(stock.widthMm)} × ${formatMmValue(stock.heightMm)}`} ${$tr("params.label.mm")}`;
    const kind = stock.kind && stock.kind !== "round" ? $tr(`params.label.stock.${stock.kind}` as TranslationKey) : $tr(shapeKey(stock.shape));
    return `${kind} · ${size}`;
  };

  const chooseStock = (id: string) => {
    const stock = LABEL_STOCK.find((item) => item.id === id);
    selectedStock = id;
    if (!stock) return;
    const next = labelPropsForStock(stock, labelProps);
    prevUnit = "mm";
    unit = "mm";
    width = stock.widthMm;
    height = stock.heightMm;
    shape = stock.shape;
    printDirection = stock.printDirection;
    split = next.split ?? "none";
    splitParts = next.splitParts ?? 2;
    tailLength = stock.tailMm ?? 0;
    tailPos = next.tailPos ?? "right";
    mirror = next.mirror ?? "none";
    panels = next.panels;
    panelGap = stockPanelGap(stock);
    cellWidth = stock.cell?.widthMm ?? 0;
    cellHeight = stock.cell?.heightMm ?? 0;
    onChange(next, true);
  };

  const changePanelGap = () => {
    if (!activeStock?.cell || !Number.isFinite(panelGap)) return;
    if (!Number.isFinite(cellWidth) || !Number.isFinite(cellHeight)) return;
    cellWidth = Math.min(activeStock.widthMm / activeStock.cell.count, Math.max(0.1, cellWidth));
    cellHeight = Math.min(activeStock.heightMm, Math.max(0.1, cellHeight));
    const maxGap = (activeStock.widthMm - cellWidth * activeStock.cell.count) / (activeStock.cell.count - 1);
    panelGap = Math.min(Math.max(0, panelGap), Math.max(0, maxGap));
    panels = stockPanels({ ...activeStock, cell: { ...activeStock.cell, widthMm: cellWidth, heightMm: cellHeight } }, panelGap);
    onChange({ ...labelProps, panels }, true);
  };

  const useSingleLabel = () => {
    panels = undefined;
    selectedStock = "";
    split = "none";
    tailLength = 0;
    mirror = "none";
    onChange({ ...labelProps, panels: undefined, split: "none", tailLength: 0, mirror: "none" }, true);
  };

  $effect(() => {
    const stock = LABEL_STOCK.find((item) => item.id === selectedStock);
    if (!stock) return;
    const draftWidth = unit === "mm" ? mmToPx(width) : width;
    const draftHeight = unit === "mm" ? mmToPx(height) : height;
    if (draftWidth !== mmToPx(stock.widthMm) || draftHeight !== mmToPx(stock.heightMm)
      || shape !== stock.shape || printDirection !== stock.printDirection
      || split !== (stock.split ?? "none")
      || Math.abs((unit === "mm" ? tailLength : pxToMm(tailLength)) - (stock.tailMm ?? 0)) > 0.1
      || tailPos !== (stock.tailPos ?? "right") || mirror !== "none") selectedStock = "";
  });

  const replacesPreset = $derived.by(() => {
    const name = title?.trim();
    if (name) {
      return labelPresets.some((preset) => presetIdentity(preset) === `name:${name.toLocaleLowerCase()}`);
    }
    const draft: LabelPreset = {
      width: pxToEditableMm(labelProps.size.width),
      height: pxToEditableMm(labelProps.size.height),
      unit: "mm",
      printDirection: labelProps.printDirection,
      shape: labelProps.shape ?? "rect",
      canvas: { version: "draft", objects: [] },
    };
    const key = presetIdentity(draft);
    return labelPresets.some((preset) => presetIdentity(preset) === key);
  });

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
    const size = { width: toDesignPx(width), height: toDesignPx(height) };
    let tail = shape === "circle" ? 0 : toDesignLength(tailLength);
    if (panels?.length === 1) {
      const extent = tailPos === "left" || tailPos === "right" ? size.width : size.height;
      tail = Math.min(tail, Math.max(0, extent - 1));
    }
    let nextPanels = panels;
    if (panels?.length === 1 && (tail > 0 || (labelProps.tailLength ?? 0) > 0)) {
      if (tail > 0) {
        const body = paperBody({ size, shape, tailPos, tailLength: tail });
        nextPanels = [{ left: body.left / size.width, top: body.top / size.height, width: body.width / size.width, height: body.height / size.height, shape }];
      } else nextPanels = undefined;
    }
    onChange({
      printDirection: printDirection,
      size,
      shape,
      panels: nextPanels,
      split: shape === "circle" ? "none" : split,
      splitParts,
      tailPos,
      tailLength: tail,
      mirror,
      quarterTurns: normalizeTurns(quarterTurns),
      ...(labelProps.paperColor ? { paperColor: labelProps.paperColor } : {}),
      ...(labelProps.inkColor ? { inkColor: labelProps.inkColor } : {}),
    }, true);
  };

  const pickPaper = (paperColor: PaperColor) => {
    onChange({ ...labelProps, paperColor });
  };

  const pickInk = (inkColor: InkColor) => {
    onChange({ ...labelProps, inkColor });
  };

  const paperKey = (color: PaperColor): TranslationKey => `shell.paper.${color}` as TranslationKey;
  const inkKey = (color: InkColor): TranslationKey => `shell.ribbon.${color}` as TranslationKey;
  const lightPaper = (color: PaperColor) => color !== "black" && color !== "green" && color !== "blue";
  const lightInk = (color: InkColor) => color === "white" || color === "gold";

  const onApply = () => applyWith(labelProps.quarterTurns);

  const onLabelPresetSelected = (index: number) => {
    const preset = labelPresets[index];
    if (preset === undefined) return;

    prevUnit = preset.unit;
    unit = preset.unit;
    printDirection = preset.printDirection;
    width = preset.width;
    height = preset.height;
    title = preset.title ?? "";
    shape = preset.shape ?? "rect";
    panels = preset.panels;
    split = preset.split ?? "none";
    splitParts = preset.splitParts ?? 2;
    tailPos = preset.tailPos ?? "right";
    tailLength = preset.tailLength ?? 0;
    mirror = preset.mirror ?? "none";

    if (preset.canvas && onPresetSelected) {
      onPresetSelected(preset);
      return;
    }

    applyWith(preset.quarterTurns ?? 0);
  };

  const onLabelPresetDelete = (idx: number) => {
    const result = [...labelPresets];
    result.splice(idx, 1);
    labelPresets = result;
    LocalStoragePersistence.saveLabelPresets(labelPresets);
  };

  const fillPresetPreviews = async () => {
    const ticket = ++previewTicket;
    const pending = labelPresets.filter((preset) => preset.canvas && !preset.thumbnail);
    if (pending.length === 0) return;
    // eslint-disable-next-line svelte/prefer-svelte-reactivity -- Local accumulator, not reactive state.
    const updates = new Map<string, string>();
    for (const preset of pending) {
      if (ticket !== previewTicket) return;
      try {
        const thumb = await FileUtils.renderPresetThumbnail(preset);
        if (thumb) updates.set(presetIdentity(preset), thumb);
      } catch (e) {
        console.warn(e);
      }
    }
    if (ticket !== previewTicket || updates.size === 0) return;
    const next = labelPresets.map((preset) => {
      const thumb = updates.get(presetIdentity(preset));
      return thumb && !preset.thumbnail ? { ...preset, thumbnail: thumb } : preset;
    });
    try {
      LocalStoragePersistence.saveLabelPresets(next);
      if (ticket === previewTicket) labelPresets = next;
    } catch (e) {
      console.warn(e);
    }
  };

  const onLabelPresetAdd = () => {
    const snapshot = getCanvas ? FabricJsonSchema.parse(getCanvas()) : undefined;
    let thumbnail: string | undefined;
    try {
      thumbnail = capturePreview?.();
    } catch (e) {
      console.warn(e);
    }
    const newPreset: LabelPreset = {
      printDirection: labelProps.printDirection,
      unit: "mm",
      width: pxToEditableMm(labelProps.size.width),
      height: pxToEditableMm(labelProps.size.height),
      title: title?.trim() || undefined,
      shape: labelProps.shape ?? "rect",
      panels: labelProps.panels,
      split: labelProps.shape === "circle" ? "none" : (labelProps.split ?? "none"),
      splitParts: labelProps.splitParts ?? 2,
      tailPos: labelProps.tailPos ?? "right",
      tailLength: labelProps.tailLength ? pxToEditableMm(labelProps.tailLength) : 0,
      mirror: labelProps.shape === "circle" ? "none" : (labelProps.mirror ?? "none"),
      quarterTurns: normalizeTurns(labelProps.quarterTurns),
      ...(labelProps.paperColor ? { paperColor: labelProps.paperColor } : {}),
      ...(snapshot ? { canvas: snapshot, savedAt: Date.now() } : {}),
      ...(thumbnail ? { thumbnail } : {}),
    };
    const key = presetIdentity(newPreset);
    const index = labelPresets.findIndex((preset) => presetIdentity(preset) === key);
    const newPresets = index >= 0 ? labelPresets.map((preset, i) => (i === index ? newPreset : preset)) : [...labelPresets, newPreset];
    try {
      LocalStoragePersistence.saveLabelPresets(newPresets);
      labelPresets = newPresets;
      void fillPresetPreviews();
    } catch (e) {
      if (e instanceof z.ZodError) Toasts.zodErrors(e, "Presets save error:");
      else Toasts.error(e);
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
    panels = labelProps.panels;
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
        void fillPresetPreviews();
      }
    } catch (e) {
      Toasts.zodErrors(e, "Presets load error:");
    }

    tick().then(() => fillWithCurrentParams());
  });

  $effect(() => {
    void labelProps.printDirection;
    void labelProps.size.width;
    void labelProps.size.height;
    void labelProps.shape;
    void labelProps.split;
    void labelProps.splitParts;
    void labelProps.tailPos;
    void labelProps.tailLength;
    void labelProps.mirror;
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

      {#if loadedRoll && onUseLoadedRoll}
        <button type="button" class="loaded-roll" title={$tr("shell.roll_use_hint")} onclick={onUseLoadedRoll}>
          <MdIcon icon="label" />
          <span class="loaded-roll-copy">
            <span class="loaded-roll-title">{$tr("shell.roll_use")}</span>
            <span class="loaded-roll-meta">
              {formatMmValue(loadedRoll.widthMm)} × {formatMmValue(loadedRoll.heightMm)}
              {#if loadedRoll.tailMm > 0}+ {formatMmValue(loadedRoll.tailMm)}{/if}
              {$tr("params.label.mm")} · {$tr(shapeKey(loadedRoll.shape))}
            </span>
          </span>
        </button>
      {/if}

      <LabelPresetsBrowser
        class="mb-1"
        presets={labelPresets}
        onItemSelected={onLabelPresetSelected}
        onItemDelete={onLabelPresetDelete} />

      <div class="mb-2">
        <label class="form-label d-block small mb-0">
          {$tr("params.label.stock.title")}
          <select class="form-select form-select-sm mt-1" value={selectedStock} onchange={(event) => chooseStock(event.currentTarget.value)}>
            <option value="">{$tr("params.label.stock.custom")}</option>
            {#each STOCK_FAMILIES as family (family)}
              <optgroup label={$tr(stockFamilyKey(family))}>
                {#each LABEL_STOCK.filter((item) => item.family === family) as stock (stock.id)}
                  <option value={stock.id}>
                    {stockCaption(stock)}
                  </option>
                {/each}
              </optgroup>
            {/each}
          </select>
        </label>
        <div class="form-text small">{$tr("params.label.stock.hint")}</div>
        {#if activeStock?.cell}
          {#if activeStock.cell.nominal}
            <label class="form-label d-block small mt-2">
              {$tr("params.label.stock.cell_size")}
              <span class="input-group input-group-sm">
                <input class="form-control" aria-label={$tr("params.label.stock.cell_width")} type="number" min="0.1" max={activeStock.widthMm / activeStock.cell.count} step="0.1" bind:value={cellWidth} onchange={changePanelGap} />
                <span class="input-group-text">×</span>
                <input class="form-control" aria-label={$tr("params.label.stock.cell_height")} type="number" min="0.1" max={activeStock.heightMm} step="0.1" bind:value={cellHeight} onchange={changePanelGap} />
              </span>
            </label>
            <div class="form-text small">{$tr("params.label.stock.cell_hint")}</div>
          {/if}
          <label class="form-label d-block small mt-2">
            {$tr("params.label.stock.gap")}
            <input class="form-control form-control-sm" type="number" min="0" step="0.1"
              max={(activeStock.widthMm - cellWidth * activeStock.cell.count) / (activeStock.cell.count - 1)}
              bind:value={panelGap} onchange={changePanelGap} />
          </label>
          <div class="form-text small">{$tr("params.label.stock.gap_hint")}</div>
        {/if}
        {#if panels?.length}
          {#if panels.length > 1 && onRepeatPanels}
            <button type="button" class="btn btn-sm btn-outline-secondary mt-1" onclick={onRepeatPanels}>{$tr("params.label.stock.repeat")}</button>
          {/if}
          <button type="button" class="btn btn-sm btn-outline-secondary mt-1" onclick={useSingleLabel}>{$tr("params.label.stock.single")}</button>
        {/if}
      </div>

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

      <div class="color-block">
        <span class="color-label">{$tr("shell.paper.color")}</span>
        <div class="swatches" role="radiogroup" aria-label={$tr("shell.paper.color")}>
          {#each paperColors as color (color)}
            <button
              type="button"
              class="swatch"
              class:light={lightPaper(color)}
              class:active={(labelProps.paperColor ?? "white") === color}
              style:background={paperSwatch[color]}
              data-paper={color}
              aria-pressed={(labelProps.paperColor ?? "white") === color}
              title={$tr(paperKey(color))}
              onclick={() => pickPaper(color)}></button>
          {/each}
        </div>
        <span class="color-label">{$tr("shell.ribbon.color")}</span>
        <div class="swatches" role="radiogroup" aria-label={$tr("shell.ribbon.color")}>
          {#each inkColors as color (color)}
            <button
              type="button"
              class="swatch"
              class:light={lightInk(color)}
              class:active={(labelProps.inkColor ?? "black") === color}
              style:background={inkSwatch[color]}
              data-ink={color}
              aria-pressed={(labelProps.inkColor ?? "black") === color}
              title={$tr(inkKey(color))}
              onclick={() => pickInk(color)}></button>
          {/each}
        </div>
        <p class="color-hint">{$tr("shell.color.hint")}</p>
      </div>

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

      {#if (panels?.length ?? 0) < 2}
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

      {/if}
      {#if shape !== "circle" && (panels?.length ?? 0) < 2}
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

      {#if split !== "none" && (panels?.length ?? 0) < 2}
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
          {$tr(replacesPreset ? "params.label.update_template" : "params.label.save_template")}
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

  .loaded-roll {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    width: 100%;
    margin: 0 0 0.55rem;
    padding: 0.45rem 0.65rem;
    border: 1px solid #6d829c;
    border-radius: 8px;
    background: #e7eef5;
    color: #1c2836;
    text-align: left;
    cursor: pointer;
  }

  .loaded-roll:hover {
    background: #d5dee9;
  }

  .loaded-roll-copy {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .loaded-roll-title {
    font-weight: 650;
    font-size: 0.84rem;
  }

  .loaded-roll-meta {
    color: #3f4d5c;
    font-size: 0.75rem;
  }

  .color-block {
    margin: 0 0 0.85rem;
  }

  .color-label {
    display: block;
    margin: 0.35rem 0 0.25rem;
    color: #6d655b;
    font-size: 0.75rem;
  }

  .swatches {
    display: flex;
    flex-wrap: wrap;
    gap: 0.55rem;
    padding: 5px;
    margin: -5px;
  }

  .swatch {
    flex: 0 0 auto;
    width: 2.25rem;
    height: 2.25rem;
    border: 0;
    border-radius: 99px;
    padding: 0;
    cursor: pointer;
    box-shadow: inset 0 0 0 1px rgba(36, 31, 26, 0.18);
  }

  .swatch.light {
    box-shadow: inset 0 0 0 1px #b7b1a6;
  }

  .swatch.active {
    box-shadow:
      0 0 0 2px #f6f3ec,
      0 0 0 4px #6d829c;
  }

  .color-hint {
    margin: 0.4rem 0 0;
    color: #6d655b;
    font-size: 0.72rem;
    line-height: 1.3;
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
