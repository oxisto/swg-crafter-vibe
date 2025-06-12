<script lang="ts">
	import { PLANETS } from '$lib/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Full names for resource attributes
	const attributeLabels: Record<string, string> = {
		cr: 'Cold Resistance',
		cd: 'Conductivity',
		dr: 'Decay Resistance',
		fl: 'Flavor',
		hr: 'Heat Resistance',
		ma: 'Malleability',
		pe: 'Potential Energy',
		oq: 'Overall Quality',
		sr: 'Shock Resistance',
		ut: 'Unit Toughness',
		er: 'Entangle Resistance'
	};

	// Format the planet distribution to show only planets with spawns
	const activePlanets = Object.entries(data.resource.planetDistribution)
		.filter(([_, value]) => value > 0)
		.map(([planet, concentration]) => ({
			planet,
			concentration,
			formattedName: planet.charAt(0).toUpperCase() + planet.slice(1).replace('_', ' ')
		}))
		.sort((a, b) => b.concentration - a.concentration);
</script>

<div class="h-full bg-slate-900 text-white">
	<div class="container mx-auto p-4">
		<div class="mb-4">
			<a
				href="/resources"
				class="flex items-center gap-1 text-blue-400 hover:text-blue-300 hover:underline"
			>
				<span>←</span>
				<span>Back to Resources</span>
			</a>
		</div>

		<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
			<!-- Main resource information -->
			<div class="lg:col-span-2">
				<div class="rounded-lg border border-slate-700 bg-slate-800 p-6">
					<div class="flex items-start justify-between">
						<div class="flex-1">
							<div class="flex items-center gap-3">
								<h1 class="text-2xl font-bold">{data.resource.name}</h1>
								{#if !data.resource.isCurrentlySpawned}
									<span
										class="inline-flex items-center rounded-full bg-red-900 px-3 py-1 text-sm font-medium text-red-200"
									>
										Despawned
									</span>
								{:else}
									<span
										class="inline-flex items-center rounded-full bg-green-900 px-3 py-1 text-sm font-medium text-green-200"
									>
										Currently Spawned
									</span>
								{/if}
							</div>
						</div>
						{#if data.resource.stats?.overallQuality}
							<div
								class="rounded-full px-3 py-1 text-sm font-semibold
							{data.resource.stats.overallQuality > 900
									? 'bg-green-900 text-green-200'
									: data.resource.stats.overallQuality > 700
										? 'bg-yellow-900 text-yellow-200'
										: 'bg-blue-900 text-blue-200'}"
							>
								Quality: {data.resource.stats.overallQuality}
							</div>
						{/if}
					</div>

					<div class="mt-2 text-sm text-slate-400">
						ID: {data.resource.id}
					</div>

					<div class="mt-4 grid grid-cols-2 gap-4">
						<div>
							<div class="text-sm font-medium text-slate-400">Class</div>
							<div class="text-lg">{data.resource.className}</div>
						</div>
						<div>
							<div class="text-sm font-medium text-slate-400">Type</div>
							<div class="text-lg">{data.resource.type || 'Unknown'}</div>
						</div>
						<div>
							<div class="text-sm font-medium text-slate-400">Added</div>
							<div class="text-lg">{new Date(data.resource.enterDate).toLocaleDateString()}</div>
						</div>
						{#if data.resource.despawnDate}
							<div>
								<div class="text-sm font-medium text-slate-400">Despawned</div>
								<div class="text-lg">
									{new Date(data.resource.despawnDate).toLocaleDateString()}
								</div>
							</div>
						{/if}
						{#if data.resource.stats?.bestUses}
							<div>
								<div class="text-sm font-medium text-slate-400">Best Uses</div>
								<div class="text-lg">{data.resource.stats.bestUses.join(', ')}</div>
							</div>
						{/if}
					</div>

					<!-- Resource attributes -->
					<div class="mt-6">
						<h2 class="mb-4 text-xl font-semibold">Attributes</h2>
						<div class="grid grid-cols-2 gap-4 md:grid-cols-3">
							{#each Object.entries(data.resource.attributes) as [attr, value]}
								<div>
									<div class="text-sm font-medium text-slate-400">
										{attributeLabels[attr] || attr.toUpperCase()}
									</div>
									<div class="text-lg">
										<div class="h-2.5 w-full rounded-full bg-slate-700">
											<div
												class="h-2.5 rounded-full bg-blue-500"
												style="width: {value / 10}%"
											></div>
										</div>
										<span class="mt-1 inline-block text-sm">{value}</span>
									</div>
								</div>
							{/each}
						</div>
					</div>
				</div>

				<!-- Planet Distribution -->
				<div class="mt-6 rounded-lg border border-slate-700 bg-slate-800 p-6">
					<h2 class="mb-4 text-xl font-semibold">Planet Distribution</h2>

					{#if activePlanets.length > 0}
						<div class="grid grid-cols-2 gap-4 md:grid-cols-3">
							{#each activePlanets as { planet, concentration, formattedName }}
								<div>
									<div class="text-sm font-medium text-slate-400">
										{formattedName}
									</div>
									<div class="text-lg">
										<div class="h-2.5 w-full rounded-full bg-slate-700">
											<div
												class="h-2.5 rounded-full bg-green-500"
												style="width: {concentration}%"
											></div>
										</div>
										<span class="mt-1 inline-block text-sm">{concentration}%</span>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<p class="text-slate-400">No spawn data available</p>
					{/if}
				</div>
			</div>

			<!-- Sidebar with related resources -->
			<div>
				<div class="rounded-lg border border-slate-700 bg-slate-800 p-6">
					<h2 class="mb-4 text-xl font-semibold">Related Resources</h2>

					{#if data.relatedResources && data.relatedResources.length > 0}
						<div class="space-y-4">
							{#each data.relatedResources as resource}
								<a
									href="/resources/{resource.id}"
									class="block rounded-lg border border-slate-600 bg-slate-700 p-4 transition hover:bg-slate-600"
								>
									<div class="flex justify-between">
										<div class="font-medium">{resource.name}</div>
										{#if resource.stats?.overallQuality}
											<div
												class="text-sm
												{resource.stats.overallQuality > 900
													? 'text-green-400'
													: resource.stats.overallQuality > 700
														? 'text-yellow-400'
														: 'text-slate-400'}"
											>
												{resource.stats.overallQuality}
											</div>
										{/if}
									</div>
									<div class="mt-1 text-sm text-slate-400">
										Added: {new Date(resource.enterDate).toLocaleDateString()}
									</div>
									<div class="mt-2 flex flex-wrap gap-2">
										{#each Object.entries(resource.attributes).slice(0, 4) as [attr, value]}
											<div class="rounded bg-slate-600 px-2 py-1 text-xs">
												{attr}: {value}
											</div>
										{/each}
									</div>
								</a>
							{/each}
						</div>
					{:else}
						<p class="text-slate-400">No related resources found</p>
					{/if}
				</div>

				<div class="mt-6 rounded-lg border border-slate-700 bg-slate-800 p-6">
					<h2 class="mb-4 text-xl font-semibold">Class Path</h2>

					{#if data.resource.classPath && data.resource.classPath.length > 0}
						<div class="space-y-2">
							{#each data.resource.classPath as className}
								<div
									class="mr-2 mb-2 inline-block rounded-full bg-blue-900 px-3 py-1 text-sm text-blue-200"
								>
									{className}
								</div>
							{/each}
						</div>
					{:else}
						<p class="text-slate-400">No class path information available</p>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>
