<script lang="ts">
  import * as fabric from "fabric";
  import { tr } from "$/utils/i18n";
  import MdIcon from "$/components/basic/MdIcon.svelte";
  import FontFamilyPicker from "$/components/designer-controls/FontFamilyPicker.svelte";
  import { TextboxExt } from "$/fabric-object/textbox-ext";

  interface Props {
    selectedText: fabric.IText;
    editRevision: number;
    valueUpdated: () => void;
  }

  let { selectedText, editRevision, valueUpdated }: Props = $props();

  let sizeMin: number = 1;
  let sizeMax: number = 999;

  const setXAlign = (align: fabric.TOriginX) => {
    selectedText.set({ textAlign: align });
    valueUpdated();
  };

  const setYAlign = (align: fabric.TOriginY) => {
    // change object origin, but keep position
    const pos = selectedText.getPointByOrigin("left", "top");
    selectedText.set({ originY: align });
    selectedText.setPositionByOrigin(pos, "left", "top");
    valueUpdated();
  };

  const toggleBold = () => {
    if (selectedText.fontWeight === "bold") {
      selectedText.fontWeight = "normal";
    } else {
      selectedText.fontWeight = "bold";
    }
    valueUpdated();
  };

  const toggleItalic = () => {
    if (selectedText.fontStyle === "italic") {
      selectedText.fontStyle = "normal";
    } else {
      selectedText.fontStyle = "italic";
    }
    valueUpdated();
  };

  const toggleFontAutoSize = () => {
    if (selectedText instanceof TextboxExt) {
      selectedText.set({ fontAutoSize: !selectedText.fontAutoSize });
    }
    valueUpdated();
  };

  const updateFontFamily = (v: string) => {
    selectedText.set({ fontFamily: v });
    valueUpdated();
  };

  // Fabric writes fontFamily onto the object. The revision is what tells the
  // field to read that name again.
  const shownFontFamily = $derived.by(() => {
    void editRevision;
    return selectedText.fontFamily ?? "";
  });

  const fontSizeUp = () => {
    let s = selectedText.fontSize;
    selectedText.set({ fontSize: Math.min(s > 40 ? Math.round(s * 1.1) : s + 2, sizeMax) });
    valueUpdated();
  };

  const fontSizeDown = () => {
    let s = selectedText.fontSize;
    selectedText.set({ fontSize: Math.max(s > 40 ? Math.round(s * 0.9) : s - 2, sizeMin) });
    valueUpdated();
  };

  const lineHeightChange = (v: number) => {
    v = isNaN(v) ? 1 : v;
    selectedText.set({ lineHeight: v });
    valueUpdated();
  };

  const fontSizeChange = (v: number) => {
    v = isNaN(v) ? 1 : Math.min(Math.max(v, sizeMin), sizeMax);
    selectedText.set({ fontSize: v });
    valueUpdated();
  };

  const fillChanged = (value: string) => {
    selectedText.set({ fill: value });
    valueUpdated();
  };

  const splitChanged = (value: string) => {
    if (selectedText instanceof fabric.Textbox) {
      selectedText.set({ splitByGrapheme: value === "grapheme" });
      valueUpdated();
    }
  };

  const backgroundColorChanged = (value: string) => {
    selectedText.set({ backgroundColor: value });
    valueUpdated();
  };

  const editInPopup = () => {
    const text = prompt($tr("params.text.edit.title"), selectedText.text);
    if (text !== null) {
      selectedText.set({ text });
      selectedText.isEditing = false;
      valueUpdated();
    }
  };


</script>

<!-- Fix component not updating when selectedText changes. I didn't find a better way to do this. -->
<input type="hidden" value={editRevision}>

<div class="field">
  <span class="field-label">{$tr("shell.align")}</span>
  <div class="choice-row">
    <button
      type="button"
      title={$tr("params.text.align.left")}
      class="btn btn-sm btn-outline-secondary"
      class:active={selectedText.textAlign === "left"}
      onclick={() => setXAlign("left")}>
      <MdIcon icon="format_align_left" />
      {$tr("shell.align.left")}
    </button>
    <button
      type="button"
      title={$tr("params.text.align.center")}
      class="btn btn-sm btn-outline-secondary"
      class:active={selectedText.textAlign === "center"}
      onclick={() => setXAlign("center")}>
      <MdIcon icon="format_align_center" />
      {$tr("shell.align.center")}
    </button>
    <button
      type="button"
      title={$tr("params.text.align.right")}
      class="btn btn-sm btn-outline-secondary"
      class:active={selectedText.textAlign === "right"}
      onclick={() => setXAlign("right")}>
      <MdIcon icon="format_align_right" />
      {$tr("shell.align.right")}
    </button>
  </div>
</div>

