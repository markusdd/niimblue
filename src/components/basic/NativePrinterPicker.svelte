<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import AppModal from "./AppModal.svelte";
  import { tr } from "$/utils/i18n";
  import { connectionState } from "$/stores";
  import type { NiimbotNativeBluetoothClient, NativePrinter } from "$/utils/native_bluetooth";

  interface Props { client: NiimbotNativeBluetoothClient; show: boolean }
  let { client, show = $bindable() }: Props = $props();
  let modal: AppModal;
  let printers = $state<NativePrinter[]>([]);
  let scanning = $state(false);
  let connecting = $state(false);
  let error = $state("");
  let alive = true;
  const savedId = localStorage.getItem("native_printer_id");

  const scan = async () => {
    scanning = true;
    error = "";
    try {
      const found = await client.scan();
      if (alive) printers = found.sort((a, b) => Number(b.id === savedId) - Number(a.id === savedId));
    } catch (e) {
      if (alive) error = String(e);
    } finally {
      if (alive) scanning = false;
    }
  };

  const connect = async (printer: NativePrinter) => {
    connecting = true;
    connectionState.set("connecting");
    error = "";
    try {
      await client.connect({ deviceId: printer.id });
      if (!alive) return;
      localStorage.setItem("native_printer_id", printer.id);
      modal.hide();
    } catch (e) {
      if (alive) error = String(e);
    } finally {
      if (alive) connecting = false;
    }
  };

  const close = () => {
    alive = false;
    if (!client.isConnected() || connecting) {
      connectionState.set("disconnected");
      void client.disconnect().catch(console.error);
    }
  };

  onMount(() => { void scan(); });
  onDestroy(() => { if (alive) close(); });
</script>

<AppModal title={$tr("connector.native.choose")} bind:show bind:this={modal} onClose={close}>
  <p>{$tr("connector.native.instructions")}</p>
  {#if scanning}
    <p role="status">{$tr("connector.native.scanning")}</p>
  {:else if !printers.length && !error}
    <p>{$tr("connector.native.empty")}</p>
  {/if}
  {#if error}<div class="alert alert-danger" role="alert">{error}</div>{/if}
  <div class="list-group">
    {#each printers as printer (printer.id)}
      <button class="list-group-item list-group-item-action" type="button" disabled={connecting || scanning}
        onclick={() => connect(printer)}>
        <span class="fw-semibold">{printer.name}</span>
        {#if printer.id === savedId}<span class="badge text-bg-secondary ms-2">{$tr("connector.native.previous")}</span>{/if}
      </button>
    {/each}
  </div>
  {#if connecting}<p class="mt-2" role="status">{$tr("connector.native.connecting")}</p>{/if}
  {#snippet footer()}
    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">{$tr("preview.close")}</button>
    <button type="button" class="btn btn-primary" disabled={scanning || connecting} onclick={scan}>{$tr("connector.native.rescan")}</button>
  {/snippet}
</AppModal>
