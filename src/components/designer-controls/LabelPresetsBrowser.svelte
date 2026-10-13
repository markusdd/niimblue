<script lang="ts">
  import type { LabelPreset } from "$/types";
  import { tr } from "$/utils/i18n";
  import { formatMmValue } from "$/utils/label_units";
  import { paperSwatch } from "$/utils/label_colors";
  import MdIcon from "$/components/basic/MdIcon.svelte";

  interface Props {
    onItemSelected: (index: number) => void;
    onItemDelete: (index: number) => void;
    presets: LabelPreset[];
    class?: string;
  }

  let { class: className = "", onItemDelete, onItemSelected, presets }: Props = $props();
  let deleteIndex = $state<number>(-1);

  /** Label aspect, so the card can contain the picture instead of stretching it. */
  const aspect = (preset: LabelPreset): { pw: number; ph: number } => ({
    pw: Math.max(preset.width, 0.01),
    ph: Math.max(preset.height, 0.01),
  });

  const sizeText = (preset: LabelPreset): string => {
    const unit = preset.unit === "px" ? $tr("params.label.px") : $tr("params.label.mm");
    const width = preset.unit === "px" ? String(preset.width) : formatMmValue(preset.width);
    const height = preset.unit === "px" ? String(preset.height) : formatMmValue(preset.height);
    return `${width}×${height} ${unit}`;
  };

  const caption = (preset: LabelPreset): string => preset.title?.trim() || sizeText(preset);

  const deleteConfirmed = (e: MouseEvent, idx: number) => {
    e.stopPropagation();
    deleteIndex = -1;
    onItemDelete(idx);
  };

  const deleteRejected = (e: MouseEvent) => {
    e.stopPropagation();
    deleteIndex = -1;
  };

  const deleteRequested = (e: MouseEvent, idx: number) => {
    e.stopPropagation();
    deleteIndex = idx;
  };
</script>

<div class="preset-browser {className}">
  {#each presets as item, idx (item)}
    <div class="preset">
      <button
        type="button"
        class="preview"
        aria-label={item.title?.trim() ? `${caption(item)}, ${sizeText(item)}` : caption(item)}
        onclick={() => onItemSelected(idx)}>
        <span class="frame">
          <span
            class="paper print-start-{item.printDirection}"
            class:circle={item.shape === "circle"}
            class:rounded={item.shape === "rounded_rect"}
            class:has-thumb={!!item.thumbnail}
            style="--pw: {aspect(item).pw}; --ph: {aspect(item).ph}; background: {paperSwatch[item.paperColor ?? 'white']};">
            {#if item.thumbnail}
              <img src={item.thumbnail} alt="" />
            {/if}
          </span>
        </span>
      </button>
      <div class="meta">
        {#if deleteIndex !== idx}
          <div class="copy">
            <span class="name">{caption(item)}</span>
            {#if item.title?.trim()}
              <span class="size">{sizeText(item)}</span>
            {/if}
          </div>
          {#if item.canvas && !item.thumbnail}
            <span class="count" title={caption(item)}>{item.canvas.objects.length}</span>
          {/if}
          <button
            type="button"
            class="icon-btn"
            title={$tr("editor.delete")}
            onclick={(e) => deleteRequested(e, idx)}>
            <MdIcon icon="delete" />
          </button>
        {:else}
          <span class="name">{$tr("editor.delete")}?</span>
          <button type="button" class="icon-btn confirm" title={$tr("editor.delete")} onclick={(e) => deleteConfirmed(e, idx)}>
            <MdIcon icon="delete" />
          </button>
          <button type="button" class="icon-btn" title={$tr("preview.close")} onclick={deleteRejected}>
            <MdIcon icon="close" />
          </button>
        {/if}
      </div>
    </div>
  {/each}
</div>

<style>
  .preset-browser {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    max-height: 320px;
    max-width: 100%;
    overflow: auto;
    padding: 0.15rem;
  }

  .preset {
    width: calc(50% - 0.2rem);
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.35rem;
    background: #fff;
    border: 1px solid #e0d9cc;
    border-radius: 8px;
  }

  .preview {
    display: block;
    width: 100%;
    height: 76px;
    margin: 0;
    padding: 0;
    border: 0;
    border-radius: 6px;
    background: transparent;
    line-height: 0;
  }

  /* Buttons do not clip their contents, so the picture lives in this box. */
  .frame {
    container-type: size;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    padding: 6px;
    overflow: hidden;
    border-radius: 6px;
    background: #efeae1;
  }

  .paper {
    box-sizing: border-box;
    display: block;
    flex: 0 0 auto;
    position: relative;
    width: min(100cqw, calc(100cqh * var(--pw) / var(--ph)));
    aspect-ratio: var(--pw) / var(--ph);
    height: auto;
    min-width: 0;
    min-height: 0;
    background: #fff;
    border: 1px solid rgba(40, 32, 22, 0.28);
    overflow: hidden;
  }

  .paper img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
    object-fit: fill;
    pointer-events: none;
  }

  .paper.rounded {
    border-radius: 18%;
  }

  .paper.circle {
    border-radius: 50%;
  }

  .paper.print-start-left {
    box-shadow: inset 3px 0 0 #c4554a;
  }

  .paper.print-start-top {
    box-shadow: inset 0 3px 0 #c4554a;
  }

  /* The picture already includes the paper edge and the feed mark. */
  .paper.has-thumb {
    border: 0;
    box-shadow: none;
  }

  .meta {
    display: flex;
    align-items: center;
    gap: 0.15rem;
    min-width: 0;
  }

  .copy {
    flex: 1;
    min-width: 0;
  }

  .name {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.72rem;
    line-height: 1.2;
    color: #241f1a;
  }

  .size {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #6d655b;
    font-size: 0.68rem;
    line-height: 1.2;
  }

  .count {
    flex: 0 0 auto;
    min-width: 1.15rem;
    padding: 0 0.28rem;
    border-radius: 99px;
    background: #d5dee9;
    color: #1c2836;
    font-size: 0.68rem;
    line-height: 1.35;
    text-align: center;
  }

  .icon-btn {
    flex: 0 0 auto;
    border: 0;
    background: transparent;
    color: #6d655b;
    font-size: 0.72rem;
    line-height: 1;
    padding: 0;
  }

  .icon-btn.confirm {
    color: #8d2b24;
  }
</style>
