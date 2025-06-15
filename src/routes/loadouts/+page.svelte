<script lang="ts">
	import PageLayout from '$lib/components/PageLayout.svelte';
	import LoadoutValueSummary from '$lib/components/LoadoutValueSummary.svelte';
	import ShipRow from '$lib/components/ShipRow.svelte';
	import type { PageData } from './$types.js';
	import type { ShipLoadout, ShipChassis } from '$lib/types.js';

	let { data }: { data: PageData } = $props();

	let loadouts = $state(data.loadouts || []);
	let chassis = $state(data.chassis || []);

	// Group loadouts and chassis by ship type and variant
	let groupedShips = $derived.by(() => {
		const groups = new Map<
			string,
			{
				shipType: string;
				variant?: string;
				chassis?: ShipChassis;
				loadouts: ShipLoadout[];
			}
		>();

		// Process loadouts
		for (const loadout of loadouts) {
			const key = `${loadout.shipType}-${loadout.variant || 'default'}`;
			if (!groups.has(key)) {
				groups.set(key, {
					shipType: loadout.shipType,
					variant: loadout.variant,
					loadouts: []
				});
			}
			groups.get(key)!.loadouts.push(loadout);
		}

		// Process chassis
		for (const chassisItem of chassis) {
			const key = `${chassisItem.shipType}-${chassisItem.variant || 'default'}`;
			if (!groups.has(key)) {
				groups.set(key, {
					shipType: chassisItem.shipType,
					variant: chassisItem.variant,
					loadouts: []
				});
			}
			groups.get(key)!.chassis = chassisItem;
		}

		// Sort loadouts within each group by mark level
		for (const group of groups.values()) {
			group.loadouts.sort((a, b) => {
				const markOrder = { I: 1, II: 2, III: 3, IV: 4, V: 5 };
				return markOrder[a.markLevel] - markOrder[b.markLevel];
			});
		}

		return Array.from(groups.values());
	});
</script>

<svelte:head>
	<title>SWG Shipwright - Ship Loadouts & Chassis</title>
</svelte:head>

<PageLayout>
	<div class="mb-8 text-center">
		<h1 class="mb-4 text-4xl font-bold text-slate-100">Ship Loadouts & Chassis</h1>
		<p class="mx-auto max-w-2xl text-lg text-slate-300">
			Manage complete ship configurations and base chassis frames ready for sale. Each ship type
			shows the chassis frame alongside Mark I-III loadout configurations in a single row.
		</p>
	</div>

	<LoadoutValueSummary {loadouts} />

	<!-- Ship Rows - Chassis + Loadouts per ship type -->
	<div class="mt-8">
		{#each groupedShips as shipGroup}
			<ShipRow
				shipType={shipGroup.shipType}
				variant={shipGroup.variant}
				chassis={shipGroup.chassis}
				loadouts={shipGroup.loadouts}
			/>
		{/each}
	</div>

	{#if loadouts.length === 0 && chassis.length === 0}
		<div class="mt-12 text-center">
			<div class="rounded-lg border border-slate-700 bg-slate-800 p-12">
				<div class="mb-4 text-6xl">🚀</div>
				<h2 class="mb-4 text-2xl font-bold text-slate-200">
					No Ship Loadouts or Chassis Available
				</h2>
				<p class="mb-6 text-slate-400">
					This page will show your ship inventory organized by ship type, with chassis and Mark
					I-III loadouts displayed in rows for easy management.
				</p>
				<div class="text-sm text-slate-500">
					Loadouts and chassis can be added through the API or by modifying the database directly.
				</div>
			</div>
		</div>
	{/if}
</PageLayout>
