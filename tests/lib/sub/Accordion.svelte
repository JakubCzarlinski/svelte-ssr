<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    id,
    initialOpen = false,
    head,
    details,
  }: {
    id: string;
    initialOpen?: boolean;
    head?: Snippet;
    details?: Snippet;
  } = $props();
</script>

<div class="accordion" {id}>
  <input
    type="checkbox"
    id="{id}-toggle"
    class="hidden"
    checked={initialOpen}
  />
  <label
    for="{id}-toggle"
    class="flex w-full justify-between items-center cursor-pointer"
  >
    {@render head?.()}
    <div class="mr-4 pt-4 font-extrabold">V</div>
  </label>

  <div class="details">
    {@render details?.()}
  </div>
</div>

<hr class="!border-t-2" />
