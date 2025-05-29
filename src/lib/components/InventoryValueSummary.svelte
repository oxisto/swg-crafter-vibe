<!-- InventoryValueSummary.svelte -->
<script lang="ts">
	import { MARK_LEVELS } from '$lib/types.js';
	import type { Settings, Inventory } from '$lib/types.js';

	interface Props {
		settings: Settings;
		totalValue: number;
		valuesByMarkLevel: Record<string, number>;
	}

	let { settings, totalValue, valuesByMarkLevel }: Props = $props();

	// Only show if there are configured sell values
	let shouldDisplay = $derived(() => {
		return settings.sellValues && Object.values(settings.sellValues).some((v) => v > 0);
	});
</script>

{#if shouldDisplay()}
	<div class="mb-8 flex w-full justify-center">
		<div class="w-full max-w-6xl rounded-lg border border-slate-700 bg-slate-800 p-6">
			<h2 class="mb-4 flex items-center gap-2 text-xl font-semibold text-white">
				<span>💰</span>
				Inventory Value Summary
			</h2>

			<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7">
				<!-- Total Value -->
				<div class="rounded-lg bg-slate-700 p-4 text-center lg:col-span-2">
					<h3 class="mb-1 text-sm font-medium text-slate-300">Total Value</h3>
					<p class="text-2xl font-bold text-green-400">
						{totalValue.toLocaleString('en-US', {
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
							{valuesByMarkLevel[markLevel]?.toLocaleString('en-US', {
								minimumFractionDigits: 0,
								maximumFractionDigits: 0
							}) || '0'}
						</p>
						<p class="text-xs text-slate-500">
							@ {settings.sellValues[markLevel] || 0} each
						</p>
					</div>
				{/each}
			</div>
		</div>
	</div>
{/if}
