<script lang="ts">
  import { tr, type TranslationKey } from "$/utils/i18n";
  import { iconMatches } from "$/utils/icon_search";
  import { BORDER_KINDS, borderKeywords, borderSvg, type BorderKind } from "$/utils/label_borders";
  import type { LabelShape } from "$/types";

  interface Props {
    onFrame: (kind: BorderKind) => void;
    labelShape?: LabelShape;
  }

  let { onFrame, labelShape = "rect" }: Props = $props();

  const frameKey: Record<BorderKind, TranslationKey> = {
    line: "editor.frames.line",
    double: "editor.frames.double",
    corners: "editor.frames.corners",
    dashed: "editor.frames.dashed",
    dotted: "editor.frames.dotted",
    banner: "editor.frames.banner",
    diamonds: "editor.frames.diamonds",
    scallop: "editor.frames.scallop",
    gallery: "editor.frames.gallery",
    deco: "editor.frames.deco",
    ticket: "editor.frames.ticket",
    bead: "editor.frames.bead",
    rope: "editor.frames.rope",
    vine: "editor.frames.vine",
    scroll: "editor.frames.scroll",
    stamp: "editor.frames.stamp",
  };

  let search = $state("");

  const svgUrl = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

  const frameSrc = (kind: BorderKind) => {
    const shape = labelShape ?? "rect";
    const wide = shape !== "circle";
    return svgUrl(borderSvg(kind, wide ? 228 : 180, wide ? 132 : 180, shape));
  };

  const hits = $derived(BORDER_KINDS.filter((kind) => iconMatches(search, kind, borderKeywords[kind])));
</script>

<div class="frame-picker">
  <input type="text" class="form-control form-control-sm mb-1" placeholder={$tr("editor.iconpicker.search")} bind:value={search} />
  <div class="icons">
    {#each hits as kind (kind)}
      <button type="button" class="frame" data-frame={kind} title={$tr(frameKey[kind])} onclick={() => onFrame(kind)}>
        <img alt="" src={frameSrc(kind)} />
      </button>
    {/each}
  </div>
  {#if search.trim() && hits.length === 0}
    <p class="empty">{$tr("editor.iconpicker.empty")}</p>
  {/if}
</div>

<style>
  .icons {
    display: flex;
    flex-wrap: wrap;
    align-content: flex-start;
    gap: 0.2rem;
    max-height: 320px;
    overflow-y: auto;
  }
  .frame {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 4.75rem;
    height: 2.75rem;
    padding: 0.1rem;
    border: 1px solid transparent;
    background: #f6f3ec;
    border-radius: 6px;
  }
  .frame:hover {
    background: #d5dee9;
  }
  .frame img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    pointer-events: none;
  }
  .empty {
    margin: 0.35rem 0 0;
    font-size: 0.72rem;
    color: #5c6b7a;
  }
</style>
