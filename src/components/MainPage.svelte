<script lang="ts">
  import BrowserWarning from "$/components/basic/BrowserWarning.svelte";
  import LabelDesigner from "$/components/LabelDesigner.svelte";
  import { locale } from "$/utils/i18n";

  $effect(() => {
    document.documentElement.lang = $locale.replaceAll("_", "-");
  });
</script>

<div class="app-shell">
  <BrowserWarning />
  <LabelDesigner />
</div>
