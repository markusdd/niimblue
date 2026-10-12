<script lang="ts">
  import type { LabelPreset } from "$/types";
  import { tr } from "$/utils/i18n";
  import MdIcon from "$/components/basic/MdIcon.svelte";

  interface Props {
    onItemSelected: (index: number) => void;
    onItemDelete: (index: number) => void;
    presets: LabelPreset[];
    class?: string;
  }

  let { class: className = "", onItemDelete, onItemSelected, presets }: Props = $props();
  let deleteIndex = $state<number>(-1);

  const fit = (preset: LabelPreset): { width: number; height: number } => {
    const presetWidth = Math.max(preset.width, 1);
    const presetHeight = Math.max(preset.height, 1);
    const max = Math.max(presetWidth, presetHeight);
    if (preset.shape === "circle") {
      const side = Math.round((Math.min(presetWidth, presetHeight) / max) * 100);
      return { width: side, height: side };
    }
    return {
      width: Math.round((presetWidth / max) * 100),
      height: Math.round((presetHeight / max) * 100),
    };
  };

  const caption = (preset: LabelPreset): string => {
    if (preset.title) {
      return preset.title;
    }
    const unit = preset.unit === "mm" ? $tr("params.label.mm") : preset.unit === "px" ? $tr("params.label.px") : "";
    return `${preset.width}×${preset.height}${unit}`;
  };

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
      <button type="button" class="preview" aria-label={caption(item)} onclick={() => onItemSelected(idx)}>
        <span
          class="paper print-start-{item.printDirection}"
          class:circle={item.shape === "circle"}
          class:rounded={item.shape === "rounded_rect"}
          style="width: {fit(item).width}%; height: {fit(item).height}%;">
        </span>
      </button>
      <div class="meta">
        {#if deleteIndex !== idx}
          <span class="name">{caption(item)}</span>
          {#if item.canvas}
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
    max-height: 240px;
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
    height: 58px;
    border: 0;
    border-radius: 6px;
    background: #efeae1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6px;
  }

  .paper {
    display: block;
    background: #fff;
    border: 1px solid rgba(40, 32, 22, 0.28);
    max-width: 100%;
    max-height: 100%;
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

  .meta {
    display: flex;
    align-items: center;
    gap: 0.15rem;
    min-width: 0;
  }

  .name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.72rem;
    line-height: 1.2;
    color: #241f1a;
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
