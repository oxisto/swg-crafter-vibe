<script lang="ts">
	import { inventory, settings } from '$lib/stores.js';
	import { calculateInventoryValue, calculateMarkLevelValue, MARK_LEVELS } from '$lib/types.js';
	import InventoryHeader from '$lib/components/InventoryHeader.svelte';
	import InventoryGrid from '$lib/components/InventoryGrid.svelte';
	import InventoryValueSummary from '$lib/components/InventoryValueSummary.svelte';
	import RecentActivity from '$lib/components/RecentActivity.svelte';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	// Initialize the stores with server data
	inventory.set(data.inventory);
	settings.set(data.settings);

	// Subscribe to the stores
	let currentInventory = $state($inventory || {});
	let currentSettings = $state(
		$settings || {
			recommendedStockLevel: 10,
			sellValues: { I: 0, II: 0, III: 0, IV: 0, V: 0 }
		}
	);
	let schematicNames = $state(data.schematicNames || {});
	let schematicIds = $state(data.schematicIds || {});

	// Calculate total inventory value
	let totalInventoryValue = $derived(() => {
		if (!currentSettings.sellValues) return 0;
		return calculateInventoryValue(currentInventory, currentSettings.sellValues);
	});

	// Calculate value by mark level
	let valuesByMarkLevel = $derived(() => {
		if (!currentSettings.sellValues) return {};
		const values: Record<string, number> = {};
		for (const markLevel of MARK_LEVELS) {
			values[markLevel] = calculateMarkLevelValue(
				currentInventory,
				markLevel,
				currentSettings.sellValues[markLevel] || 0
			);
		}
		return values;
	});

	// Update local state when stores change
	$effect(() => {
		currentInventory = $inventory || {};
		currentSettings = $settings || {
			recommendedStockLevel: 10,
			sellValues: { I: 0, II: 0, III: 0, IV: 0, V: 0 }
		};
	});
</script>

<svelte:head>
	<title>SWG Shipwright - Inventory Manager</title>
</svelte:head>

<div class="h-full">
	<div class="w-full px-4 py-8">
		<InventoryValueSummary
			settings={currentSettings}
			totalValue={totalInventoryValue()}
			valuesByMarkLevel={valuesByMarkLevel()}
		/>

		<!-- Recent Activity Summary
		<div class="mb-8 flex w-full justify-center">
			<div class="w-full max-w-4xl rounded-lg border border-slate-700 bg-slate-800 p-6">
				<RecentActivity
					limit={8}
					includeSchematic={true}
					title="📈 Recent Activity"
					showTitle={true}
				/>
			</div>
		</div>
		-->

		<InventoryGrid
			inventory={currentInventory}
			{schematicNames}
			{schematicIds}
			recommendedStockLevel={currentSettings.recommendedStockLevel}
		/>
	</div>
</div>
