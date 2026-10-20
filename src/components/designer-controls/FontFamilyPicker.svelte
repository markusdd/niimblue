<script lang="ts">
  import { onMount } from "svelte";
  import { OBJECT_DEFAULTS_TEXT } from "$/defaults";
  import { tr } from "$/utils/i18n";
  import { Toasts } from "$/utils/toasts";
  import MdIcon from "$/components/basic/MdIcon.svelte";
  import { LocalStoragePersistence } from "$/utils/persistence";
  import { fontCache } from "$/stores";
  import FontBrowser from "$/components/designer-controls/FontBrowser.svelte";
  import FontsMenu from "$/components/designer-controls/FontsMenu.svelte";

  import { normalizeFontFamilies } from "$/utils/font_names";
  import {
    automaticSystemFonts,
    canDiscoverSystemFonts,
    refreshSystemFonts,
    type SystemFonts,
  } from "$/utils/system_fonts";

  interface Props {
    editRevision?: number;
    value: string;
    sampleText?: string;
    valueUpdated: (v: string) => void;
  }

  let { value, valueUpdated, editRevision, sampleText = "" }: Props = $props();

  const fontQuerySupported = canDiscoverSystemFonts();
  let loading = $state(false);
  let showBrowser = $state(false);
  let browseButton: HTMLButtonElement;
  let discoveryFailed = $state(false);
  let box = $state<HTMLInputElement>();

  const applySystemFonts = (result: SystemFonts | undefined) => {
    if (!result) return;
    const families = normalizeFontFamilies([OBJECT_DEFAULTS_TEXT.fontFamily, ...result.families]);
    fontCache.set(families);
    try {
      LocalStoragePersistence.saveCachedFonts(families);
    } catch (error) {
      console.warn("Could not cache system fonts", error);
    }
  };

  const getSystemFonts = async () => {
    if (loading) return;
    loading = true;
    discoveryFailed = false;
    try {
      applySystemFonts(await refreshSystemFonts());
    } catch (error) {
      discoveryFailed = true;
      Toasts.error(error);
    } finally {
      loading = false;
    }
  };

  const fontClick = (family: string) => {
    if (box) box.value = family;
    valueUpdated(family);
  };

  // Leave the field alone while it is being typed in, so the caret stays put.
  // A picked font, another text object, or undo fills the name in otherwise.
  $effect(() => {
    const next = value;
    const el = box;
    if (!el || el === document.activeElement) return;
    if (el.value !== next) el.value = next;
  });

  onMount(() => {
    try {
      let stored = LocalStoragePersistence.loadCachedFonts();
      if (stored.length > 0) {
        const uniqueFonts = new Set([OBJECT_DEFAULTS_TEXT.fontFamily, ...stored]);
        fontCache.update(() => [...uniqueFonts].sort());
      }
    } catch (e) {
      console.warn("Could not restore cached fonts", e);
    }
    let mounted = true;
    loading = true;
    void automaticSystemFonts()
      .then(applySystemFonts)
      .catch((error) => {
        console.warn("Could not discover system fonts", error);
        if (mounted) discoveryFailed = true;
      })
      .finally(() => {
        if (mounted) loading = false;
      });
    return () => {
      mounted = false;
    };
  });
</script>

<div class="input-group flex-nowrap input-group-sm font-family-picker">
  <span class="input-group-text" title={$tr("params.text.font_family")}>
    <MdIcon icon="text_format" />
  </span>

  <input
    bind:this={box}
    type="text"
    class="form-control font-family-input"
    data-ver={editRevision}
    style:font-family={value}
    aria-label={$tr("params.text.font_family")}
    oninput={(e) => valueUpdated(e.currentTarget.value)} />

  <button
    bind:this={browseButton}
    class="btn btn-outline-secondary"
    type="button"
    title={$tr("fonts.choose")}
    aria-label={$tr("fonts.choose")}
    aria-haspopup="dialog"
    onclick={() => {
      showBrowser = true;
    }}>
    <MdIcon icon="font_download" />
  </button>

  <FontsMenu />
</div>

{#if showBrowser}
  <FontBrowser
    bind:show={showBrowser}
    {value}
    {sampleText}
    {loading}
    {discoveryFailed}
    {fontQuerySupported}
    refresh={getSystemFonts}
    choose={fontClick}
    onClose={() => browseButton?.focus()} />
{/if}

<style>
  .font-family-picker {
    width: 100%;
  }

  .font-family-input {
    width: auto;
    min-width: 0;
    flex: 1 1 auto;
  }
</style>
