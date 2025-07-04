<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import type { PageData } from './$types.js';
	import type { Schematic } from '$lib/types.js';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Input from '$lib/components/Input.svelte';
	import DataTable from '$lib/components/DataTable.svelte';
	import FilterSection from '$lib/components/FilterSection.svelte';

	let { data }: { data: PageData } = $props();

	// State for search and filtering - use server-provided data
	let searchTerm = $state(data.filters?.searchTerm || '');
	let category = $state(data.filters?.category || '');

	// Available categories (you might want to fetch this dynamically)
	const schematicCategories = [
		'Armor',
		'Booster',
		'Capacitor',
		'Droid Interface',
		'Engine',
		'Reactor',
		'Shield',
		'Weapon'
	];

	// Apply filters by navigating to new URL
	function applyFilters() {
		const url = new URL($page.url);

		if (searchTerm) {
			url.searchParams.set('search', searchTerm);
		} else {
			url.searchParams.delete('search');
		}

		if (category) {
			url.searchParams.set('category', category);
		} else {
			url.searchParams.delete('category');
		}

		// Reset to page 1 when filters change
		url.searchParams.delete('page');

		goto(url.toString());
	}

	// Pagination
	function goToPage(pageNum: number) {
		const url = new URL($page.url);
		url.searchParams.set('page', pageNum.toString());
		goto(url.toString());
	}

	// Toggle favorite status
	async function toggleFavorite(schematicId: string, event: Event) {
		event.stopPropagation(); // Prevent row click when clicking star

		try {
			const response = await fetch(`/api/schematics/${schematicId}/favorite`, {
				method: 'POST'
			});

			if (response.ok) {
				// Reload the page data to reflect the change
				// Since we're using server-side pagination, we need a full reload
				goto($page.url.toString(), { invalidateAll: true });
			}
		} catch (error) {
			console.error('Failed to toggle favorite:', error);
		}
	}
</script>

<svelte:head>
	<title>SWG Shipwright - Schematics Browser</title>
</svelte:head>

<PageLayout maxWidth="6xl">
	<PageHeader
		emoji="📋"
		title="Schematics Browser"
		subtitle="Browse all available starship component schematics"
		centered
	/>

	<!-- Search and Filter Controls -->
	<FilterSection>
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			<div>
				<label for="search" class="mb-2 block text-sm font-medium text-slate-300">
					Search Schematics
				</label>
				<Input
					id="search"
					placeholder="Search by schematic name..."
					bind:value={searchTerm}
					onkeydown={(e: KeyboardEvent) => e.key === 'Enter' && applyFilters()}
				/>
			</div>

			<div>
				<label for="category" class="mb-2 block text-sm font-medium text-slate-300">
					Category
				</label>
				<select
					id="category"
					bind:value={category}
					class="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
				>
					<option value="">All Categories</option>
					{#each schematicCategories as cat}
						<option value={cat}>{cat}</option>
					{/each}
				</select>
			</div>
		</div>

		<div class="mt-4 flex justify-center">
			<button
				onclick={applyFilters}
				class="rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 focus:outline-none"
			>
				Apply Filters
			</button>
		</div>
	</FilterSection>

	<!-- Schematics Table -->
	<DataTable
		mode="table"
		title="Schematics"
		total={data.total}
		items={data.schematics}
		pagination={data.pagination}
		onPageChange={goToPage}
		columns={[
			{ key: 'favorite', label: '⭐' },
			{ key: 'name', label: 'Schematic Name' },
			{ key: 'id', label: 'ID' },
			{ key: 'category', label: 'Category' }
		]}
		emptyMessage={data.filters.searchTerm || data.filters.category
			? 'No schematics found matching your search.'
			: 'No schematics available.'}
		emptySubMessage={data.filters.searchTerm || data.filters.category
			? 'Try adjusting your filters to see more schematics.'
			: 'No schematic data available.'}
	>
		>
		{#snippet renderCell(schematic: Schematic, column: { key: string; label: string }, i: number)}
			{#if column.key === 'favorite'}
				<button
					class="text-lg transition-colors hover:scale-110 {schematic.is_favorite
						? 'text-yellow-400'
						: 'text-slate-500 hover:text-yellow-300'}"
					onclick={(event) => toggleFavorite(schematic.id, event)}
					title={schematic.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
				>
					{schematic.is_favorite ? '⭐' : '☆'}
				</button>
			{:else if column.key === 'name'}
				<a
					href="/schematics/{schematic.id}?from=schematics"
					class="font-medium text-white transition-colors hover:text-yellow-400"
				>
					{schematic.name}
				</a>
			{:else if column.key === 'id'}
				{schematic.id}
			{:else if column.key === 'category'}
				{schematic.category}
			{:else}
				{schematic[column.key as keyof Schematic]}
			{/if}
		{/snippet}
	</DataTable>

	{#if data.schematics.length > 0}
		<div class="mt-6 text-center text-xs text-slate-500">
			Data sourced from SWGAide schematics database
		</div>
	{/if}
</PageLayout>
