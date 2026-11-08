<script lang="ts">
  import MdIcon from "$/components/basic/MdIcon.svelte";
  import { tr } from "$/utils/i18n";
  import type { ExportedLabelTemplate, LabelProps } from "$/types";

  interface Props {
    labelProps: LabelProps;
    hasObjects: boolean;
    onApply: (template: ExportedLabelTemplate) => Promise<void>;
  }
  let { labelProps, hasObjects, onApply }: Props = $props();
  let show = $state(false);
  let trigger: HTMLButtonElement;
  const load = () => import("./DesignTemplatesDialog.svelte");
  let dialog = $state<ReturnType<typeof load>>();
  const open = () => {
    dialog ??= load();
    show = true;
  };
</script>

<button bind:this={trigger} class="rail-item" type="button" onclick={open} aria-haspopup="dialog">
  <MdIcon icon="auto_awesome" /><span>{$tr("designs.title")}</span>
</button>
{#if show}
  {#await dialog}
    <p class="small text-body-secondary px-2" role="status">{$tr("designs.loading")}</p>
  {:then module}
    {#if module}
      <module.default bind:show {labelProps} {hasObjects} {onApply} onClose={() => trigger?.focus()} />
    {/if}
  {:catch}
    <p class="small text-danger px-2" role="alert">{$tr("designs.failed")}</p>
    <button
      class="rail-item"
      type="button"
      onclick={() => {
        show = false;
        dialog = undefined;
        trigger?.focus();
      }}>{$tr("preview.close")}</button>
  {/await}
{/if}
