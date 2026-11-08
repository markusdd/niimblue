<script lang="ts">
  import { onMount } from "svelte";
  import AppModal from "$/components/basic/AppModal.svelte";
  import { locale, tr } from "$/utils/i18n";
  import type { ExportedLabelTemplate, LabelProps } from "$/types";
  import {
    DESIGN_TEMPLATES,
    DESIGN_FORMATS,
    currentDesignFormat,
    designScene,
    type DesignId,
    type DesignFormat,
    type DesignLanguage,
  } from "$/data/design_templates";
  import { loadDesignSceneFonts } from "$/utils/design_typography";
  import { designPreviewSvg } from "$/utils/design_template_preview";
  import { createDesignTemplate } from "$/utils/design_template_factory";
  import { formatMmValue } from "$/utils/label_units";
  import { Toasts } from "$/utils/toasts";

  interface Props {
    show: boolean;
    onClose: () => void;
    labelProps: LabelProps;
    hasObjects: boolean;
    onApply: (template: ExportedLabelTemplate) => Promise<void>;
  }
  let { show = $bindable(), onClose, labelProps, hasObjects, onApply }: Props = $props();
  let modal = $state<AppModal>();
  let selection = $state<DesignId>("pantry");
  type Collection = (typeof DESIGN_TEMPLATES)[number]["collection"];
  const collections = [
    { id: "botanical", key: "designs.botanical" },
    { id: "vintage", key: "designs.vintage" },
    { id: "artdeco", key: "designs.artdeco" },
  ] as const;
  let collection = $state<Collection>("botanical");
  const designs = $derived(DESIGN_TEMPLATES.filter((item) => item.collection === collection));
  const selectCollection = (next: Collection) => {
    collection = next;
    selection = DESIGN_TEMPLATES.find((item) => item.collection === next)!.id;
  };
  let formatId = $state("landscape");
  let ready = $state(false);
  let applying = $state(false);
  let language = $state<DesignLanguage>("en");
  const current = $derived(currentDesignFormat(labelProps));
  const formats = $derived(current ? [current, ...DESIGN_FORMATS] : DESIGN_FORMATS);
  const format = $derived(formats.find((item) => item.id === formatId) ?? DESIGN_FORMATS[0]);
  const selected = $derived(DESIGN_TEMPLATES.find((item) => item.id === selection)!);
  const previews = $derived(
    ready
      ? designs.map((item) => ({ ...item, preview: designPreviewSvg(designScene(item.id, format, language)) }))
      : [],
  );
  const dimension = (item: DesignFormat) =>
    `${item.shape === "circle" ? "Ø " : ""}${formatMmValue(item.width)}${item.shape === "circle" ? "" : ` × ${formatMmValue(item.height)}`} mm`;

  onMount(() => {
    language = $locale.toLowerCase().startsWith("de") ? "de" : "en";
    formatId = current ? "current" : "landscape";
  });
  $effect(() => {
    const scenes = designs.map((item) => designScene(item.id, format, language));
    let active = true;
    ready = false;
    void Promise.all(scenes.map(loadDesignSceneFonts))
      .then(() => {
        if (active) ready = true;
      })
      .catch((error) => {
        if (active) Toasts.error(error);
      });
    return () => {
      active = false;
    };
  });
  const apply = async () => {
    if (applying || !ready) return;
    applying = true;
    try {
      const template = await createDesignTemplate(selection, format, language);
      await onApply(template);
      modal?.hide();
    } catch (error) {
      Toasts.error(error);
    } finally {
      applying = false;
    }
  };
</script>

