<script lang="ts">
  import Modal from "bootstrap/js/dist/modal";
  import { onDestroy, onMount, type Snippet } from "svelte";

  interface Props {
    show: boolean;
    title: string;
    onClose?: () => void;
    onShown?: () => void;
    size?: "default" | "lg" | "xl";
    children: Snippet;
    footer?: Snippet;
  }

  let { show = $bindable(), title, onClose, onShown, size = "default", children, footer }: Props = $props();
  const titleId = $props.id();

  let modalEl: HTMLElement;
  let modal: Modal;

  onMount(() => {
    modal = new Modal(modalEl);
    modalEl.addEventListener("shown.bs.modal", () => onShown?.());
    modal.show();

    modalEl.addEventListener("hide.bs.modal", () => {
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    });

    modalEl.addEventListener("hidden.bs.modal", () => {
      if (onClose) onClose();
      show = false;
    });
  });

  onDestroy(() => {
    if (modal) {
      modal.hide();
      modal.dispose();
    }
  });

  export const hide = () => {
    if (modal) {
      modal.hide();
    }
  };
</script>

<div bind:this={modalEl} class="modal fade" tabindex="-1" aria-hidden="true" aria-labelledby={titleId}>
  <div class="modal-dialog modal-dialog-centered" class:modal-lg={size === "lg"} class:modal-xl={size === "xl"}>
    <div class="modal-content">
      <div class="modal-header">
        <h1 id={titleId} class="modal-title fs-5">{title}</h1>
        <button aria-label="Dismiss" type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>

      <div class="modal-body">
        {@render children()}
      </div>

      {#if footer}
        <div class="modal-footer">
          {@render footer()}
        </div>
      {/if}
    </div>
  </div>
</div>
