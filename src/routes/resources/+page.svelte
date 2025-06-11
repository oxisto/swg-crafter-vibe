<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import type { Resource } from '$lib/types';
	import ResourceCard from '$lib/components/ResourceCard.svelte';

	let { data }: { data: PageData } = $props();

	// Initialize from server-rendered data
	let resources = $state(data.resources as Resource[]);
	let className = $state(data.filters.className);
	let searchTerm = $state(data.filters.searchTerm);
	let spawnStatus = $state('all'); // 'all', 'active', 'despawned'
	let isLoading = $state(false);
	let lastUpdate = $state('');
	let viewMode = $state('table'); // 'table' or 'grid'
	let resourceStats = $state({ total: 0, active: 0, despawned: 0 });
	let enhancedSearch = $state(false); // Toggle for SOAP API search
	let soapResults = $state<string[]>([]); // SOAP API search results

	// Resource classes for filtering (based on actual data)
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

		// Load resource statistics
		await updateResourceStats();
	});

	// Search for resources
	async function searchResources() {
		isLoading = true;
		soapResults = []; // Clear previous SOAP results

		try {
			// If enhanced search is enabled and we have a search term, use the enhanced endpoint
			if (enhancedSearch && searchTerm && searchTerm.length >= 2) {
				const enhancedParams = new URLSearchParams();
				enhancedParams.set('q', searchTerm);
				enhancedParams.set('soap', 'true');

				const enhancedResponse = await fetch(`/api/resources/search?${enhancedParams}`);
				const enhancedData = await enhancedResponse.json();

				if (enhancedData.success) {
					// Use local results filtered by other criteria
					let filteredResults = enhancedData.localResults;

					// Apply additional filters
					if (className) {
						filteredResults = filteredResults.filter(
							(resource: any) =>
								resource.className.toLowerCase().includes(className.toLowerCase()) ||
								(resource.classPath &&
									resource.classPath.some((path: string) =>
										path.toLowerCase().includes(className.toLowerCase())
									))
						);
					}

					if (spawnStatus === 'active') {
						filteredResults = filteredResults.filter(
							(resource: any) => resource.isCurrentlySpawned
						);
					} else if (spawnStatus === 'despawned') {
						filteredResults = filteredResults.filter(
							(resource: any) => !resource.isCurrentlySpawned
						);
					}

					resources = filteredResults;
					soapResults = enhancedData.soapResults || [];
				}
			} else {
				// Use regular search
				const params = new URLSearchParams();
				if (className) params.set('class', className);
				if (searchTerm) params.set('search', searchTerm);
				if (spawnStatus !== 'all') params.set('status', spawnStatus);

				const response = await fetch(`/api/resources?${params}`);
				const data = await response.json();

				if (data.success) {
					resources = data.resources;
				}
			}
		} catch (error) {
			console.error('Failed to search resources:', error);
		} finally {
			isLoading = false;
		}
	}

	// Get resource statistics
	async function updateResourceStats() {
		try {
			const [allResponse, activeResponse, despawnedResponse] = await Promise.all([
				fetch('/api/resources'),
				fetch('/api/resources?status=active'),
				fetch('/api/resources?status=despawned')
			]);

			const [allData, activeData, despawnedData] = await Promise.all([
				allResponse.json(),
				activeResponse.json(),
				despawnedResponse.json()
			]);

			resourceStats = {
				total: allData.resources?.length || 0,
				active: activeData.resources?.length || 0,
				despawned: despawnedData.resources?.length || 0
			};
		} catch (error) {
			console.error('Failed to get resource statistics:', error);
		}
	}
	// Automatically search when filters change
	$effect(() => {
		// Watch all filter variables for changes
		searchTerm;
		className;
		spawnStatus;
		enhancedSearch;

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
				// Reload resources and update statistics
				await Promise.all([searchResources(), updateResourceStats()]);
			}
		} catch (error) {
			console.error('Failed to update resources cache:', error);
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="container mx-auto p-4">
	<h1 class="mb-6 text-2xl font-bold">Current Resource Spawns</h1>

	<div class="mb-6 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
		<div class="flex flex-wrap items-end gap-4">
			<div class="flex-grow">
				<label
					for="searchTerm"
					class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
				>
					Search Resources
				</label>
				<input
					type="text"
					id="searchTerm"
					bind:value={searchTerm}
					placeholder="Enter resource name..."
					class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-400 dark:focus:ring-blue-400"
				/>
			</div>

			<div class="w-full md:w-auto">
				<label
					for="className"
					class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
				>
					Filter by Class
				</label>
				<select
					id="className"
					bind:value={className}
					class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-400"
				>
					<option value="">All Classes</option>
					{#each resourceClasses as class_}
						<option value={class_}>{class_}</option>
					{/each}
				</select>
			</div>

			<div class="w-full md:w-auto">
				<label
					for="spawnStatus"
					class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
				>
					Spawn Status
				</label>
				<select
					id="spawnStatus"
					bind:value={spawnStatus}
					class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-400"
				>
					<option value="all">All Resources</option>
					<option value="active">Currently Spawned</option>
					<option value="despawned">Despawned</option>
				</select>
			</div>

			<button
				onclick={searchResources}
				disabled={isLoading}
				class="rounded-md px-4 py-2 text-white disabled:opacity-50 {enhancedSearch
					? 'bg-purple-600 hover:bg-purple-700'
					: 'bg-blue-600 hover:bg-blue-700'}"
				title={enhancedSearch
					? 'Enhanced search includes SOAP API results'
					: 'Standard search of local database'}
			>
				{isLoading ? 'Searching...' : enhancedSearch ? 'Enhanced Search' : 'Search'}
			</button>

			<button
				onclick={updateResourcesCache}
				disabled={isLoading}
				class="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
				title="Download latest resources from SWGAide"
			>
				{isLoading ? 'Updating...' : 'Update Resources'}
			</button>
		</div>

		<!-- Enhanced Search Toggle -->
		<div class="mt-4 flex items-center">
			<label class="flex items-center">
				<input
					type="checkbox"
					bind:checked={enhancedSearch}
					class="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-blue-400"
				/>
				<span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
					Enhanced Search (includes historical resources via SOAP API)
				</span>
			</label>
		</div>

		{#if lastUpdate}
			<div class="mt-2 text-sm text-gray-500">
				Last updated: {lastUpdate}
			</div>
		{/if}
	</div>

	<!-- Resource Statistics -->
	{#if resourceStats.total > 0}
		<div class="mb-6 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
			<h2 class="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
				Resource Statistics
			</h2>
			<div class="grid grid-cols-3 gap-4 text-center">
				<div class="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
					<div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
						{resourceStats.total}
					</div>
					<div class="text-sm text-blue-800 dark:text-blue-300">Total Resources</div>
				</div>
				<div class="rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
					<div class="text-2xl font-bold text-green-600 dark:text-green-400">
						{resourceStats.active}
					</div>
					<div class="text-sm text-green-800 dark:text-green-300">Currently Spawned</div>
				</div>
				<div class="rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
					<div class="text-2xl font-bold text-red-600 dark:text-red-400">
						{resourceStats.despawned}
					</div>
					<div class="text-sm text-red-800 dark:text-red-300">Despawned</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- SOAP API Results (when enhanced search is enabled) -->
	{#if enhancedSearch && soapResults.length > 0}
		<div class="mb-6 rounded-lg bg-yellow-50 p-4 shadow dark:bg-yellow-900/20">
			<h2 class="mb-3 text-lg font-semibold text-yellow-800 dark:text-yellow-200">
				Historical Resources from SOAP API ({soapResults.length} found)
			</h2>
			<div class="text-sm text-yellow-700 dark:text-yellow-300">
				These resources were found in the SWGAide historical database but may not be currently
				spawned:
			</div>
			<div class="mt-2 space-y-1">
				{#each soapResults as soapResult}
					<div
						class="rounded bg-yellow-100 px-2 py-1 text-sm text-yellow-800 dark:bg-yellow-800/30 dark:text-yellow-200"
					>
						{soapResult}
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- View toggle -->
	<div class="mb-4 flex justify-end">
		<div class="inline-flex rounded-md shadow-sm">
			<button
				type="button"
				class="rounded-l-lg border border-gray-300 px-4 py-2 text-sm font-medium dark:border-gray-600 dark:text-white {viewMode ===
				'table'
					? 'bg-blue-600 text-white'
					: 'bg-white dark:bg-gray-800'}"
				onclick={() => (viewMode = 'table')}
			>
				Table View
			</button>
			<button
				type="button"
				class="rounded-r-lg border border-gray-300 px-4 py-2 text-sm font-medium dark:border-gray-600 dark:text-white {viewMode ===
				'grid'
					? 'bg-blue-600 text-white'
					: 'bg-white dark:bg-gray-800'}"
				onclick={() => (viewMode = 'grid')}
			>
				Grid View
			</button>
		</div>
	</div>

	<!-- Table view -->
	{#if viewMode === 'table'}
		<div class="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
			<div class="overflow-x-auto">
				<table class="min-w-full divide-y divide-gray-200">
					<thead class="bg-gray-50 dark:bg-gray-700">
						<tr>
							<th
								class="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-300"
								>Name</th
							>
							<th
								class="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-300"
								>Class</th
							>
							<th
								class="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-300"
								>Quality</th
							>
							<th
								class="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-300"
								>Planets</th
							>
							<th
								class="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-300"
								>Best Uses</th
							>
							<th
								class="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-300"
								>Added</th
							>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
						{#each resources as resource}
							<tr
								class="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
								onclick={() => (window.location.href = `/resources/${resource.id}`)}
							>
								<td class="px-4 py-2 whitespace-nowrap">
									<a
										href="/resources/{resource.id}"
										class="font-medium hover:text-blue-600 hover:underline">{resource.name}</a
									>
								</td>
								<td class="px-4 py-2 whitespace-nowrap">
									{resource.className}
								</td>
								<td class="px-4 py-2 whitespace-nowrap">
									{#if resource.stats?.overallQuality}
										<div
											class="font-medium
											{resource.stats.overallQuality > 900
												? 'text-green-600 dark:text-green-400'
												: resource.stats.overallQuality > 700
													? 'text-yellow-600 dark:text-yellow-400'
													: 'text-gray-600 dark:text-gray-400'}"
										>
											{resource.stats.overallQuality}
										</div>
									{:else}
										-
									{/if}
								</td>
								<td class="px-4 py-2">
									<div class="text-sm text-gray-900 dark:text-gray-100">
										{Object.keys(resource.planetDistribution)
											.filter((p) => resource.planetDistribution[p] > 0)
											.slice(0, 3)
											.join(', ')}
										{Object.keys(resource.planetDistribution).filter(
											(p) => resource.planetDistribution[p] > 0
										).length > 3
											? '...'
											: ''}
									</div>
								</td>
								<td class="px-4 py-2 whitespace-nowrap">
									{resource.stats?.bestUses ? resource.stats.bestUses.join(', ') : 'General Use'}
								</td>
								<td class="px-4 py-2 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
									{new Date(resource.enterDate).toLocaleDateString()}
								</td>
							</tr>
						{:else}
							<tr>
								<td colspan="6" class="px-4 py-4 text-center text-gray-500 dark:text-gray-400">
									{isLoading ? 'Loading resources...' : 'No resources found'}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			{#if resources.length > 0}
				<div class="bg-gray-50 px-4 py-3 text-sm text-gray-500 dark:bg-gray-700 dark:text-gray-300">
					Showing {resources.length} resources
				</div>
			{/if}
		</div>
	{:else}
		<!-- Grid view -->
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
			{#each resources as resource}
				<ResourceCard {resource} />
			{:else}
				<div class="col-span-full p-4 text-center text-gray-500 dark:text-gray-400">
					{isLoading ? 'Loading resources...' : 'No resources found'}
				</div>
			{/each}
		</div>
	{/if}
</div>
