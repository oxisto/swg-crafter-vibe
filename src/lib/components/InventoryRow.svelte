<!-- InventoryRow.svelte -->
<script lang="ts">
	import { MARK_LEVELS, getInventoryKey } from '$lib/types.js';
	import InventoryItem from '$lib/components/InventoryItem.svelte';
	import type { PartCategory, Inventory } from '$lib/types.js';

	interface Props {
		category: PartCategory;
		inventory: Inventory;
		schematicNames: Record<string, string>;
		schematicIds: Record<string, string>;
		recommendedStockLevel: number;
	}

	let { category, inventory, schematicNames, schematicIds, recommendedStockLevel }: Props =
		$props();
</script>

<div class="mb-4 grid gap-4" style="grid-template-columns: 200px repeat(5, 130px);">
	<div
		class="flex items-center justify-center rounded bg-slate-800 px-4 py-3 text-center text-sm font-semibold text-slate-300"
	>
		{category}
	</div>
	{#each MARK_LEVELS as markLevel}
		{@const key = getInventoryKey(category, markLevel)}
		{@const quantity = inventory?.[key] ?? 0}
		{@const schematicName = schematicNames[key]}
		{@const schematicId = schematicIds[key]}
		<InventoryItem
			{category}
			{markLevel}
			{quantity}
			{schematicName}
			{schematicId}
			{recommendedStockLevel}
		/>
	{/each}
</div>
