<script lang="ts">
  import { tr, type TranslationKey } from "$/utils/i18n";
  import { iconCodepoints, type MaterialIcon } from "$/styles/mdi_icons";
  import MdIcon from "$/components/basic/MdIcon.svelte";
  import { userIcons } from "$/stores";
  import { FileUtils } from "$/utils/file_utils";
  import { Toasts } from "$/utils/toasts";
  import { iconMatches } from "$/utils/icon_search";
  import { materialKeywords } from "$/data/material_keywords";
  import { CLIPART, PHOSPHOR_NOTICE } from "$/data/clipart";

  interface Props {
    onSubmit: (i: MaterialIcon) => void;
    onSubmitSvg: (i: string) => void;
    onClipart: (svg: string) => void;
    embedded?: boolean;
  }

  let { onSubmit, onSubmitSvg, onClipart, embedded = false }: Props = $props();

  const iconNames = Object.keys(iconCodepoints) as MaterialIcon[];
  const sources = [
    { id: "clipart", key: "editor.iconpicker.source.clipart" },
    { id: "material", key: "editor.iconpicker.source.material" },
    { id: "mine", key: "editor.iconpicker.source.mine" },
  ] as const satisfies ReadonlyArray<{ id: string; key: TranslationKey }>;

  let search = $state<string>("");
  let source = $state<(typeof sources)[number]["id"]>("clipart");
  let deleteMode = $state<boolean>(false);

  const svgUrl = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

  const clipartHits = $derived(
    source === "clipart" ? CLIPART.filter((item) => iconMatches(search, item.id, item.keywords)) : [],
  );
  const materialHits = $derived(
    source === "material"
      ? iconNames.filter((name) => iconMatches(search, name, materialKeywords[name] ?? ""))
      : [],
  );
  const mineHits = $derived(
    source === "mine" ? $userIcons.filter((icon) => iconMatches(search, icon.name, "")) : [],
  );
  const showEmpty = $derived.by(() => {
    const query = search.trim();
    if (!query) return false;
    if (source === "clipart") return clipartHits.length === 0;
    if (source === "material") return materialHits.length === 0;
    return mineHits.length === 0;
  });

  const addOwn = async () => {
    try {
      let counter = 0;
      const xmls = await FileUtils.pickAndReadTextFile("svg", true);
      const iconsToAdd = xmls.map((xml) => ({
        name: `i_${FileUtils.timestampFloat()}_${counter++}`,
        data: xml,
      }));
      userIcons.update((prev) => [...prev, ...iconsToAdd]);
    } catch (e) {
      Toasts.error(e);
    }
  };

  const svgClicked = (name: string, data: string) => {
    if (deleteMode) {
      userIcons.update((prev) => prev.filter((e) => e.name !== name));
      return;
    }
    onSubmitSvg(data);
  };
</script>

<div class="icon-picker" class:dropdown={!embedded}>
  {#if !embedded}
    <button class="btn btn-sm btn-secondary" type="button" data-bs-toggle="dropdown" data-bs-auto-close="outside">
      <MdIcon icon="emoji_emotions" />
      <MdIcon icon="add" />
    </button>
  {/if}

  <div class={embedded ? "icon-picker-body" : "dropdown-menu"}>
    {#if !embedded}
      <h6 class="dropdown-header">{$tr("editor.iconpicker.title")}</h6>
    {/if}
    <div class={embedded ? "pad" : "p-3"}>
      <div class="tabs" role="tablist">
        {#each sources as item (item.id)}
          <button
            type="button"
            class="tab"
            class:active={source === item.id}
            role="tab"
            aria-selected={source === item.id}
            onclick={() => (source = item.id)}>
            {$tr(item.key)}
          </button>
        {/each}
      </div>

      <input type="text" class="form-control form-control-sm mb-1" placeholder={$tr("editor.iconpicker.search")} bind:value={search} />

      {#if source === "clipart"}
        <div class="icons">
          {#each clipartHits as item (item.id)}
            <button type="button" class="glyph" data-clipart={item.id} title={item.id} onclick={() => onClipart(item.svg)}>
              <img alt="" src={svgUrl(item.svg)} />
            </button>
          {/each}
        </div>
        <p class="credit" title={PHOSPHOR_NOTICE}>{$tr("editor.iconpicker.credit")}</p>
      {:else if source === "material"}
        <div class="icons">
          {#each materialHits as name (name)}
            <button type="button" class="glyph" data-icon={name} title={name} onclick={() => onSubmit(name)}>
              <MdIcon icon={name} />
            </button>
          {/each}
        </div>
        <a
          href="https://fonts.google.com/icons?icon.set=Material+Icons&icon.style=Filled"
          target="_blank"
          class="text-secondary credit">
          {$tr("editor.iconpicker.mdi_link_title")}
        </a>
      {:else}
        <div class="icons">
          {#each mineHits as { name, data } (name)}
            <button
              type="button"
              class="glyph {deleteMode ? 'danger' : ''}"
              title={name}
              onclick={() => svgClicked(name, data)}>
              <img src="data:image/svg+xml;base64,{FileUtils.base64str(data)}" alt="" />
            </button>
          {/each}
        </div>
        <div class="mine-actions">
          <button class="btn btn-outline-secondary btn-sm" type="button" onclick={addOwn}>
            <MdIcon icon="add" />
            {$tr("editor.iconpicker.add")}
          </button>
          <button
            class="btn btn-sm {deleteMode ? 'btn-danger' : 'btn-outline-secondary'}"
            type="button"
            onclick={() => (deleteMode = !deleteMode)}>
            <MdIcon icon="delete" />
            {$tr("editor.iconpicker.delete_mode")}
          </button>
        </div>
      {/if}

      {#if showEmpty}
        <p class="empty">{$tr("editor.iconpicker.empty")}</p>
      {/if}
    </div>
  </div>
</div>

<style>
  .dropdown-menu {
    width: 100vw;
    max-width: 450px;
  }
  .icon-picker-body {
    width: 100%;
  }
  .pad {
    padding: 0.1rem;
  }
  .tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 0.2rem;
    margin-bottom: 0.35rem;
  }
  .tab {
    flex: 1 1 calc(33% - 0.2rem);
    border: 1px solid #d3cdc2;
    background: #fff;
    color: #1c2836;
    border-radius: 6px;
    font-size: 0.75rem;
    line-height: 1.2;
    padding: 0.22rem 0.25rem;
  }
  .tab.active {
    background: #d5dee9;
    border-color: #6d829c;
  }
  .icons {
    display: flex;
    flex-wrap: wrap;
    align-content: flex-start;
    gap: 0.2rem;
    max-height: 280px;
    overflow-y: auto;
  }
  .glyph {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    padding: 0.1rem;
    border: 1px solid transparent;
    background: #f6f3ec;
    border-radius: 6px;
    color: #1c2836;
  }
  .glyph:hover {
    background: #d5dee9;
  }
  .glyph.danger {
    background: #f3d6d2;
  }
  .glyph img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    pointer-events: none;
  }
  .credit,
  .empty {
    margin: 0.35rem 0 0;
    font-size: 0.72rem;
    color: #5c6b7a;
  }
  .mine-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    margin-top: 0.35rem;
  }
</style>
