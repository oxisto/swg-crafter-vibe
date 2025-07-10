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
		vendor: string;
	}

	let { inventory, schematicNames, schematicIds, recommendedStockLevel, vendor }: Props = $props();
</script>

<div class="flex w-full justify-center px-8">
	<div class="inline-block">
		<!-- Vendor Header -->
		<div class="mb-6 text-center">
			<div
				class="inline-flex items-center space-x-3 rounded-lg border border-blue-500/30 bg-gradient-to-r from-blue-600/20 to-purple-600/20 px-6 py-3"
			>
				<div class="h-3 w-3 animate-pulse rounded-full bg-blue-400"></div>
				<h3 class="text-xl font-bold text-white">{vendor} Inventory</h3>
				<div class="h-3 w-3 animate-pulse rounded-full bg-blue-400"></div>
			</div>
		</div>

		<InventoryGridHeader />

		{#each PART_CATEGORIES as category}
			<InventoryRow
				{category}
				{inventory}
				{schematicNames}
				{schematicIds}
				{recommendedStockLevel}
				{vendor}
			/>
		{/each}
	</div>
</div>
