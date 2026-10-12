<script lang="ts">
  import { connectionState, heartbeatData, rfidInfo } from "$/stores";
  import { tr, type TranslationKey } from "$/utils/i18n";
  import {
    formatRibbonAmount,
    rememberRibbonColor,
    ribbonColors,
    ribbonSnapshot,
    type RibbonColor,
  } from "$/utils/ribbon";
  import { inkSwatch } from "$/utils/label_colors";

  interface Props {
    compact?: boolean;
    inkColor?: RibbonColor;
    onInk?: (color: RibbonColor) => void;
  }

  let { compact = false, inkColor, onInk }: Props = $props();

  let revision = $state(0);

  const colorKey = (color: RibbonColor): TranslationKey => `shell.ribbon.${color}` as TranslationKey;

  const snap = $derived.by(() => {
    revision;
    return ribbonSnapshot($rfidInfo, $heartbeatData);
  });

  const shownInk = $derived(inkColor ?? snap.color);

  const pick = (color: RibbonColor) => {
    if (onInk) {
      onInk(color);
      return;
    }
    if (!snap.barcode) return;
    rememberRibbonColor(snap.barcode, color);
    revision += 1;
  };
</script>

{#if $connectionState === "connected"}
  {#if compact}
    <span class="ribbon-compact">
      {#if snap.state === "out"}
        {$tr("shell.ribbon.out")}
      {:else if snap.state === "unread"}
        {$tr("shell.ribbon.unread")}
      {:else}
        {$tr("shell.ribbon")}
        {#if snap.color}· {$tr(colorKey(snap.color))}{/if}
        {#if snap.remaining !== undefined && snap.total !== undefined}
          · {formatRibbonAmount(snap.remaining, snap.total)} {$tr("shell.roll_left")}{/if}
      {/if}
    </span>
  {:else}
    <section class="ribbon-card">
      <div class="ribbon-head">
        {#if snap.state === "out"}
          <span>{$tr("shell.ribbon.out")}</span>
        {:else if snap.state === "unread"}
          <span>{$tr("shell.ribbon.unread")}</span>
        {:else}
          <span>{$tr("shell.ribbon")}</span>
          {#if snap.remaining !== undefined && snap.total !== undefined && snap.used !== undefined}
            <span class="muted">
              {formatRibbonAmount(snap.used, snap.total)} / {formatRibbonAmount(snap.total, snap.total)}
              · {formatRibbonAmount(snap.remaining, snap.total)} {$tr("shell.roll_left")}
            </span>
          {/if}
        {/if}
      </div>

      {#if snap.state === "ready" && snap.percent !== undefined}
        <div class="usage" role="progressbar" aria-valuenow={Math.round(snap.percent)} aria-valuemin={0} aria-valuemax={100}>
          <div class="usage-fill" style:width={`${snap.percent}%`}></div>
        </div>
      {/if}

      {#if snap.state === "ready"}
        <div class="swatches" role="radiogroup" aria-label={$tr("shell.ribbon.color")}>
          {#each ribbonColors as color (color)}
            <button
              type="button"
              class="swatch"
              class:light={color === "white" || color === "gold"}
              class:active={shownInk === color}
              style:background={inkSwatch[color]}
              aria-pressed={shownInk === color}
              title={$tr(colorKey(color))}
              onclick={() => pick(color)}></button>
          {/each}
        </div>
        <p class="hint">
          {#if snap.color}
            {$tr(colorKey(snap.color))}
          {:else}
            {$tr("shell.ribbon.color_hint")}
          {/if}
        </p>
      {/if}
    </section>
  {/if}
{/if}

<style>
  .ribbon-card {
    margin: 0 0.75rem 0.85rem;
    padding: 0.55rem 0.65rem 0.45rem;
    background: #fff;
    border: 1px solid #e0d9cc;
    border-radius: 8px;
  }

  .ribbon-head {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 0.35rem 0.5rem;
    font-size: 0.78rem;
    font-weight: 650;
    color: #3f382f;
  }

  .muted {
    font-weight: 500;
    color: #6d655b;
    text-align: right;
  }

  .usage {
    margin-top: 0.4rem;
    height: 0.45rem;
    border-radius: 99px;
    background: #e6e1d6;
    overflow: hidden;
  }

  .usage-fill {
    height: 100%;
    background: #6d829c;
  }

  .swatches {
    display: flex;
    flex-wrap: wrap;
    gap: 0.55rem;
    margin-top: 0.55rem;
    padding: 5px;
    margin-left: -5px;
    margin-right: -5px;
  }

  .swatch {
    flex: 0 0 auto;
    width: 2.25rem;
    height: 2.25rem;
    border: 0;
    border-radius: 99px;
    padding: 0;
    cursor: pointer;
    box-shadow: inset 0 0 0 1px rgba(36, 31, 26, 0.18);
  }

  .swatch.light {
    box-shadow: inset 0 0 0 1px #b7b1a6;
  }

  .swatch.active {
    box-shadow:
      0 0 0 2px #f6f3ec,
      0 0 0 4px #6d829c;
  }

  .hint {
    margin: 0.4rem 0 0.15rem;
    color: #6d655b;
    font-size: 0.75rem;
    line-height: 1.3;
  }
</style>
