<!-- LoadoutGrid.svelte -->
<script lang="ts">
	import type { ShipLoadout } from '$lib/types.js';
	import LoadoutItem from './LoadoutItem.svelte';

	interface Props {
		loadouts: ShipLoadout[];
	}

	let { loadouts }: Props = $props();

	// Group loadouts by ship type and variant for organized display
	let groupedLoadouts = $derived.by(() => {
		const groups: Record<string, ShipLoadout[]> = {};

		for (const loadout of loadouts) {
			const key = loadout.variant ? `${loadout.shipType} - ${loadout.variant}` : loadout.shipType;
			if (!groups[key]) {
				groups[key] = [];
			}
			groups[key].push(loadout);
		}

		// Sort loadouts within each group by mark level
		for (const key in groups) {
			groups[key].sort((a, b) => {
				const markOrder = ['I', 'II', 'III', 'IV', 'V'];
				return markOrder.indexOf(a.markLevel) - markOrder.indexOf(b.markLevel);
			});
		}

		return groups;
	});
</script>

<div class="w-full space-y-6">
	<div class="text-center">
		<h2 class="mb-2 text-2xl font-bold text-slate-100">Ship Loadouts</h2>
		<p class="text-slate-400">Complete ship configurations ready for sale</p>
	</div>

	<!-- Group loadouts by ship type/variant -->
	{#each Object.entries(groupedLoadouts) as [shipVariant, shipLoadouts]}
		<div class="rounded-lg border border-slate-700 bg-slate-800 p-6">
			<!-- Ship name header with icon -->
			<div class="mb-6 flex items-center justify-between border-b border-slate-600 pb-4">
				<div class="flex items-center gap-3">
					<span class="text-2xl">🚀</span>
					<div>
						<h3 class="text-xl font-bold text-slate-100">{shipVariant}</h3>
						<p class="text-sm text-slate-400">
							{shipLoadouts.length} loadout{shipLoadouts.length !== 1 ? 's' : ''} available
						</p>
					</div>
				</div>
				<div class="text-right">
					<div class="text-sm text-slate-400">Total Value</div>
					<div class="text-lg font-bold text-green-400">
						{shipLoadouts.reduce((sum, l) => sum + l.price * l.quantity, 0).toLocaleString()} cr
					</div>
				</div>
			</div>

			<!-- Loadout cards in grid -->
			<div class="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
				{#each shipLoadouts as loadout}
					<LoadoutItem {loadout} />
				{/each}
			</div>
		</div>
	{/each}

	{#if loadouts.length === 0}
		<div class="py-12 text-center">
			<div class="text-lg text-slate-400">No loadouts available</div>
			<div class="mt-2 text-sm text-slate-500">
				Add ship loadouts to start tracking complete ship configurations
			</div>
		</div>
	{/if}
</div>
