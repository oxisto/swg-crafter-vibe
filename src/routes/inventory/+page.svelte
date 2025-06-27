<script lang="ts">
	import InventoryGrid from '$lib/components/InventoryGrid.svelte';
	import InventoryValueSummary from '$lib/components/InventoryValueSummary.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import { inventory, settings } from '$lib/stores.js';
	import { calculateInventoryValue, calculateMarkLevelValue, MARK_LEVELS } from '$lib/types.js';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	// Initialize the stores with server data
	inventory.set(data.inventory);
	settings.set(data.settings);

	// Use reactive store values directly
	let schematicNames = $state(data.schematicNames || {});
	let schematicIds = $state(data.schematicIds || {});

	// Calculate total inventory value using reactive store
	let totalInventoryValue = $derived(() => {
		if (!$settings?.sellValues) return 0;
		return calculateInventoryValue($inventory, $settings.sellValues);
	});

	// Calculate value by mark level using reactive store
	let valuesByMarkLevel = $derived(() => {
		if (!$settings?.sellValues) return {};
		const values: Record<string, number> = {};
		for (const markLevel of MARK_LEVELS) {
			values[markLevel] = calculateMarkLevelValue(
				$inventory,
				markLevel,
				$settings.sellValues[markLevel] || 0
			);
		}
		return values;
	});
</script>

<svelte:head>
	<title>SWG Shipwright - Inventory Manager</title>
</svelte:head>

<PageLayout>
	<InventoryValueSummary
		settings={$settings || {
			recommendedStockLevel: 10,
			sellValues: { I: 0, II: 0, III: 0, IV: 0, V: 0 }
		}}
		totalValue={totalInventoryValue()}
		valuesByMarkLevel={valuesByMarkLevel()}
	/>

	<InventoryGrid
		inventory={$inventory}
		{schematicNames}
		{schematicIds}
		recommendedStockLevel={$settings?.recommendedStockLevel || 10}
	/>
</PageLayout>
