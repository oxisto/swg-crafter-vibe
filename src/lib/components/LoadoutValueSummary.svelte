<!-- LoadoutValueSummary.svelte -->
<script lang="ts">
	import { calculateLoadoutsValue, type ShipLoadout } from '$lib/types.js';

	interface Props {
		loadouts: ShipLoadout[];
	}

	let { loadouts }: Props = $props();

	// Calculate total value and statistics
	let totalValue = $derived(() => calculateLoadoutsValue(loadouts));
	let totalQuantity = $derived(() => loadouts.reduce((sum, loadout) => sum + loadout.quantity, 0));
	let availableLoadouts = $derived(() => loadouts.filter((loadout) => loadout.quantity > 0));
	let outOfStockLoadouts = $derived(() => loadouts.filter((loadout) => loadout.quantity === 0));

	// Format large numbers
	function formatCredits(amount: number): string {
		if (amount >= 1000000) {
			return (amount / 1000000).toFixed(1) + 'M';
		} else if (amount >= 1000) {
			return (amount / 1000).toFixed(0) + 'K';
		}
		return amount.toLocaleString();
	}
</script>

<div class="mb-8 flex w-full justify-center">
	<div class="w-full max-w-4xl rounded-lg border border-slate-700 bg-slate-800 p-6">
		<h3 class="mb-4 text-xl font-semibold text-slate-200">Ship Loadouts Summary</h3>

		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<!-- Total Value -->
			<div class="rounded-lg bg-slate-700/50 p-4">
				<div class="text-sm text-slate-400">Total Value</div>
				<div class="text-2xl font-bold text-green-400">
					{formatCredits(totalValue())} cr
				</div>
			</div>

			<!-- Total Quantity -->
			<div class="rounded-lg bg-slate-700/50 p-4">
				<div class="text-sm text-slate-400">Total in Stock</div>
				<div class="text-2xl font-bold text-blue-400">
					{totalQuantity()}
				</div>
			</div>

			<!-- Available Loadouts -->
			<div class="rounded-lg bg-slate-700/50 p-4">
				<div class="text-sm text-slate-400">Available</div>
				<div class="text-2xl font-bold text-green-400">
					{availableLoadouts().length}
				</div>
			</div>

			<!-- Out of Stock -->
			<div class="rounded-lg bg-slate-700/50 p-4">
				<div class="text-sm text-slate-400">Out of Stock</div>
				<div class="text-2xl font-bold text-red-400">
					{outOfStockLoadouts().length}
				</div>
			</div>
		</div>

		{#if totalValue() > 0}
			<div class="mt-4 text-center text-sm text-slate-400">
				Average value per loadout: {formatCredits(Math.round(totalValue() / totalQuantity()))} cr
			</div>
		{/if}
	</div>
</div>
