<!-- InventoryGrid.svelte -->
<script lang="ts">
	import { PART_CATEGORIES } from '$lib/types.js';
	import InventoryGridHeader from '$lib/components/InventoryGridHeader.svelte';
	import InventoryRow from '$lib/components/InventoryRow.svelte';
	import type { Inventory } from '$lib/types.js';

	interface Props {
		inventory: Inventory;
		schematicNames: Record<string, string>;
		schematicIds: Record<string, string>;
		recommendedStockLevel: number;
	}

	let { inventory, schematicNames, schematicIds, recommendedStockLevel }: Props = $props();
</script>

<div class="flex w-full justify-center px-8">
	<div class="inline-block">
		<InventoryGridHeader />

		{#each PART_CATEGORIES as category}
			<InventoryRow
				{category}
				{inventory}
				{schematicNames}
				{schematicIds}
				{recommendedStockLevel}
			/>
		{/each}
	</div>
</div>
