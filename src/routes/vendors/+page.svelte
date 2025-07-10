<script lang="ts">
	import InventoryGrid from '$lib/components/InventoryGrid.svelte';
	import InventoryValueSummary from '$lib/components/InventoryValueSummary.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Button from '$lib/components/Button.svelte';
	import { inventory, settings } from '$lib/stores.js';
	import { calculateInventoryValue, calculateMarkLevelValue, MARK_LEVELS } from '$lib/types.js';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	// Initialize the stores with server data
	settings.set(data.settings);

	// Current vendor selection
	let currentVendor = $state(data.vendors[0] || 'Drasi Crossing');

	// Get current vendor's data
	let currentVendorData = $derived(() => {
		return (
			data.vendorInventories[currentVendor] || {
				inventory: {},
				schematicNames: {},
				schematicIds: {}
			}
		);
	});

	// Update inventory store when vendor changes
	$effect(() => {
		inventory.set(currentVendorData().inventory);
	});

	// Use reactive store values directly
	let schematicNames = $derived(() => currentVendorData().schematicNames);
	let schematicIds = $derived(() => currentVendorData().schematicIds);

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
	<title>SWG Shipwright - Vendor Inventory</title>
</svelte:head>

<PageLayout>
	<PageHeader
		title="Vendor Inventory Management"
		subtitle="Manage shipwright inventory across multiple vendors"
	/>

	<!-- Vendor Selection -->
	<div class="mb-8 rounded-lg border border-slate-700 bg-slate-800/50 p-6">
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-2xl font-bold text-white">Select Vendor Location</h2>
			<div class="rounded-full bg-slate-700/50 px-3 py-1 text-sm text-slate-400">
				{data.vendors.length} locations available
			</div>
		</div>

		<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div class="flex flex-wrap gap-3">
				{#each data.vendors as vendor}
					<Button
						variant={currentVendor === vendor ? 'primary' : 'secondary'}
						onclick={() => (currentVendor = vendor)}
						class={`relative min-w-[140px] transition-all duration-200 ${
							currentVendor === vendor
								? 'scale-105 shadow-lg ring-2 shadow-blue-500/25 ring-blue-400 ring-offset-2 ring-offset-slate-900'
								: 'hover:scale-105'
						}`}
					>
						{#if currentVendor === vendor}
							<span class="absolute -top-2 -right-2 h-3 w-3 animate-pulse rounded-full bg-green-400"
							></span>
						{/if}
						{vendor}
					</Button>
				{/each}
			</div>

			<div class="flex items-center space-x-2 rounded-lg bg-slate-700/50 px-4 py-2">
				<div class="h-2 w-2 animate-pulse rounded-full bg-green-400"></div>
				<span class="text-sm font-medium text-white">Currently viewing:</span>
				<span class="text-lg font-bold text-blue-400">{currentVendor}</span>
			</div>
		</div>
	</div>

	<!-- Inventory Value Summary -->
	<InventoryValueSummary
		settings={$settings || {
			recommendedStockLevel: 10,
			sellValues: { I: 0, II: 0, III: 0, IV: 0, V: 0 }
		}}
		totalValue={totalInventoryValue()}
		valuesByMarkLevel={valuesByMarkLevel()}
	/>

	<!-- Inventory Grid -->
	<InventoryGrid
		inventory={$inventory}
		schematicNames={schematicNames()}
		schematicIds={schematicIds()}
		recommendedStockLevel={$settings?.recommendedStockLevel || 10}
		vendor={currentVendor}
	/>
</PageLayout>
