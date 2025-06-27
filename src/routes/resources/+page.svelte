<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import type { Resource } from '$lib/types';
	import { getPlanetInfo } from '$lib/types';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import DataTable from '$lib/components/DataTable.svelte';
	import Alert from '$lib/components/Alert.svelte';
	import Loading from '$lib/components/Loading.svelte';

	let { data }: { data: PageData } = $props();

	// Initialize from server-rendered data
	let resources = $state(data.resources as Resource[]);
	let className = $state(data.filters.className);
	let searchTerm = $state(data.filters.searchTerm);
	let spawnStatus = $state('all'); // 'all', 'active', 'despawned'
	let isLoading = $state(false);
	let lastUpdate = $state('');
	const resourceClasses = [
		'Aluminum',
		'Copper',
		'Iron',
		'Steel',
		'Crystalline Gemstone',
		'Amorphous Gemstone',
		'Extrusive Ore',
		'Intrusive Ore',
		'Carbonate Ore',
		'Siliclastic Ore',
		'Sedimentary Ore',
		'Igneous Ore',
		'Inert Gas',
		'Reactive Gas',
		'Liquid Petro Fuel',
		'Solid Petro Fuel',
		'Liquid Petrochem Fuel',
		'Solid Petrochem Fuel',
		'Polymer',
		'Radioactive',
		'Water',
		'Oil',
		'Meat',
		'Hide',
		'Bones',
		'Wood',
		'Fruit',
		'Vegetable'
	];

	// Get the last update time for resources
	onMount(async () => {
		try {
			const response = await fetch('/api/resources/update-cache', { method: 'GET' });
			const data = await response.json();
			if (data.success && data.lastUpdate) {
				lastUpdate = new Date(data.lastUpdate).toLocaleString();
			}
		} catch (error) {
			console.error('Failed to get resources cache status:', error);
		}
	});

	// Search for resources
	async function searchResources() {
		isLoading = true;

		try {
			const params = new URLSearchParams();
			if (className) params.set('class', className);
			if (searchTerm) params.set('search', searchTerm);
			if (spawnStatus !== 'all') params.set('status', spawnStatus);

			const response = await fetch(`/api/resources?${params}`);
			const data = await response.json();

			if (data.success) {
				resources = data.resources;
			}
		} catch (error) {
			console.error('Failed to search resources:', error);
		} finally {
			isLoading = false;
		}
	}

	// Automatically search when filters change
	$effect(() => {
		// Watch all filter variables for changes
		searchTerm;
		className;
		spawnStatus;

		// Debounce the search to avoid too many requests
		const timeoutId = setTimeout(() => {
			searchResources();
		}, 300);

		return () => clearTimeout(timeoutId);
	});

	// Update the resources cache manually
	async function updateResourcesCache() {
		isLoading = true;

		try {
			const response = await fetch('/api/resources/update-cache', {
				method: 'POST'
			});

			const data = await response.json();

			if (data.success) {
				lastUpdate = new Date().toLocaleString();
				// Reload resources
				await searchResources();
			}
		} catch (error) {
			console.error('Failed to update resources cache:', error);
		} finally {
			isLoading = false;
		}
	}

	// Define columns for the DataTable
	const columns = [
		{ key: 'name', label: 'Name' },
		{ key: 'className', label: 'Class' },
		{ key: 'status', label: 'Spawn' },
		{ key: 'oq', label: 'OQ', class: 'hidden lg:table-cell' },
		{ key: 'cr', label: 'CR', class: 'hidden xl:table-cell' },
		{ key: 'cd', label: 'CD', class: 'hidden xl:table-cell' },
		{ key: 'dr', label: 'DR', class: 'hidden xl:table-cell' },
		{ key: 'fl', label: 'FL', class: 'hidden xl:table-cell' },
		{ key: 'hr', label: 'HR', class: 'hidden xl:table-cell' },
		{ key: 'ma', label: 'MA', class: 'hidden xl:table-cell' },
		{ key: 'pe', label: 'PE', class: 'hidden xl:table-cell' },
		{ key: 'sr', label: 'SR', class: 'hidden lg:table-cell' },
		{ key: 'ut', label: 'UT', class: 'hidden lg:table-cell' },
		{ key: 'planets', label: 'Planets', class: 'text-right' },
		{ key: 'dateAdded', label: 'Added', class: 'hidden md:table-cell' }
	];
</script>

<!-- Page Header -->
<div class="mb-6 rounded-t-lg border-b border-slate-700/50 bg-slate-800/50 px-2 py-2.5">
	<h1 class="text-lg font-semibold text-white">Current Resource Spawns</h1>
	<p class="mt-0.5 text-sm text-slate-400">
		Browse and filter active resource spawns across all planets
	</p>
