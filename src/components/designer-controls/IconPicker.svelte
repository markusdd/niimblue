<script lang="ts">
  import { tr, type TranslationKey } from "$/utils/i18n";
  import { iconCodepoints, type MaterialIcon } from "$/styles/mdi_icons";
  import MdIcon from "$/components/basic/MdIcon.svelte";
  import { userIcons } from "$/stores";
  import { FileUtils } from "$/utils/file_utils";
  import { Toasts } from "$/utils/toasts";
  import { iconMatches } from "$/utils/icon_search";
  import { materialKeywords } from "$/data/material_keywords";
  import { CLIPART, PHOSPHOR_NOTICE, type ClipartIcon } from "$/data/clipart";

  import type { DecorativeOrnament, OrnamentCollection } from "$/data/decorative_ornaments";

  type PickerIcon = ClipartIcon & Partial<Pick<DecorativeOrnament, "name" | "collection">>;

  interface Props {
    onSubmit: (i: MaterialIcon) => void;
    onSubmitSvg: (i: string, name?: string) => void;
    onClipart: (svg: string, name?: string) => void;
    embedded?: boolean;
  }

  let { onSubmit, onSubmitSvg, onClipart, embedded = false }: Props = $props();

  const iconNames = Object.keys(iconCodepoints) as MaterialIcon[];
  const sources = [
    { id: "ornaments", key: "editor.iconpicker.source.ornaments" },
    { id: "botanical", key: "editor.iconpicker.source.botanical" },
    { id: "clipart", key: "editor.iconpicker.source.clipart" },
    { id: "tabler", key: "editor.iconpicker.source.tabler" },
    { id: "health", key: "editor.iconpicker.source.health" },
    { id: "material", key: "editor.iconpicker.source.material" },
    { id: "mine", key: "editor.iconpicker.source.mine" },
  ] as const satisfies ReadonlyArray<{ id: string; key: TranslationKey }>;

  let search = $state<string>("");
  let source = $state<(typeof sources)[number]["id"]>("clipart");
  let deleteMode = $state<boolean>(false);
  let ornamentCollection = $state<"all" | OrnamentCollection>("all");
  let extraIcons = $state<Partial<Record<"tabler" | "health" | "botanical" | "ornaments", PickerIcon[]>>>({});
  let collectionFailed = $state<Partial<Record<"tabler" | "health" | "botanical" | "ornaments", boolean>>>({});
  const collectionLoads: Partial<Record<"tabler" | "health" | "botanical" | "ornaments", Promise<PickerIcon[]>>> = {};

  $effect(() => {
    if (source !== "tabler" && source !== "health" && source !== "botanical" && source !== "ornaments") return;
    const selected = source;
    if (extraIcons[selected] || collectionFailed[selected]) return;
    collectionLoads[selected] ??= (
      selected === "ornaments"
        ? import("$/data/decorative_ornaments")
        : selected === "tabler"
          ? import("$/data/tabler_clipart")
          : selected === "botanical"
            ? import("$/data/botanical_ornaments")
            : import("$/data/health_clipart")
    ).then((module) =>
      "DECORATIVE_ORNAMENTS" in module
        ? module.DECORATIVE_ORNAMENTS
        : "CLIPART" in module
          ? module.CLIPART
          : module.BOTANICAL_ORNAMENTS,
    );
    void collectionLoads[selected]!.then((icons) => {
      extraIcons[selected] = icons;
    }).catch((error) => {
      collectionFailed[selected] = true;
      Toasts.error(error);
    });
  });

  const isClipart = $derived(
    source === "ornaments" ||
      source === "botanical" ||
      source === "clipart" ||
      source === "tabler" ||
      source === "health",
  );
  const loading = $derived(
    (source === "tabler" || source === "health" || source === "botanical" || source === "ornaments") &&
      !extraIcons[source] &&
      !collectionFailed[source],
  );
  const activeClipart: PickerIcon[] = $derived(
    source === "clipart"
      ? CLIPART
      : source === "tabler" || source === "health" || source === "botanical" || source === "ornaments"
        ? (extraIcons[source] ?? [])
        : [],
  );

  const svgUrl = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

  const clipartHits = $derived(
    activeClipart.filter(
      (item: PickerIcon) =>
        (source !== "ornaments" || ornamentCollection === "all" || item.collection === ornamentCollection) &&
        iconMatches(search, item.id, `${item.name ?? ""} ${item.keywords}`),
    ),
  );
  const materialHits = $derived(
    source === "material" ? iconNames.filter((name) => iconMatches(search, name, materialKeywords[name] ?? "")) : [],
  );
  const mineHits = $derived(source === "mine" ? $userIcons.filter((icon) => iconMatches(search, icon.name, "")) : []);
  const showEmpty = $derived.by(() => {
    const query = search.trim();
    if (!query) return false;
    if (isClipart) return !loading && clipartHits.length === 0;
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
    onSubmitSvg(data, name);
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

      {#if source === "ornaments"}
        <select
          class="form-select form-select-sm mb-1"
          bind:value={ornamentCollection}
          aria-label={$tr("editor.iconpicker.ornament_collection")}>
          <option value="all">{$tr("editor.iconpicker.all_ornaments")}</option>
          <option value="vintage">{$tr("designs.vintage")}</option>
          <option value="artdeco">{$tr("designs.artdeco")}</option>
          <option value="cyber">{$tr("designs.cyber")}</option>
        </select>
      {/if}

      <input
        type="text"
        class="form-control form-control-sm mb-1"
        placeholder={$tr("editor.iconpicker.search")}
        bind:value={search} />

      {#if isClipart}
        {#if loading}<p class="credit" role="status">{$tr("editor.iconpicker.loading")}</p>{/if}
        <div class="icons">
          {#each clipartHits as item (item.id)}
            <button
              type="button"
              class="glyph"
              class:botanical={source === "botanical"}
              class:ornament={source === "ornaments"}
              data-clipart={item.id}
              title={item.name ?? item.id}
              onclick={() => onClipart(item.svg, item.name ?? item.id)}>
              <img alt="" src={svgUrl(item.svg)} />
            </button>
          {/each}
        </div>
        {#if source === "ornaments"}
          <p class="credit">{$tr("editor.iconpicker.ornaments_credit")}</p>
          <p class="credit">{$tr("editor.iconpicker.ornaments_hint")}</p>
        {:else if source === "botanical"}
          <p class="credit">{$tr("editor.iconpicker.botanical_credit")}</p>
        {:else if source === "clipart"}
          <p class="credit" title={PHOSPHOR_NOTICE}>{$tr("editor.iconpicker.credit")}</p>
        {:else if source === "tabler"}
          <a class="credit" href="https://github.com/tabler/tabler-icons" target="_blank" rel="noreferrer"
            >Tabler Icons · MIT</a>
        {:else}
          <a class="credit" href="https://healthicons.org/about" target="_blank" rel="noreferrer">Health Icons · CC0</a>
        {/if}
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
    border: 1px solid var(--nb-border);
    background: #fff;
    color: var(--nb-text);
    border-radius: 6px;
    font-size: 0.75rem;
    line-height: 1.2;
    padding: 0.22rem 0.25rem;
  }
  .tab.active {
    background: var(--nb-accent-soft);
    border-color: var(--nb-accent);
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
    background: var(--nb-surface);
    border-radius: 6px;
    color: var(--nb-text);
  }
  .glyph.botanical {
    width: 3.5rem;
    height: 4.25rem;
    padding: 0.3rem;
  }
  .glyph.ornament {
    width: 5.5rem;
    height: 3.5rem;
    padding: 0.35rem;
  }
  .glyph:hover {
    background: var(--nb-accent-soft);
  }
  .glyph.danger {
    background: var(--nb-danger-soft);
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
    color: var(--nb-text-muted);
  }
  .mine-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    margin-top: 0.35rem;
  }
</style>
