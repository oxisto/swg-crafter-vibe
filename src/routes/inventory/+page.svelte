<script lang="ts">
	import { inventory, settings } from '$lib/stores.js';
	import {
		PART_CATEGORIES,
		MARK_LEVELS,
		getInventoryKey,
		calculateInventoryValue,
		calculateMarkLevelValue
	} from '$lib/types.js';
	import InventoryItem from '$lib/components/InventoryItem.svelte';
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
		<header class="mb-8 text-center">
			<h1 class="mb-2 text-3xl font-bold text-yellow-400">Inventory Overview</h1>
			<p class="text-slate-400">Manage your shipwright part stock levels</p>
		</header>

		<div class="flex w-full justify-center px-8">
			<div class="inline-block">
				<!-- Header row with Mark levels -->
				<div class="mb-4 grid gap-4" style="grid-template-columns: 200px repeat(5, 130px);">
					<div class="text-center text-sm font-semibold text-slate-400">Part Category</div>
					{#each MARK_LEVELS as markLevel}
						<div class="text-center font-bold text-yellow-400">
							Mark {markLevel}
						</div>
					{/each}
				</div>

				<!-- Inventory grid -->
				{#each PART_CATEGORIES as category}
					<div class="mb-4 grid gap-4" style="grid-template-columns: 200px repeat(5, 130px);">
						<div
							class="flex items-center justify-center rounded bg-slate-800 px-4 py-3 text-center text-sm font-semibold text-slate-300"
						>
							{category}
						</div>
						{#each MARK_LEVELS as markLevel}
							{@const key = getInventoryKey(category, markLevel)}
							{@const quantity = currentInventory?.[key] ?? 0}
							{@const schematicName = schematicNames[key]}
							{@const schematicId = schematicIds[key]}
							<InventoryItem
								{category}
								{markLevel}
								{quantity}
								{schematicName}
								{schematicId}
								recommendedStockLevel={currentSettings.recommendedStockLevel}
							/>
						{/each}
					</div>
				{/each}
			</div>
		</div>

		<!-- Inventory Value Summary -->
		{#if currentSettings.sellValues && Object.values(currentSettings.sellValues).some((v) => v > 0)}
			<div class="mb-8 flex w-full justify-center">
				<div class="w-full max-w-4xl rounded-lg border border-slate-700 bg-slate-800 p-6">
					<h2 class="mb-4 flex items-center gap-2 text-xl font-semibold text-white">
						<span>💰</span>
						Inventory Value Summary
					</h2>

					<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6">
						<!-- Total Value -->
						<div class="rounded-lg bg-slate-700 p-4 text-center lg:col-span-2">
							<h3 class="mb-1 text-sm font-medium text-slate-300">Total Value</h3>
							<p class="text-2xl font-bold text-green-400">
								{totalInventoryValue().toLocaleString('en-US', {
									minimumFractionDigits: 0,
									maximumFractionDigits: 0
								})}
							</p>
						</div>

						<!-- Values by Mark Level -->
						{#each MARK_LEVELS as markLevel}
							<div class="rounded-lg bg-slate-700 p-4 text-center">
								<h3 class="mb-1 text-sm font-medium text-slate-300">Mark {markLevel}</h3>
								<p class="text-lg font-bold text-blue-400">
									{valuesByMarkLevel()[markLevel]?.toLocaleString('en-US', {
										minimumFractionDigits: 0,
										maximumFractionDigits: 0
									}) || '0'}
								</p>
								<p class="text-xs text-slate-500">
									@ {currentSettings.sellValues[markLevel] || 0} each
								</p>
							</div>
						{/each}
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