</div>

<PageLayout maxWidth="full" className="px-2">
	<!-- Search and filters -->
	<Card className="mb-6">
		<!-- Filter Header -->
		<div class="mb-4">
			<h2 class="text-lg font-semibold text-white">🔍 Filters</h2>
		</div>

		<!-- Filter Controls -->
		<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
			<div>
				<Input
					label="Search Resources"
					placeholder="Enter resource name..."
					bind:value={searchTerm}
				/>
			</div>
			<div>
				<label for="className" class="mb-1 block text-sm font-medium text-slate-300">
					Filter by Class
				</label>
				<select
					id="className"
					bind:value={className}
					class="w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none"
				>
					<option value="">All Classes</option>
					{#each resourceClasses as class_}
						<option value={class_}>{class_}</option>
					{/each}
				</select>
			</div>
			<div>
				<label for="spawnStatus" class="mb-1 block text-sm font-medium text-slate-300">
					Spawn Status
				</label>
				<select
					id="spawnStatus"
					bind:value={spawnStatus}
					class="w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none"
				>
					<option value="all">All Resources</option>
					<option value="active">Currently Spawned</option>
					<option value="despawned">Despawned</option>
				</select>
			</div>
		</div>
	</Card>

	<!-- Content -->
	{#if isLoading}
		<Loading />
	{:else}
		<!-- Resources Table using DataTable -->
		<DataTable
			mode="table"
			title="Resources"
			total={resources.length}
			items={resources}
			emptyMessage="No resources found"
			emptySubMessage="Try adjusting your filters or refreshing the resource data."
			{columns}
		>
			{#snippet headerExtension()}
				<Button
					variant="secondary"
					{isLoading}
					onclick={updateResourcesCache}
					loadingText="..."
					className="h-8 w-8 p-1 text-base"
					title="Update Resources"
				>
					🔄
				</Button>
				{#if lastUpdate}
					<div class="text-sm text-slate-400">
						Last updated: {lastUpdate}
					</div>
				{/if}
			{/snippet}
			{#snippet renderCell(resource: Resource, column: { key: string; label: string }, i: number)}
				{#if column.key === 'name'}
					<a
						href="/resources/{resource.id}"
						class="text-base font-medium text-blue-400 hover:text-blue-300 hover:underline"
					>
						{resource.name}
					</a>
				{:else if column.key === 'className'}
					<span class="text-base text-slate-300">{resource.className}</span>
				{:else if column.key === 'status'}
					{#if resource.isCurrentlySpawned}
						<span
							class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-900/30 text-green-300"
							title="Currently spawned"
						>
							✓
						</span>
					{:else}
						<span
							class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-900/30 text-red-300"
							title="Inactive/Despawned"
						>
							✕
						</span>
					{/if}
				{:else if ['oq', 'cr', 'cd', 'dr', 'fl', 'hr', 'ma', 'pe', 'sr', 'ut'].includes(column.key)}
					{@const statValue = resource.attributes?.[column.key as keyof typeof resource.attributes]}
					{#if statValue !== undefined && statValue !== null}
						<span
							class="text-base font-medium {statValue > 900
								? 'text-green-400'
								: statValue > 700
									? 'text-yellow-400'
									: statValue > 500
										? 'text-blue-400'
										: 'text-slate-400'}"
						>
							{statValue}
						</span>
					{:else}
						<span class="text-base text-slate-500">-</span>
					{/if}
				{:else if column.key === 'planets'}
					{@const activePlanets = Object.keys(resource.planetDistribution).filter(
						(p) => resource.planetDistribution[p] > 0
					)}
					{#if activePlanets.length > 0}
						<div class="flex flex-wrap justify-end gap-1">
							{#each activePlanets as planet}
								{@const planetInfo = getPlanetInfo(planet)}
								<span
									class="inline-flex h-5 w-5 cursor-default items-center justify-center rounded-full font-mono text-xs font-bold {planetInfo.color} {planetInfo.bg} border border-current/20"
									title="{planetInfo.name}: {resource.planetDistribution[planet]}%"
								>
									{planetInfo.letter}
								</span>
							{/each}
						</div>
					{:else}
						<span class="text-base text-slate-500">-</span>
					{/if}
				{:else if column.key === 'dateAdded'}
					<span class="text-base text-slate-300"
						>{new Date(resource.enterDate).toLocaleDateString('en-US', {
							month: 'numeric',
							day: 'numeric',
							year: '2-digit'
						})}</span
					>
				{/if}
			{/snippet}
		</DataTable>
	{/if}
</PageLayout>
