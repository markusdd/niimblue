<script lang="ts">
  import type { LabelProps } from "$/types";
  import { pxToMm } from "$/utils/label_units";
  import { FileUtils } from "$/utils/file_utils";
  import MdIcon from "$/components/basic/MdIcon.svelte";
  import { tr } from "$/utils/i18n";
  import { Toasts } from "$/utils/toasts";

  interface Props {
    labelProps: LabelProps;
    onImageReady: (img: Blob) => void;
  }

  let { labelProps, onImageReady }: Props = $props();
  let importState = $state<"idle" | "processing" | "error">("idle");

  const onImportClicked = async () => {
    const mmToInchCoeff = 25.4;
    // Labelary's nearest density to the editor raster. The inch size is the physical label.
    const dpmm = 12;
    const widthInches = pxToMm(labelProps.size.width) / mmToInchCoeff;
    const heightInches = pxToMm(labelProps.size.height) / mmToInchCoeff;

    const contents = await FileUtils.pickAndReadSingleTextFile("zpl");

    importState = "processing";

    try {
      const response = await fetch(
        `https://api.labelary.com/v1/printers/${dpmm}dpmm/labels/${widthInches}x${heightInches}/0/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "image/png",
            "X-Quality": "bitonal",
          },
          body: contents,
        },
      );
      if (response.ok) {
        const img = await response.blob();
        onImageReady(img);
        importState = "idle";
      } else {
        importState = "error";
      }
    } catch (e) {
      importState = "error";
      Toasts.error(e);
    }
  };
</script>

<button class="btn btn-sm" onclick={onImportClicked}>
  <MdIcon icon="receipt_long" />

  {$tr("editor.import.zpl")}

  {#if importState === "processing"}
    <MdIcon icon="hourglass_top" />
  {:else if importState === "error"}
    <MdIcon icon="warning" class="text-warning" />
  {/if}
</button>
