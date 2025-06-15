<script lang="ts">
	import { PLANETS } from '$lib/types';
	import type { PageData } from './$types';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Card from '$lib/components/Card.svelte';
	import Section from '$lib/components/Section.svelte';

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
		er: 'Energy Resistance'
	};

	// Format the planet distribution to show only planets with spawns
	const activePlanets = $derived(
		Object.entries(data.resource.planetDistribution)
			.filter(([_, value]) => value > 0)
			.map(([planet, concentration]) => ({
				planet,
				concentration,
				formattedName: planet.charAt(0).toUpperCase() + planet.slice(1).replace('_', ' ')
			}))
			.sort((a, b) => b.concentration - a.concentration)
	);
</script>

<PageLayout>
	<PageHeader
		title={data.resource.name}
		subtitle="Resource Details"
		backLink="/resources"
		backText="Back to Resources"
	>
		<div class="flex items-center gap-3">
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
	</PageHeader>

	<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
		<!-- Main resource information -->
		<div class="lg:col-span-2">
			<Section title="Resource Information">
				<Card>
					<div class="mb-6 border-b border-slate-700 pb-2 text-sm text-slate-500">
						ID: {data.resource.id}
					</div>

					<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
						<div class="space-y-1">
							<div class="text-sm font-medium text-slate-400">Class</div>
							<div class="text-lg text-slate-200">{data.resource.className}</div>
						</div>
						<div class="space-y-1">
							<div class="text-sm font-medium text-slate-400">Type</div>
							<div class="text-lg text-slate-200">{data.resource.type || 'Unknown'}</div>
						</div>
						<div class="space-y-1">
							<div class="text-sm font-medium text-slate-400">Added</div>
							<div class="text-lg text-slate-200">
								{new Date(data.resource.enterDate).toLocaleDateString()}
							</div>
						</div>
						{#if data.resource.despawnDate}
							<div class="space-y-1">
								<div class="text-sm font-medium text-slate-400">Despawned</div>
								<div class="text-lg text-red-400">
									{new Date(data.resource.despawnDate).toLocaleDateString()}
								</div>
							</div>
						{/if}
						{#if data.resource.stats?.bestUses}
							<div class="col-span-full space-y-1">
								<div class="text-sm font-medium text-slate-400">Best Uses</div>
								<div class="flex flex-wrap gap-2">
									{#each data.resource.stats.bestUses as use}
										<span
											class="inline-flex items-center rounded-full bg-blue-900 px-3 py-1 text-sm text-blue-200"
										>
											{use}
										</span>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				</Card>
			</Section>

			<Section title="Attributes" class="mt-6">
				<Card>
					<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
						{#each Object.entries(data.resource.attributes) as [attr, value]}
							<div class="space-y-2">
								<div class="flex items-center justify-between">
									<div class="text-sm font-medium text-slate-300">
										{attributeLabels[attr] || attr.toUpperCase()}
									</div>
									<div class="text-sm font-bold text-blue-400">{value}</div>
								</div>
								<div class="h-3 w-full rounded-full bg-slate-700">
									<div
										class="h-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-300"
										style="width: {value / 10}%"
									></div>
								</div>
							</div>
						{/each}
					</div>
				</Card>
			</Section>

			<Section title="Planet Distribution" class="mt-6">
				<Card>
					{#if activePlanets.length > 0}
						<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
							{#each activePlanets as { planet, concentration, formattedName }}
								<div class="space-y-2">
									<div class="flex items-center justify-between">
										<div class="text-sm font-medium text-slate-300">
											{formattedName}
										</div>
										<div class="text-sm font-bold text-green-400">{concentration}%</div>
									</div>
									<div class="h-3 w-full rounded-full bg-slate-700">
										<div
											class="h-3 rounded-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-300"
											style="width: {concentration}%"
										></div>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<div class="py-8 text-center">
							<div class="text-sm text-slate-400">No spawn data available</div>
						</div>
					{/if}
				</Card>
			</Section>
		</div>

		<!-- Sidebar with related resources -->
		<div>
			<Section title="Related Resources">
				<Card>
					{#if data.relatedResources && data.relatedResources.length > 0}
						<div class="space-y-3">
							{#each data.relatedResources as resource}
								<a
									href="/resources/{resource.id}"
									class="block rounded-lg border border-slate-600 bg-slate-700/50 p-4 transition-all hover:border-slate-500 hover:bg-slate-600/50"
								>
									<div class="mb-2 flex items-start justify-between">
										<div class="truncate pr-2 font-medium text-slate-200">{resource.name}</div>
										{#if resource.stats?.overallQuality}
											<div
												class="rounded px-2 py-1 text-sm font-bold
											{resource.stats.overallQuality > 900
													? 'bg-green-900/50 text-green-300'
													: resource.stats.overallQuality > 700
														? 'bg-yellow-900/50 text-yellow-300'
														: 'bg-blue-900/50 text-blue-300'}"
											>
												{resource.stats.overallQuality}
											</div>
										{/if}
									</div>
									<div class="mb-3 text-sm text-slate-400">
										Added: {new Date(resource.enterDate).toLocaleDateString()}
									</div>
									<div class="flex flex-wrap gap-1">
										{#each Object.entries(resource.attributes).slice(0, 4) as [attr, value]}
											<div class="rounded bg-slate-600/70 px-2 py-1 text-xs text-slate-300">
												{attr}: {value}
											</div>
										{/each}
									</div>
								</a>
							{/each}
						</div>
					{:else}
						<div class="py-8 text-center">
							<div class="text-sm text-slate-400">No related resources found</div>
						</div>
					{/if}
				</Card>
			</Section>

			<Section title="Class Path" class="mt-6">
				<Card>
					{#if data.resource.classPath && data.resource.classPath.length > 0}
						<div class="flex flex-wrap gap-2">
							{#each data.resource.classPath as className}
								<div
									class="inline-block rounded-full border border-blue-700 bg-blue-900/50 px-3 py-1 text-sm text-blue-200"
								>
									{className}
								</div>
							{/each}
						</div>
					{:else}
						<div class="py-8 text-center">
							<div class="text-sm text-slate-400">No class path information available</div>
						</div>
					{/if}
				</Card>
			</Section>
		</div>
	</div>
</PageLayout>
