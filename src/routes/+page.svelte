<script lang="ts">
	import { inventory, settings } from '$lib/stores.js';
	import { PART_CATEGORIES, MARK_LEVELS, getInventoryKey } from '$lib/types.js';
	import InventoryItem from '$lib/components/InventoryItem.svelte';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	// Initialize the stores with server data
	inventory.set(data.inventory);
	settings.set(data.settings);
	
	// Subscribe to the stores
	let currentInventory = $state($inventory || {});
	let currentSettings = $state($settings || { recommendedStockLevel: 10 });
	
	// Update local state when stores change
	$effect(() => {
		currentInventory = $inventory || {};
		currentSettings = $settings || { recommendedStockLevel: 10 };
	});
</script>

<svelte:head>
	<title>SWG Shipwright - Inventory Manager</title>
</svelte:head>

<div class="h-full">
	<div class="w-full px-4 py-8">
		<header class="text-center mb-8">
			<h1 class="text-3xl font-bold text-yellow-400 mb-2">
				Inventory Overview
			</h1>
			<p class="text-slate-400">
				Manage your shipwright part stock levels
			</p>
		</header>

		<div class="w-full flex justify-center px-8">
			<div class="inline-block">
				<!-- Header row with Mark levels -->
				<div class="grid gap-4 mb-4" style="grid-template-columns: 200px repeat(5, 130px);">
					<div class="text-slate-400 font-semibold text-center text-sm">Part Category</div>
					{#each MARK_LEVELS as markLevel}
						<div class="text-center text-yellow-400 font-bold">
							Mark {markLevel}
						</div>
					{/each}
				</div>

				<!-- Inventory grid -->
				{#each PART_CATEGORIES as category}
					<div class="grid gap-4 mb-4" style="grid-template-columns: 200px repeat(5, 130px);">
						<div class="flex items-center justify-center font-semibold text-slate-300 bg-slate-800 rounded px-4 py-3 text-center text-sm">
							{category}
						</div>
						{#each MARK_LEVELS as markLevel}
							{@const key = getInventoryKey(category, markLevel)}
							{@const quantity = currentInventory?.[key] ?? 0}
							<InventoryItem {category} {markLevel} {quantity} recommendedStockLevel={currentSettings.recommendedStockLevel} />
						{/each}
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>
