<script lang="ts">
  import { tr, type TranslationKey } from "$/utils/i18n";
  import { iconMatches } from "$/utils/icon_search";
  import { BORDER_KINDS, borderKeywords, borderSvg, type BorderKind } from "$/utils/label_borders";
  import { ART_DECO_FRAME_KINDS } from "$/utils/art_deco_frames";
  import { VINTAGE_FRAME_KINDS } from "$/utils/vintage_frames";
  import type { LabelShape } from "$/types";

  interface Props {
    onFrame: (kind: BorderKind) => void;
    labelShape?: LabelShape;
  }

  let { onFrame, labelShape = "rect" }: Props = $props();

  const frameKey: Record<BorderKind, TranslationKey> = {
    "deco-quadrant": "editor.frames.deco-quadrant",
    "deco-orbit": "editor.frames.deco-orbit",
    "deco-scalloped": "editor.frames.deco-scalloped",
    "deco-portal": "editor.frames.deco-portal",
    "deco-hexagon": "editor.frames.deco-hexagon",
    "deco-ziggurat": "editor.frames.deco-ziggurat",
    "deco-bowtie": "editor.frames.deco-bowtie",
    "deco-fluted": "editor.frames.deco-fluted",
    "deco-mitre": "editor.frames.deco-mitre",
    "deco-terminals": "editor.frames.deco-terminals",
    "deco-diamonds": "editor.frames.deco-diamonds",
    "deco-fan": "editor.frames.deco-fan",
    "deco-marquee": "editor.frames.deco-marquee",
    "deco-linked": "editor.frames.deco-linked",
    "deco-spire": "editor.frames.deco-spire",
    "deco-arcade": "editor.frames.deco-arcade",
    cartouche: "editor.frames.cartouche",
    baroque: "editor.frames.baroque",
    cameo: "editor.frames.cameo",
    rococo: "editor.frames.rococo",
    "ribbon-plaque": "editor.frames.ribbon-plaque",
    "scroll-plaque": "editor.frames.scroll-plaque",
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
    engraved: "editor.frames.engraved",
    laurel: "editor.frames.laurel",
    meadow: "editor.frames.meadow",
    nouveau: "editor.frames.nouveau",
    celestial: "editor.frames.celestial",
    circuit: "editor.frames.circuit",
    schematic: "editor.frames.schematic",
    "botanical-corners": "editor.frames.botanical-corners",
    herbarium: "editor.frames.herbarium",
    "botanical-wreath": "editor.frames.botanical-wreath",
  };

  let search = $state("");
  let collection = $state("all");
  const botanical: readonly string[] = [
    "vine",
    "laurel",
    "meadow",
    "nouveau",
    "botanical-corners",
    "herbarium",
    "botanical-wreath",
  ];
  const vintage: readonly string[] = [...VINTAGE_FRAME_KINDS, "scroll", "engraved", "ticket"];
  const deco: readonly string[] = [...ART_DECO_FRAME_KINDS, "deco"];
  const inCollection = (kind: BorderKind) =>
    collection === "all" ||
    (collection === "artdeco"
      ? deco.includes(kind)
      : collection === "botanical"
        ? botanical.includes(kind)
        : collection === "vintage"
          ? vintage.includes(kind)
          : kind === "circuit" || kind === "schematic");

  const svgUrl = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

  const frameSrc = (kind: BorderKind) => {
    const shape = labelShape ?? "rect";
    const wide = shape !== "circle";
    return svgUrl(borderSvg(kind, wide ? 228 : 180, wide ? 132 : 180, shape));
  };

  const hits = $derived(
    BORDER_KINDS.filter((kind) => inCollection(kind) && iconMatches(search, kind, borderKeywords[kind])),
  );
</script>

<div class="frame-picker">
  <select class="form-select form-select-sm mb-1" bind:value={collection} aria-label={$tr("editor.frames.collection")}>
    <option value="all">{$tr("editor.frames.all")}</option>
    <option value="artdeco">{$tr("designs.artdeco")}</option>
    <option value="vintage">{$tr("designs.vintage")}</option>
    <option value="botanical">{$tr("designs.botanical")}</option>
    <option value="technical">{$tr("editor.frames.technical")}</option>
  </select>
  <input
    type="text"
    class="form-control form-control-sm mb-1"
    placeholder={$tr("editor.iconpicker.search")}
    bind:value={search} />
  <div class="icons">
    {#each hits as kind (kind)}
      <button type="button" class="frame" data-frame={kind} title={$tr(frameKey[kind])} onclick={() => onFrame(kind)}>
        <img alt="" src={frameSrc(kind)} />
      </button>
    {/each}
  </div>
  {#if hits.length === 0}
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
    background: var(--nb-surface);
    border-radius: 6px;
  }
  .frame:hover {
    background: var(--nb-accent-soft);
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
    color: var(--nb-text-muted);
  }
</style>
