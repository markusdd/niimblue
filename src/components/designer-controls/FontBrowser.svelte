<script lang="ts">
  import { untrack } from "svelte";
  import AppModal from "$/components/basic/AppModal.svelte";
  import MdIcon from "$/components/basic/MdIcon.svelte";
  import { fontCache, userFonts } from "$/stores";
  import { tr } from "$/utils/i18n";
  import { normalizeFontFamilies } from "$/utils/font_names";

  interface Props {
    show: boolean;
    value: string;
    sampleText: string;
    loading: boolean;
    discoveryFailed: boolean;
    fontQuerySupported: boolean;
    refresh: () => void;
    choose: (family: string) => void;
    onClose: () => void;
  }
  let {
    show = $bindable(),
    value,
    sampleText,
    loading,
    discoveryFailed,
    fontQuerySupported,
    refresh,
    choose,
    onClose,
  }: Props = $props();
  const id = $props.id();
  let modal: AppModal;
  let search: HTMLInputElement;
  let list: HTMLDivElement;
  let query = $state("");
  let source = $state("all");
  let candidate = $state(untrack(() => value));
  let previewText = $state(untrack(() => sampleText.trim() || $tr("fonts.sample")));
  let previewSize = $state(40);
  let scrollTop = $state(0);
  let viewportHeight = $state(360);
  const rowHeight = 76;
  const imported = $derived(new Set($userFonts.map((font) => font.family)));
  const families = $derived(
    normalizeFontFamilies([
      ...(source !== "imported" ? $fontCache : []),
      ...(source !== "system" ? [...imported] : []),
    ]).filter((family) => family.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())),
  );
  // Keep the full scrollbar while mounting only the visible font previews.
  const start = $derived(
    Math.max(0, Math.min(Math.floor(scrollTop / rowHeight) - 3, Math.max(0, families.length - 1))),
  );
  const end = $derived(Math.min(families.length, start + Math.ceil(viewportHeight / rowHeight) + 6));
  const activeIndex = $derived(families.indexOf(candidate));
  const activeId = $derived(activeIndex >= start && activeIndex < end ? `${id}-font-${activeIndex}` : undefined);

  $effect(() => {
    void query;
    void source;
    if (list) list.scrollTop = 0;
    scrollTop = 0;
  });

  function navigate(event: KeyboardEvent) {
    const steps: Record<string, number> = { ArrowDown: 1, ArrowUp: -1, PageDown: 4, PageUp: -4 };
    let next: number;
    if (event.key === "Home") next = 0;
    else if (event.key === "End") next = families.length - 1;
    else if (event.key in steps) next = activeIndex < 0 ? 0 : activeIndex + steps[event.key];
    else if (event.key === "Enter") {
      event.preventDefault();
      apply();
      return;
    } else return;
    event.preventDefault();
    if (!families.length) return;
    next = Math.max(0, Math.min(families.length - 1, next));
    candidate = families[next];
    const top = next * rowHeight;
    if (top < list.scrollTop) list.scrollTop = top;
    else if (top + rowHeight > list.scrollTop + viewportHeight) list.scrollTop = top + rowHeight - viewportHeight;
    scrollTop = list.scrollTop;
  }

  function opened() {
    if (activeIndex > 0) {
      list.scrollTop = Math.max(0, (activeIndex - 2) * rowHeight);
      scrollTop = list.scrollTop;
    }
    search?.focus();
  }

  function apply() {
    if (!candidate) return;
    choose(candidate);
    modal.hide();
  }
</script>

