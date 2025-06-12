<script lang="ts">
	import type { Resource } from '$lib/types';

	let { resource }: { resource: Resource } = $props();

	// Count planets where resource is present
	const activePlanetCount = Object.values(resource.planetDistribution).filter(
		(concentration) => concentration > 0
	).length;

	// Get the top planets
	const topPlanets = Object.entries(resource.planetDistribution)
		.filter(([_, value]) => value > 0)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 2)
		.map(([planet]) => planet.charAt(0).toUpperCase() + planet.slice(1).replace('_', ' '));
</script>

<a href="/resources/{resource.id}" class="block">
	<div
		class="rounded-lg border border-slate-700 bg-slate-800 p-4 transition-all hover:bg-slate-700"
	>
		<div class="flex items-start justify-between">
			<div class="flex-1">
				<div class="flex items-center gap-2">
					<h3 class="text-lg font-medium text-white">{resource.name}</h3>
					{#if !resource.isCurrentlySpawned}
						<span
							class="inline-flex items-center rounded-full bg-red-900 px-2 py-1 text-xs font-medium text-red-200"
						>
							Despawned
						</span>
					{:else}
						<span
							class="inline-flex items-center rounded-full bg-green-900 px-2 py-1 text-xs font-medium text-green-200"
						>
							Active
						</span>
					{/if}
				</div>
			</div>
			{#if resource.stats?.overallQuality}
				<div
					class="rounded px-2 py-1 text-xs font-semibold
                    {resource.stats.overallQuality > 900
						? 'bg-green-900 text-green-200'
						: resource.stats.overallQuality > 700
							? 'bg-yellow-900 text-yellow-200'
							: 'bg-blue-900 text-blue-200'}"
				>
					{resource.stats.overallQuality}
				</div>
			{/if}
		</div>

		<div class="mt-1 text-sm text-slate-400">
			{resource.className}
		</div>

		<div class="mt-3 text-xs text-slate-400">
			<div class="flex justify-between">
				<div>Added: {new Date(resource.enterDate).toLocaleDateString()}</div>
				<div>{activePlanetCount} {activePlanetCount === 1 ? 'planet' : 'planets'}</div>
			</div>
		</div>

		{#if topPlanets.length > 0}
			<div class="mt-2 text-xs">
				<span class="text-slate-400">Top spawn: </span>
				<span class="text-slate-300">{topPlanets.join(', ')}</span>
				{activePlanetCount > 2 ? '...' : ''}
			</div>
		{/if}

		<div class="mt-3 flex flex-wrap gap-2">
			{#each Object.entries(resource.attributes).slice(0, 4) as [attr, value]}
				<div class="rounded bg-slate-600 px-2 py-0.5 text-xs text-slate-300">
					{attr.toUpperCase()}: {value}
				</div>
			{/each}
		</div>
	</div>
</a>
