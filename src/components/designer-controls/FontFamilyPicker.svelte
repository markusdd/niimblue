<script lang="ts">
  import { onMount } from "svelte";
  import { OBJECT_DEFAULTS_TEXT } from "$/defaults";
  import { tr } from "$/utils/i18n";
  import { Toasts } from "$/utils/toasts";
  import MdIcon from "$/components/basic/MdIcon.svelte";
  import { LocalStoragePersistence } from "$/utils/persistence";
  import { fontCache, userFonts } from "$/stores";
  import FontsMenu from "$/components/designer-controls/FontsMenu.svelte";

  interface Props {
    editRevision?: number;
    value: string;
    valueUpdated: (v: string) => void;
  }

  let { value, valueUpdated, editRevision }: Props = $props();

  let fontQuerySupported = typeof queryLocalFonts !== "undefined";
  let searchString = $state<string>("");
  let box = $state<HTMLInputElement>();

  let systemFontsFiltered = $derived.by<string[]>(() => {
    return $fontCache.filter((e) => e.toLowerCase().includes(searchString.toLowerCase()));
  });

  let userFontsFiltered = $derived.by<string[]>(() => {
    return $userFonts.map((e) => e.family).filter((e) => e.toLowerCase().includes(searchString.toLowerCase()));
  });

  const getSystemFonts = async () => {
    try {
      const fonts = await queryLocalFonts();
      const fontListSorted = [OBJECT_DEFAULTS_TEXT.fontFamily, ...new Set(fonts.map((f: FontData) => f.family))].sort();
      fontCache.update(() => fontListSorted);
      LocalStoragePersistence.saveCachedFonts(fontListSorted);
    } catch (e) {
      Toasts.error(e);
    }
  };

  const fontClick = (family: string) => {
    searchString = "";
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
      Toasts.error(e);
    }
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

  <!-- svelte-ignore a11y_consider_explicit_label -->
  <button
    class="btn btn-outline-secondary dropdown-toggle"
    type="button"
    data-bs-toggle="dropdown"
    data-bs-popper-config={'{"strategy":"fixed"}'}></button>

  <div class="dropdown-menu">
    <div class="px-3 py-1">
      <input
        type="text"
        class="form-control form-control-sm"
        placeholder={$tr("params.text.font_family.search")}
        bind:value={searchString} />
    </div>

    {#if userFontsFiltered.length > 0}
      <h6 class="dropdown-header">{$tr("params.text.user_fonts")}</h6>
      {#each userFontsFiltered as family (family)}
        <button class="dropdown-item" style="font-family: {family}" type="button" onclick={() => fontClick(family)}>
          {family}
        </button>
      {/each}
    {/if}

    {#if systemFontsFiltered.length > 0}
      <h6 class="dropdown-header">{$tr("params.text.system_fonts")}</h6>
      {#each systemFontsFiltered as family (family)}
        <button class="dropdown-item" style="font-family: {family}" type="button" onclick={() => fontClick(family)}>
          {family}
        </button>
      {/each}
    {/if}

    {#if fontQuerySupported}
      <div class="dropdown-divider"></div>
      <button class="dropdown-item load-system-fonts" type="button" onclick={getSystemFonts}>
        <MdIcon icon="refresh" />
        {$tr("params.text.fetch_fonts")}
      </button>
    {/if}
  </div>

  <FontsMenu />
</div>

<style>
  .font-family-picker {
    width: 100%;
  }

  .font-family-input {
    width: auto;
    min-width: 0;
    flex: 1 1 auto;
  }

  .dropdown-menu {
    width: 280px;
    max-width: calc(100vw - 1.5rem);
    max-height: 280px;
    overflow-y: auto;
  }

  .load-system-fonts {
    color: var(--bs-primary);
  }
</style>