<AppModal bind:show bind:this={modal} title={$tr("fonts.choose")} size="lg" {onClose} onShown={opened}>
  <div class="font-toolbar">
    <input
      bind:this={search}
      type="search"
      class="form-control"
      placeholder={$tr("params.text.font_family.search")}
      aria-label={$tr("params.text.font_family.search")}
      bind:value={query} />
    <select class="form-select" aria-label={$tr("fonts.source")} bind:value={source}>
      <option value="all">{$tr("fonts.all")}</option>
      <option value="system">{$tr("params.text.system_fonts")}</option>
      <option value="imported">{$tr("params.text.user_fonts")}</option>
    </select>
  </div>
  <div class="font-count small text-body-secondary my-2" role="status">
    {families.length}
    {$tr("fonts.matches")}
    {#if loading}
      · {$tr("params.text.fonts_loading")}{/if}
  </div>
  <div class="font-browser">
    <div
      class="font-list border rounded"
      role="listbox"
      aria-label={$tr("fonts.choose")}
      aria-activedescendant={activeId}
      tabindex="0"
      bind:this={list}
      bind:clientHeight={viewportHeight}
      onkeydown={navigate}
      onscroll={() => {
        scrollTop = list.scrollTop;
      }}>
      <div aria-hidden="true" style:height={`${start * rowHeight}px`}></div>
      {#each families.slice(start, end) as family, index (family)}
        <button
          id={`${id}-font-${start + index}`}
          type="button"
          role="option"
          aria-selected={family === candidate}
          aria-posinset={start + index + 1}
          aria-setsize={families.length}
          tabindex="-1"
          class="font-option"
          class:selected={family === candidate}
          onclick={() => {
            candidate = family;
            list.focus({ preventScroll: true });
          }}
          ondblclick={apply}>
          <span class="font-name">{family}</span>
          <span class="font-sample" style:font-family={JSON.stringify(family)}
            >{previewText || $tr("fonts.sample")}</span>
        </button>
      {/each}
      <div aria-hidden="true" style:height={`${(families.length - end) * rowHeight}px`}></div>
      {#if !families.length}<p class="p-3 text-body-secondary">{$tr("fonts.no_matches")}</p>{/if}
    </div>
    <div class="font-detail">
      <div class="fw-semibold text-break">{candidate}</div>
      <label class="small text-body-secondary" for={`${id}-sample`}>{$tr("fonts.preview_text")}</label>
      <textarea id={`${id}-sample`} class="form-control" rows="2" bind:value={previewText}></textarea>
      <div class="d-flex align-items-center gap-2">
        <label class="small text-nowrap" for={`${id}-size`}>{$tr("params.text.font_size")}</label>
        <input id={`${id}-size`} class="form-range" type="range" min="16" max="72" bind:value={previewSize} />
        <span class="small">{previewSize}</span>
      </div>
      <div
        class="large-preview border rounded"
        style:font-family={JSON.stringify(candidate)}
        style:font-size={`${previewSize}px`}>
        {previewText || $tr("fonts.sample")}
      </div>
    </div>
  </div>
  {#if discoveryFailed}<p class="small text-warning mt-2 mb-0" role="alert">{$tr("params.text.fonts_failed")}</p>{/if}
  {#if !fontQuerySupported}<p class="small text-body-secondary mt-2 mb-0">
      {$tr("params.text.fonts_unavailable")}
    </p>{/if}
  {#snippet footer()}
    {#if fontQuerySupported}
      <button
        class="btn btn-outline-secondary me-auto"
        type="button"
        disabled={loading}
        onclick={refresh}
        title={$tr("params.text.fetch_fonts")}
        aria-label={$tr("params.text.fetch_fonts")}><MdIcon icon="refresh" /></button>
    {/if}
    <button class="btn btn-secondary" type="button" data-bs-dismiss="modal">{$tr("fonts.cancel")}</button>
    <button class="btn btn-primary" type="button" disabled={!candidate} onclick={apply}>{$tr("fonts.use")}</button>
  {/snippet}
</AppModal>

<style>
  .font-toolbar {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 0.75rem;
  }
  .font-toolbar select {
    width: auto;
    max-width: 13rem;
  }
  .font-browser {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 1rem;
  }
  .font-list {
    height: 360px;
    overflow-y: auto;
    overflow-anchor: none;
  }
  .font-option {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 4px;
    width: 100%;
    height: 76px;
    padding: 8px 12px;
    text-align: start;
    border: 0;
    border-bottom: 1px solid var(--bs-border-color);
    background: var(--bs-body-bg);
    color: var(--bs-body-color);
  }
  .font-option:hover {
    background: var(--bs-tertiary-bg);
  }
  .font-option.selected {
    background: var(--bs-primary-bg-subtle);
    box-shadow: inset 3px 0 var(--bs-primary);
  }
  .font-name {
    font: 12px var(--bs-body-font-family);
  }
  .font-name,
  .font-sample {
    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .font-sample {
    font-size: 24px;
    line-height: 32px;
  }
  .font-detail {
    height: 360px;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    min-width: 0;
  }
  .large-preview {
    flex: 1;
    min-height: 0;
    padding: 16px;
    overflow: auto;
    overflow-wrap: anywhere;
    white-space: pre-wrap;
    line-height: 1.3;
  }
  @media (max-width: 575px) {
    .font-toolbar {
      grid-template-columns: minmax(0, 1fr);
    }
    .font-toolbar select {
      width: 100%;
      max-width: none;
    }
    .font-browser {
      grid-template-columns: minmax(0, 1fr);
    }
    .font-list {
      height: 228px;
    }
    .font-detail {
      height: auto;
    }
    .large-preview {
      min-height: 100px;
      max-height: 160px;
    }
  }
</style>