{#if show}
  <AppModal bind:show bind:this={modal} title={$tr("designs.title")} size="lg" {onClose}>
    <p class="small text-body-secondary mb-3">{$tr("designs.intro")}</p>
    <div class="collection-tabs mb-3" role="group" aria-label={$tr("designs.collections")}>
      {#each collections as item (item.id)}
        <button
          type="button"
          class="btn btn-sm"
          class:active={collection === item.id}
          aria-pressed={collection === item.id}
          disabled={applying}
          onclick={() => selectCollection(item.id)}>{$tr(item.key)}</button>
      {/each}
    </div>
    <div class="design-controls">
      <label class="small">
        {$tr("designs.format")}
        <select class="form-select form-select-sm mt-1" bind:value={formatId} disabled={applying}>
          {#each formats as item (item.id)}
            <option value={item.id}
              >{item.id === "current" ? `${$tr("designs.current")} · ` : ""}{dimension(item)}</option>
          {/each}
        </select>
      </label>
      <label class="small">
        {$tr("designs.language")}
        <select class="form-select form-select-sm mt-1" bind:value={language} disabled={applying}>
          <option value="de">Deutsch</option><option value="en">English</option>
        </select>
      </label>
    </div>
    {#if !ready}<p role="status" class="small text-body-secondary mt-3">{$tr("designs.loading")}</p>{/if}
    <div class="design-grid" role="group" aria-label={$tr(collections.find((item) => item.id === collection)!.key)}>
      {#each previews as item (item.id)}
        <button
          class="design-card"
          class:selected={selection === item.id}
          type="button"
          aria-pressed={selection === item.id}
          disabled={applying}
          onclick={() => {
            selection = item.id;
          }}>
          <span class="design-preview">
            <!-- eslint-disable-next-line svelte/no-at-html-tags -->
            {@html item.preview}
          </span>
          <span class="design-name">{item[language]}</span>
        </button>
      {/each}
    </div>
    <p class="small text-body-secondary mb-0 mt-3">{$tr("designs.editable")}</p>
    {#if hasObjects}<p class="small text-body-secondary mt-2 mb-0">{$tr("designs.replaces")}</p>{/if}
    {#snippet footer()}
      <span class="small text-body-secondary me-auto">{selected[language]} · {dimension(format)}</span>
      <button class="btn btn-secondary" type="button" disabled={applying} data-bs-dismiss="modal"
        >{$tr("preview.close")}</button>
      <button class="btn btn-primary" type="button" disabled={!ready || applying} onclick={apply}>
        {$tr(applying ? "designs.loading" : "designs.use")}
      </button>
    {/snippet}
  </AppModal>
{/if}

<style>
  .collection-tabs {
    display: flex;
    gap: 0.35rem;
    padding: 0.3rem;
    background: var(--nb-hover);
    border-radius: 8px;
  }
  .collection-tabs .btn {
    flex: 1;
    color: var(--nb-text-secondary);
  }
  .collection-tabs .btn.active {
    background: var(--nb-surface);
    color: var(--nb-accent-text);
    box-shadow: 0 1px 3px rgb(15 23 42 / 10%);
  }
  .design-controls {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
  .design-grid {
    max-height: min(52vh, 36rem);
    overflow-y: auto;
    padding: 0.15rem;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.75rem;
    margin-top: 1rem;
  }
  .design-card {
    padding: 0.45rem;
    border: 1px solid var(--nb-border);
    border-radius: 10px;
    background: var(--nb-surface);
    color: var(--nb-text);
  }
  .design-card:hover {
    border-color: var(--nb-accent);
  }
  .design-card.selected {
    border-color: var(--nb-accent);
    box-shadow: 0 0 0 1px var(--nb-accent);
    background: var(--nb-accent-soft);
  }
  .design-card:focus-visible {
    outline: 2px solid var(--nb-accent);
    outline-offset: 3px;
  }
  .design-preview {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 150px;
    padding: 0.55rem;
    background: var(--nb-hover);
    border-radius: 6px;
  }
  .design-preview :global(svg) {
    display: block;
    width: 100%;
    height: 100%;
    max-width: 100%;
    max-height: 100%;
    filter: drop-shadow(0 2px 3px rgb(15 23 42 / 10%));
  }
  .design-name {
    display: block;
    margin-top: 0.4rem;
    font-size: 0.78rem;
    line-height: 1.35;
  }
  @media (max-width: 575px) {
    .design-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .design-preview {
      height: 120px;
    }
    .design-controls {
      gap: 0.5rem;
    }
  }
</style>
