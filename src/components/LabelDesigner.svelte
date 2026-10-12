<script lang="ts">
  import Dropdown from "bootstrap/js/dist/dropdown";
  import * as fabric from "fabric";
  import { onDestroy, onMount, tick, untrack } from "svelte";
  import { get } from "svelte/store";
  import { iconCodepoints, type MaterialIcon } from "$/styles/mdi_icons";
  import { appConfig, automation, connectionState, csvData, heartbeatData, loadedFonts, printerMeta, rfidInfo } from "$/stores";
  import {
    type ExportedLabelTemplate,
    type FabricJson,
    type LabelProps,
    type MoveDirection,
    type OjectType,
  } from "$/types";
  import { FileUtils } from "$/utils/file_utils";
  import { locale, locales, tr } from "$/utils/i18n";
  import { LabelDesignerObjectHelper } from "$/utils/label_designer_object_helper";
  import { LocalStoragePersistence } from "$/utils/persistence";
  import { Toasts } from "$/utils/toasts";
  import { UndoRedo, type UndoState } from "$/utils/undo_redo";
  import CsvControl from "$/components/designer-controls/CsvControl.svelte";
  import MdIcon from "$/components/basic/MdIcon.svelte";
  import PrintPreview from "$/components/PrintPreview.svelte";
  import { DEFAULT_LABEL_PROPS, GRID_SIZE, OBJECT_DEFAULTS } from "$/defaults";
  import { LabelDesignerUtils } from "$/utils/label_designer_utils";
  import SavedLabelsMenu from "$/components/designer-controls/SavedLabelsMenu.svelte";
  import { CustomCanvas } from "$/fabric-object/custom_canvas";
  import { CanvasUtils } from "$/utils/canvas_utils";
  import DebugStuff from "$/components/DebugStuff.svelte";
  import PrinterConnector from "$/components/PrinterConnector.svelte";
  import InspectorPanel from "$/components/shell/InspectorPanel.svelte";
  import InsertPalette from "$/components/shell/InsertPalette.svelte";
  import RibbonStatus from "$/components/shell/RibbonStatus.svelte";
  import { normalizeTurns, rotatePointCw, rotateSplit, rotateTail } from "$/utils/label_orientation";
  import { LabelType, Utils } from "@mmote/niimbluelib";
  import { formatMm, formatMmValue } from "$/utils/label_units";
  import { borderSvg, type BorderKind } from "$/utils/label_borders";
  import { svgForPrint } from "$/data/clipart";
  import {
    detectLoadedRoll,
    labelPropsFromRoll,
    paperMillimetres,
    recallRoll,
    recordFromProps,
    rememberRoll,
    rollIdentity,
    rollSignature,
    sameLabelGeometry,
  } from "$/utils/roll_memory";
  import { rememberRibbonColor, ribbonSnapshot } from "$/utils/ribbon";

  let htmlCanvas: HTMLCanvasElement;

  let fabricCanvas = $state<CustomCanvas>();
  let labelProps = $state<LabelProps>(DEFAULT_LABEL_PROPS);
  let previewOpened = $state<boolean>(false);
  let selectedObject = $state<fabric.FabricObject | undefined>(undefined);
  let selectedCount = $state<number>(0);
  let editRevision = $state<number>(0);
  let printNow = $state<boolean>(false);
  let csvEnabled = $state<boolean>(false);
  let windowWidth = $state<number>(0);
  let undoState = $state<UndoState>({ undoDisabled: false, redoDisabled: false });
  let zoomText = $state<string>("100%");
  let iconPanelOpen = $state<boolean>(false);
  let framePanelOpen = $state<boolean>(false);
  let layersRevision = $state<number>(0);
  let debugStuffShow = $state<boolean>(false);
  let rollStatus = $state<{ widthMm: number; heightMm: number; tailMm: number; remaining?: number } | "unknown">();
  let appliedRollSignature = "";
  let isStandalone = Utils.getAvailableTransports().capacitorBle || "__TAURI__" in window;

  const bumpLayers = () => {
    layersRevision += 1;
  };

  const shapeLabel = (shape: LabelProps["shape"]) => {
    if (shape === "circle") return $tr("shell.shape.circle");
    if (shape === "rounded_rect") return $tr("shell.shape.rounded_rect");
    return $tr("shell.shape.rect");
  };

  const undo = new UndoRedo();

  const discardSelection = () => {
    fabricCanvas!.discardActiveObject();
    fabricCanvas!.requestRenderAll();
    selectedObject = undefined;
    selectedCount = 0;
    editRevision = 0;
  };

  const loadLabelData = async (data: ExportedLabelTemplate) => {
    undo.paused = true;
    onUpdateLabelProps(data.label);
    if (data.csv) {
      $csvData = data.csv;
      csvEnabled = true;
    }
    await FileUtils.loadCanvasState(fabricCanvas!, data.canvas);
    undo.paused = false;
  };

  undo.onLabelUpdate = loadLabelData;
  undo.onStateUpdate = (state: UndoState) => {
    undoState = state;
  };

  const deleteSelected = () => {
    LabelDesignerUtils.deleteSelection(fabricCanvas!);
    discardSelection();
  };

  const cloneSelected = () => {
    LabelDesignerUtils.cloneSelection(fabricCanvas!).then(() => undo.push(fabricCanvas!, labelProps));
  };

  const moveSelected = (direction: MoveDirection, ctrl?: boolean) => {
    LabelDesignerUtils.moveSelection(fabricCanvas!, direction, ctrl);
    undo.push(fabricCanvas!, labelProps);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const key: string = e.key.toLowerCase();
    // windows and linux users are used to ctrl, mac users use cmd
    const cmdOrCtrl = e.metaKey || e.ctrlKey;

    // Esc
    if (key === "escape") {
      discardSelection();
      return;
    }

    if (LabelDesignerUtils.isAnyInputFocused(fabricCanvas!)) {
      return;
    }

    // Arrows
    if (key.startsWith("arrow")) {
      moveSelected(key.slice("arrow".length) as MoveDirection, cmdOrCtrl);
      return;
    }

    if (e.repeat) {
      return;
    }

    // Ctrl + D
    if (cmdOrCtrl && key === "d") {
      e.preventDefault();
      cloneSelected();
      return;
    }

    // Ctrl + Y, Ctrl + Shift + Z
    if ((cmdOrCtrl && key === "y") || (cmdOrCtrl && e.shiftKey && key === "z")) {
      e.preventDefault();
      if (!undoState.redoDisabled) {
        undo.redo();
      }
      return;
    }

    // Ctrl + Z
    if (cmdOrCtrl && key === "z") {
      e.preventDefault();
      if (!undoState.undoDisabled) {
        undo.undo();
      }
      return;
    }

    // Del
    if (key === "delete" || key === "backspace") {
      deleteSelected();
      return;
    }
  };

  const rememberCurrentRoll = (props: LabelProps) => {
    const info = get(rfidInfo);
    const tag = info.labelRfidInfo;
    const key = tag?.tagPresent ? rollIdentity(tag) : undefined;
    if (!key) return;
    const labelType = paperMillimetres(info)?.labelType ?? recallRoll(key)?.labelType;
    rememberRoll(key, recordFromProps(props, labelType));
  };

  const rotateLabel = () => {
    const canvas = fabricCanvas;
    if (!canvas) return;
    const oldW = canvas.getWidth();
    const oldH = canvas.getHeight();
    if (oldW < 1 || oldH < 1) return;
    canvas.discardActiveObject();
    undo.paused = true;
    try {
      for (const obj of canvas.getObjects()) {
        const center = obj.getCenterPoint();
        const next = rotatePointCw(center.x, center.y, oldW, oldH);
        obj.rotate(((obj.angle ?? 0) + 90) % 360);
        obj.setPositionByOrigin(new fabric.Point(next.x, next.y), "center", "center");
        obj.setCoords();
      }
    } finally {
      undo.paused = false;
    }
    const turns = normalizeTurns((labelProps.quarterTurns ?? 0) + 1);
    onUpdateLabelProps({
      ...labelProps,
      quarterTurns: turns,
      size: { width: labelProps.size.height, height: labelProps.size.width },
      tailPos: rotateTail(labelProps.tailPos ?? "right", 1),
      split: labelProps.shape === "circle" ? "none" : rotateSplit(labelProps.split ?? "none", 1),
    });
    canvas.requestRenderAll();
    bumpLayers();
  };

  const onUpdateLabelProps = (newProps: LabelProps) => {
    const prevInk = labelProps.inkColor;
    labelProps = newProps;
    const canvas = fabricCanvas!;
    // Resize paints immediately. The feed mark has to follow quarterTurns
    // in that same paint, or it stays on the top of the resized label.
    canvas.setLabelProps(newProps);
    canvas.setDimensions(newProps.size);
    canvas.virtualZoom(canvas.getVirtualZoom());
    canvas.renderAll();
    if (newProps.inkColor && newProps.inkColor !== prevInk) {
      const snap = ribbonSnapshot(get(rfidInfo), get(heartbeatData));
      if (snap.barcode) rememberRibbonColor(snap.barcode, newProps.inkColor);
    }
    try {
      LocalStoragePersistence.saveLastLabelProps(labelProps);
      undo.push(fabricCanvas!, labelProps);
      rememberCurrentRoll(labelProps);
    } catch (e) {
      Toasts.zodErrors(e, "Label parameters save error:");
    }
  };

  const exportCurrentLabel = (): ExportedLabelTemplate => {
    return FileUtils.makeExportedLabel(fabricCanvas!, labelProps, csvEnabled);
  };

  const onLoadRequested = (label: ExportedLabelTemplate) => {
    loadLabelData(label).then(() => undo.push(fabricCanvas!, labelProps));
  };

  const zplImageReady = async (img: Blob) => {
    await LabelDesignerObjectHelper.addImageBlob(fabricCanvas!, img);
    undo.push(fabricCanvas!, labelProps);
  };

  const pdfImageReady = async (el: HTMLCanvasElement) => {
    const img = new fabric.FabricImage(el, {
      ...OBJECT_DEFAULTS,
      left: 0,
      top: 0,
    });

    fabricCanvas!.add(img);
    fabricCanvas!.setActiveObject(img);
    undo.push(fabricCanvas!, labelProps);
  };

  const onObjectPicked = (objectType: OjectType) => {
    const obj = LabelDesignerObjectHelper.addObject(fabricCanvas!, objectType);
    if (obj !== undefined) {
      fabricCanvas!.setActiveObject(obj);
      undo.push(fabricCanvas!, labelProps);
    }
  };

  const onIconPicked = (i: MaterialIcon) => {
    // todo: icon is not vertically centered
    LabelDesignerObjectHelper.addStaticText(fabricCanvas!, String.fromCodePoint(iconCodepoints[i]), {
      fontFamily: "Material Icons",
      fontSize: 100,
    });
    undo.push(fabricCanvas!, labelProps);
    bumpLayers();
  };

  const onTimePicked = () => {
    const obj = LabelDesignerObjectHelper.addText(fabricCanvas!, "{dt | DD.MM.YYYY HH:mm}", {
      textAlign: "left",
      originX: "left",
      originY: "top",
    });
    fabricCanvas!.setActiveObject(obj);
    undo.push(fabricCanvas!, labelProps);
    bumpLayers();
  };

  const paperBox = () => {
    const canvas = fabricCanvas!;
    const shape = labelProps.shape ?? "rect";
    if (shape === "circle") {
      const width = canvas.width ?? 1;
      const height = canvas.height ?? 1;
      const diameter = Math.min(width, height);
      return {
        left: (width - diameter) / 2,
        top: (height - diameter) / 2,
        width: diameter,
        height: diameter,
      };
    }
    const bounds = canvas.getLabelBounds();
    return { left: bounds.startX, top: bounds.startY, width: bounds.width, height: bounds.height };
  };

  const keepInserted = (obj: fabric.FabricObject) => {
    const canvas = fabricCanvas!;
    canvas.setActiveObject(obj);
    undo.push(canvas, labelProps);
    bumpLayers();
  };

  const onSvgIconPicked = (svg: string) => {
    void LabelDesignerObjectHelper.addSvg(fabricCanvas!, svg)
      .then(keepInserted)
      .catch((e) => Toasts.error(e));
  };

  const onClipartPicked = (svg: string) => {
    const canvas = fabricCanvas!;
    const bounds = paperBox();
    const maxSide = Math.round(Math.min(bounds.width, bounds.height) * 0.38);
    void LabelDesignerObjectHelper.addSvg(canvas, svgForPrint(svg), { maxSide, bounds })
      .then(keepInserted)
      .catch((e) => Toasts.error(e));
  };

  const onFramePicked = (kind: BorderKind) => {
    const canvas = fabricCanvas!;
    const box = paperBox();
    const svg = borderSvg(kind, box.width, box.height, labelProps.shape ?? "rect");
    void LabelDesignerObjectHelper.placeSvg(canvas, svg, box)
      .then(keepInserted)
      .catch((e) => Toasts.error(e));
  };

  const openPreview = () => {
    printNow = false;
    previewOpened = true;
  };

  const openPreviewAndPrint = () => {
    printNow = true;
    previewOpened = true;
  };

  const controlValueUpdated = () => {
    if (selectedObject) {
      selectedObject.setCoords();
      selectedObject.dirty = true;
      undo.push(fabricCanvas!, labelProps);
    }
    fabricCanvas!.requestRenderAll();

    // trigger reactivity for controls
    editRevision++;
  };

  const getCanvasForPreview = (): FabricJson => {
    return fabricCanvas!.toJSON();
  };

  const onCsvPlaceholderPicked = (name: string) => {
    const obj = LabelDesignerObjectHelper.addText(fabricCanvas!, `{${name}}`, {
      textAlign: "left",
      originX: "left",
      originY: "top",
    });
    fabricCanvas!.setActiveObject(obj);
    undo.push(fabricCanvas!, labelProps);
  };

  const onPaste = async (event: ClipboardEvent) => {
    if (LabelDesignerUtils.isAnyInputFocused(fabricCanvas!)) {
      return;
    }

    const openedDropdowns = document.querySelectorAll(".dropdown-menu.show");
    if (openedDropdowns.length > 0) {
      return;
    }

    if (event.clipboardData != null) {
      event.preventDefault();
      const obj = await LabelDesignerObjectHelper.addObjectFromClipboard(fabricCanvas!, event.clipboardData);

      if (obj !== undefined) {
        fabricCanvas!.setActiveObject(obj);
        undo.push(fabricCanvas!, labelProps);
      }
    }
  };

  const clearCanvas = () => {
    if (!confirm($tr("editor.clear.confirm"))) {
      return;
    }
    undo.push(fabricCanvas!, labelProps);
    fabricCanvas!.clear();
  };

  const toggleGrid = () => {
    const newVal = !$appConfig.gridEnabled;
    appConfig.update((cfg) => ({ ...cfg, gridEnabled: newVal }));
    fabricCanvas?.setGridEnabled(newVal);
  };

  const loadLabelFromUrl = async () => {
    try {
      const urlTemplate = await FileUtils.readLabelFromUrl();

      if (urlTemplate !== null && confirm($tr("params.saved_labels.load.url.warn"))) {
        onLoadRequested(urlTemplate);
        Toasts.message($tr("params.saved_labels.load.url.loaded"));
        return true;
      }
    } catch (e) {
      Toasts.error(e);
    }
    return false;
  }

  const loadDefaultLabel = async () => {
    const urlLoaded = await loadLabelFromUrl();

    if (urlLoaded) {
      return;
    }

    try {
      const defaultTemplate = LocalStoragePersistence.loadDefaultTemplate();

      if (defaultTemplate !== null) {
        onLoadRequested(defaultTemplate);
        return;
      }
    } catch (e) {
      Toasts.error(e);
    }

    LabelDesignerObjectHelper.addText(fabricCanvas!, $tr("editor.default_text"));
  };

  const renderOnFontsChanged = () => {
    fabricCanvas?.forEachObject((o) => {
      if (o instanceof fabric.Textbox) {
        o.dirty = true;
      }
    });
    fabricCanvas?.requestRenderAll();
  };

  onMount(async () => {
    try {
      const savedLabelProps = LocalStoragePersistence.loadLastLabelProps();
      if (savedLabelProps !== null) {
        labelProps = savedLabelProps;
      }
    } catch (e) {
      Toasts.zodErrors(e, "Label parameters load error:");
    }

    fabricCanvas = new CustomCanvas(htmlCanvas, {
      width: labelProps.size.width,
      height: labelProps.size.height,
    });
    fabricCanvas.setLabelProps(labelProps);
    fabricCanvas.onZoomChange = (z) => {
      zoomText = Math.round(z * 100) + "%";
    };
    fabricCanvas.setGridEnabled(!!$appConfig.gridEnabled);

    await loadDefaultLabel();

    window.addEventListener("hashchange", loadLabelFromUrl);

    undo.push(fabricCanvas, labelProps);

    // force close dropdowns on touch devices
    fabricCanvas.on("mouse:down", (): void => {
      const dropdowns = document.querySelectorAll("[data-bs-toggle='dropdown']");
      dropdowns.forEach((el) => new Dropdown(el).hide());
    });

    fabricCanvas.on("object:moving", (e): void => {
      if (e.target && e.target.left !== undefined && e.target.top !== undefined) {
        e.target.set({
          left: Math.round(e.target.left / GRID_SIZE) * GRID_SIZE,
          top: Math.round(e.target.top / GRID_SIZE) * GRID_SIZE,
        });
      }
    });

    fabricCanvas.on("object:added", bumpLayers);
    fabricCanvas.on("object:removed", bumpLayers);
    bumpLayers();

    fabricCanvas.on("object:modified", (): void => {
      undo.push(fabricCanvas!, labelProps);
      bumpLayers();
    });

    fabricCanvas.on("text:changed", () => {
      editRevision++;
      bumpLayers();
    });

    fabricCanvas.on("object:removed", (): void => {
      undo.push(fabricCanvas!, labelProps);
    });

    fabricCanvas.on("selection:created", (e): void => {
      selectedCount = e.selected?.length ?? 0;
      selectedObject = e.selected?.length === 1 ? e.selected[0] : undefined;
      editRevision++;
    });

    fabricCanvas.on("selection:updated", (e): void => {
      selectedCount = e.selected?.length ?? 0;
      selectedObject = e.selected?.length === 1 ? e.selected[0] : undefined;
      editRevision++;
    });

    fabricCanvas.on("selection:cleared", (): void => {
      selectedObject = undefined;
      selectedCount = 0;
      editRevision++;
    });

    fabricCanvas.on("dragover", (e): void => {
      e.e.preventDefault();
    });

    fabricCanvas.on("drop:after", async (e): Promise<void> => {
      const dragEvt = e.e as DragEvent;
      dragEvt.preventDefault();

      let dropped = false;

      if (dragEvt.dataTransfer?.files) {
        for (const file of dragEvt.dataTransfer.files) {
          try {
            await LabelDesignerObjectHelper.addImageFile(fabricCanvas!, file);
            dropped = true;
          } catch (e) {
            Toasts.error(e);
          }
        }

        if (dropped) {
          undo.push(fabricCanvas!, labelProps);
        }
      }
    });

    fabricCanvas.on("object:scaling", (e): void => {
      if (!e.target) {
        return;
      }

      CanvasUtils.fixFabricObjectScale(e.target);
    });

    // userFonts.subscribe((e) => {console.log(e); renderOnFontsChanged();});

    if ($automation !== undefined) {
      if ($automation.startPrint !== undefined) {
        if ($automation.startPrint === "immediately") {
          openPreview();
        } else if ($automation.startPrint === "after_connect") {
          const unsubscribe = connectionState.subscribe((st) => {
            if (st === "connected") {
              tick().then(() => unsubscribe());
              openPreviewAndPrint();
            }
          });
        }
      }
    }
  });

  onDestroy(() => {
    fabricCanvas!.dispose();
    window.removeEventListener("hashchange", loadLabelFromUrl);
  });

  const saveDetectedLabelType = (labelType: LabelType) => {
    try {
      const saved = LocalStoragePersistence.loadSavedPreviewProps() ?? {};
      if (saved.labelType === labelType) return;
      LocalStoragePersistence.savePreviewProps({ ...saved, labelType });
    } catch (e) {
      console.warn(e);
    }
  };

  const announceRoll = (detected: { remaining?: number; roll: { widthMm: number; heightMm: number } }) => {
    let text = `${get(tr)("shell.roll_loaded")} ${formatMmValue(detected.roll.widthMm)} × ${formatMmValue(detected.roll.heightMm)} mm`;
    if (detected.remaining !== undefined) {
      text += ` · ${detected.remaining} ${get(tr)("shell.roll_left")}`;
    }
    Toasts.message(text, 7000);
  };

  $effect(() => {
    const canvas = fabricCanvas;
    const info = $rfidInfo;
    const connected = $connectionState === "connected";
    const direction = $printerMeta?.printDirection === "left" ? "left" : "top";
    if (!canvas || !connected) {
      appliedRollSignature = "";
      rollStatus = undefined;
      return;
    }

    const detected = detectLoadedRoll(info, direction);
    if (!detected) {
      appliedRollSignature = "";
      rollStatus = undefined;
      return;
    }

    if (!detected.roll) {
      if (appliedRollSignature !== detected.key) {
        appliedRollSignature = detected.key;
        rollStatus = "unknown";
        Toasts.message(get(tr)("shell.roll_unknown"), 12000);
      }
      return;
    }

    rollStatus = {
      widthMm: detected.roll.widthMm,
      heightMm: detected.roll.heightMm,
      tailMm: detected.roll.tailLengthMm,
      remaining: detected.remaining,
    };
    const signature = rollSignature(detected);
    if (signature === appliedRollSignature) return;
    appliedRollSignature = signature;

    const roll = detected.roll;
    const current = untrack(() => labelProps);
    const next = labelPropsFromRoll(roll);
    // Ink belongs to the cartridge, not the roll. A new roll does not keep the previous stock color.
    if (current.inkColor) next.inkColor = current.inkColor;
    if (!sameLabelGeometry(current, next) || (current.paperColor ?? "white") !== (next.paperColor ?? "white")) {
      onUpdateLabelProps(next);
    } else {
      rememberCurrentRoll(next);
    }
    if (roll.labelType !== undefined) saveDetectedLabelType(roll.labelType);
    announceRoll({ remaining: detected.remaining, roll });
  });

  $effect(() => {
    const turns = labelProps.quarterTurns;
    const canvas = fabricCanvas;
    if (!canvas) return;
    canvas.setLabelProps({ ...labelProps, quarterTurns: turns });
  });

  // A remembered cartridge color wins once the printer is connected.
  $effect(() => {
    const connected = $connectionState === "connected";
    const info = $rfidInfo;
    const beat = $heartbeatData;
    const canvas = fabricCanvas;
    if (!canvas || !connected) return;
    const snap = ribbonSnapshot(info, beat);
    if (snap.state !== "ready" || !snap.color) return;
    const current = untrack(() => labelProps);
    if (current.inkColor === snap.color) return;
    onUpdateLabelProps({ ...current, inkColor: snap.color });
  });

  $effect(() => {
    if (!previewOpened) {
      printNow = false;
    }
  });

  $effect(() => {
    if ($loadedFonts) {
      renderOnFontsChanged();
    }
  });
