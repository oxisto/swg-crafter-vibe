<!-- InventoryGridHeader.svelte -->
<script lang="ts">
	import { MARK_LEVELS } from '$lib/types.js';
</script>

<div class="mb-4 grid gap-4" style="grid-template-columns: 200px repeat(5, 130px);">
	<div class="text-center text-sm font-semibold text-slate-400">Part Category</div>
	{#each MARK_LEVELS as markLevel}
		<div class="text-center font-bold text-yellow-400">
			Mark {markLevel}
		</div>
	{/each}
</div>
