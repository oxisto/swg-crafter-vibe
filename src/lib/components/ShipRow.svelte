<!-- ShipRow.svelte -->
<script lang="ts">
	import type { ShipLoadout, ShipChassis } from '$lib/types.js';
	import LoadoutItem from './LoadoutItem.svelte';
	import ChassisItem from './ChassisItem.svelte';

	interface Props {
		shipType: string;
		variant?: string;
		chassis?: ShipChassis;
		loadouts: ShipLoadout[];
	}

	let { shipType, variant, chassis, loadouts }: Props = $props();

	// Create display name for the ship
	let displayName = $derived(variant ? `${shipType} ${variant}` : shipType);
</script>

<div class="mb-8">
	<h3 class="mb-4 text-xl font-semibold text-slate-200">{displayName}</h3>
	<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
		<!-- Chassis (if available) -->
		{#if chassis}
			<ChassisItem {chassis} />
		{/if}

		<!-- Loadouts (Mark I, II, III) -->
		{#each loadouts as loadout}
			<LoadoutItem {loadout} />
		{/each}
	</div>
</div>