</script>

<svelte:window bind:innerWidth={windowWidth} onkeydown={onKeyDown} onpaste={onPaste} />

<div class="editor-shell">
  <header class="topbar">
    <div class="brand">
      <span class="niim">Niim</span><span class="blue">Blue{isStandalone ? "s" : ""}</span>
    </div>

    <button class="tool-btn" type="button" disabled={undoState.undoDisabled} onclick={() => undo.undo()} title={$tr("editor.undo")}>
      <MdIcon icon="undo" />
      <span>{$tr("shell.undo")}</span>
    </button>
    <button class="tool-btn" type="button" disabled={undoState.redoDisabled} onclick={() => undo.redo()} title={$tr("editor.redo")}>
      <MdIcon icon="redo" />
      <span>{$tr("shell.redo")}</span>
    </button>
    <button class="tool-btn" type="button" onclick={clearCanvas} title={$tr("editor.clear")}>
      <MdIcon icon="cancel_presentation" />
      <span>{$tr("shell.clear")}</span>
    </button>
    <button class="tool-btn" class:active={$appConfig.gridEnabled} type="button" onclick={toggleGrid} title={$tr("editor.grid")}>
      <MdIcon icon="grid_on" />
      <span>{$tr("editor.grid")}</span>
    </button>
    <button class="tool-btn" type="button" onclick={() => fabricCanvas?.resetVirtualZoom()} title={$tr("shell.zoom")}>
      <MdIcon icon="search" />
      <span>{zoomText}</span>
    </button>

    {#if fabricCanvas}
      <SavedLabelsMenu
        labeled
        canvas={fabricCanvas}
        onRequestLabelTemplate={exportCurrentLabel}
        {onLoadRequested}
        {csvEnabled} />
    {/if}
    <CsvControl labeled bind:enabled={csvEnabled} onPlaceholderPicked={onCsvPlaceholderPicked} />

    <div class="topbar-spacer"></div>

    <select class="form-select form-select-sm lang-select" bind:value={$locale} aria-label={$tr("shell.language")}>
      {#each Object.entries(locales).sort((a, b) => {
        const rank = (code: string) => (code === "en" ? 0 : code === "de" ? 1 : 2);
        return rank(a[0]) - rank(b[0]) || a[1].localeCompare(b[1]);
      }) as [key, name] (key)}
        <option value={key}>{name}</option>
      {/each}
    </select>

    <PrinterConnector />

    <button class="tool-btn" type="button" onclick={openPreview}>
      <MdIcon icon="visibility" />
      <span>{$tr("editor.preview")}</span>
    </button>
    <button
      class="tool-btn primary"
      type="button"
      onclick={openPreviewAndPrint}
      disabled={$connectionState !== "connected"}
      title={$tr("editor.print")}>
      <MdIcon icon="print" />
      <span>{$tr("editor.print")}</span>
    </button>
  </header>

  <div class="editor-body">
    <aside class="insert-rail">
      <InsertPalette
        {labelProps}
        onInsert={onObjectPicked}
        onTime={onTimePicked}
        iconOpen={iconPanelOpen}
        onToggleIcons={() => {
          iconPanelOpen = !iconPanelOpen;
          if (iconPanelOpen) framePanelOpen = false;
        }}
        frameOpen={framePanelOpen}
        onToggleFrames={() => {
          framePanelOpen = !framePanelOpen;
          if (framePanelOpen) iconPanelOpen = false;
        }}
        onIcon={onIconPicked}
        onSvgIcon={onSvgIconPicked}
        onClipart={onClipartPicked}
        onFrame={onFramePicked}
        {zplImageReady}
        {pdfImageReady}
        canvas={fabricCanvas}
        {layersRevision}
        {selectedObject} />
    </aside>

    <main class="canvas-stage">
      <div class="canvas-sheet print-start-{labelProps.printDirection}">
        <canvas bind:this={htmlCanvas}></canvas>
      </div>
    </main>

    <aside class="inspector">
      <InspectorPanel
        {labelProps}
        onUpdateLabelProps={onUpdateLabelProps}
        onRotate={rotateLabel}
        {selectedObject}
        {selectedCount}
        {editRevision}
        onDelete={deleteSelected}
        onClone={cloneSelected}
        onValueUpdated={controlValueUpdated} />
    </aside>
  </div>

  <footer class="status-bar">
    <span>
      {formatMm(labelProps.size.width)} × {formatMm(labelProps.size.height)} {$tr("params.label.mm")}
      {#if labelProps.size.width > labelProps.size.height}
        · {$tr("params.label.landscape")}
      {:else if labelProps.size.height > labelProps.size.width}
        · {$tr("params.label.portrait")}
      {/if}
    </span>
    <RibbonStatus compact />
    {#if rollStatus === "unknown"}
      <span>{$tr("shell.roll_unknown_short")}</span>
    {:else if rollStatus}
      <span>
        {$tr("shell.roll")} {formatMmValue(rollStatus.widthMm)} × {formatMmValue(rollStatus.heightMm)}
        {#if rollStatus.tailMm > 0}+ {formatMmValue(rollStatus.tailMm)}{/if}
        mm{#if rollStatus.remaining !== undefined}
          · {rollStatus.remaining} {$tr("shell.roll_left")}{/if}
      </span>
    {/if}
    <span>{shapeLabel(labelProps.shape)}</span>
    <span>
      {$tr("params.label.direction")}:
      {labelProps.printDirection === "top" ? $tr("params.label.direction.top") : $tr("params.label.direction.left")}
    </span>
    <span class="status-conn" class:on={$connectionState === "connected"}>
      {#if $connectionState === "connected"}
        {$tr("shell.connected")}{#if $printerMeta?.model} · {$printerMeta.model}{/if}{#if $printerMeta?.dpi} · {$printerMeta.dpi} dpi{/if}
      {:else if $connectionState === "connecting"}
        {$tr("shell.connecting")}
      {:else}
        {$tr("shell.disconnected")}
      {/if}
    </span>
    <span class="status-grow"></span>
    <button class="debug-link" type="button" onclick={() => (debugStuffShow = true)} title={$tr("debug.title")}>
      <MdIcon icon="bug_report" />
    </button>
  </footer>
</div>

{#if previewOpened}
  <PrintPreview
    bind:show={previewOpened}
    canvasCallback={getCanvasForPreview}
    {labelProps}
    {printNow}
    {csvEnabled}
    csvData={$csvData.data} />
{/if}

{#if debugStuffShow}
  <DebugStuff bind:show={debugStuffShow} />
{/if}