<div class="field">
  <span class="field-label">{$tr("params.text.vorigin")}</span>
  <div class="choice-row">
    <button
      type="button"
      class="btn btn-sm btn-outline-secondary"
      class:active={selectedText.originY === "top"}
      onclick={() => setYAlign("top")}>
      {$tr("params.text.vorigin.top")}
    </button>
    <button
      type="button"
      class="btn btn-sm btn-outline-secondary"
      class:active={selectedText.originY === "center"}
      onclick={() => setYAlign("center")}>
      {$tr("params.text.vorigin.center")}
    </button>
    <button
      type="button"
      class="btn btn-sm btn-outline-secondary"
      class:active={selectedText.originY === "bottom"}
      onclick={() => setYAlign("bottom")}>
      {$tr("params.text.vorigin.bottom")}
    </button>
  </div>
</div>

<div class="field">
  <span class="field-label">{$tr("params.text.bold")}</span>
  <div class="choice-row">
    <button
      type="button"
      class="btn btn-sm btn-outline-secondary"
      class:active={selectedText.fontWeight === "bold"}
      onclick={toggleBold}>
      {$tr("params.text.bold")}
    </button>
    <button
      type="button"
      class="btn btn-sm btn-outline-secondary"
      class:active={selectedText.fontStyle === "italic"}
      onclick={toggleItalic}>
      {$tr("params.text.italic")}
    </button>
    {#if selectedText instanceof TextboxExt}
      <button
        type="button"
        class="btn btn-sm btn-outline-secondary"
        class:active={selectedText.fontAutoSize}
        data-ver={editRevision}
        onclick={toggleFontAutoSize}>
        {$tr("params.text.autosize")}
      </button>
    {/if}
  </div>
</div>

<div class="field">
  <label class="field-label" for="text-font-size">{$tr("params.text.font_size")}</label>
  <div class="input-group input-group-sm">
    <input
      id="text-font-size"
      type="number"
      min={sizeMin}
      max={sizeMax}
      step="2"
      class="form-control"
      value={selectedText.fontSize}
      oninput={(e) => fontSizeChange(e.currentTarget.valueAsNumber)} />
    <button class="btn btn-outline-secondary" type="button" title={$tr("params.text.font_size.up")} onclick={fontSizeUp}>
      <MdIcon icon="text_increase" />
    </button>
    <button class="btn btn-outline-secondary" type="button" title={$tr("params.text.font_size.down")} onclick={fontSizeDown}>
      <MdIcon icon="text_decrease" />
    </button>
  </div>
</div>

<div class="field">
  <label class="field-label" for="text-line-height">{$tr("params.text.line_height")}</label>
  <input
    id="text-line-height"
    type="number"
    min="0.1"
    step="0.1"
    max="10"
    class="form-control form-control-sm"
    value={selectedText.lineHeight}
    oninput={(e) => lineHeightChange(e.currentTarget.valueAsNumber)} />
</div>

<div class="field">
  <span class="field-label">{$tr("params.text.font_family")}</span>
  <FontFamilyPicker sampleText={selectedText.text} {editRevision} value={shownFontFamily} valueUpdated={updateFontFamily} />
</div>

<div class="field">
  <label class="field-label" for="text-fill">{$tr("shell.text.color")}</label>
  <select id="text-fill" class="form-select form-select-sm" value={selectedText.fill} onchange={(e) => fillChanged(e.currentTarget.value)}>
    <option value="white">{$tr("params.color.white")}</option>
    <option value="black">{$tr("params.color.black")}</option>
    <option value="red">{$tr("params.color.red")}</option>
  </select>
</div>

<div class="field">
  <label class="field-label" for="text-background">{$tr("shell.text.background")}</label>
  <select
    id="text-background"
    class="form-select form-select-sm"
    value={selectedText.backgroundColor || "transparent"}
    onchange={(e) => backgroundColorChanged(e.currentTarget.value)}>
    <option value="white">{$tr("params.color.white")}</option>
    <option value="black">{$tr("params.color.black")}</option>
    <option value="red">{$tr("params.color.red")}</option>
    <option value="transparent">{$tr("params.color.transparent")}</option>
  </select>
</div>

{#if selectedText instanceof fabric.Textbox}
  <div class="field">
    <label class="field-label" for="text-split">{$tr("params.params.text.split")}</label>
    <select
      id="text-split"
      class="form-select form-select-sm"
      value={selectedText.splitByGrapheme ? "grapheme" : "space"}
      onchange={(e) => splitChanged(e.currentTarget.value)}>
      <option value="space">{$tr("params.params.text.split.spaces")}</option>
      <option value="grapheme">{$tr("params.params.text.split.grapheme")}</option>
    </select>
  </div>
{/if}

<button class="btn btn-sm btn-outline-secondary align-self-start" type="button" onclick={editInPopup}>
  <MdIcon icon="edit" />
  {$tr("params.text.edit")}
</button>
