<script lang="ts">
	import type { PageData } from './$types.js';
	import type { Schematic } from '$lib/types.js';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Input from '$lib/components/Input.svelte';
	import DataTable from '$lib/components/DataTable.svelte';

	let { data }: { data: PageData } = $props();

	// State for search and filtering
	let searchTerm = $state('');
	let filteredSchematics = $state<Schematic[]>([]);

	// Create a reactive copy of schematics that we can modify
	let schematics = $state<Schematic[]>(data.schematics || []);

	// Update schematics when data changes
	$effect(() => {
		schematics = data.schematics || [];
	});

	// Filter and sort schematics - favorites first, then alphabetically
	$effect(() => {
		let filtered = schematics;

		// Apply search filter
		if (searchTerm.trim()) {
			const search = searchTerm.toLowerCase();
			filtered = filtered.filter((schematic) => schematic.name?.toLowerCase().includes(search));
		}

		// Sort: favorites first, then alphabetically by name
		filtered.sort((a, b) => {
			// First sort by favorite status (favorites first)
			if (a.is_favorite && !b.is_favorite) return -1;
			if (!a.is_favorite && b.is_favorite) return 1;

			// Then sort alphabetically by name
			return (a.name || '').localeCompare(b.name || '');
		});

		filteredSchematics = filtered;
	});

	// Toggle favorite status
	async function toggleFavorite(schematicId: string, event: Event) {
		event.stopPropagation(); // Prevent row click when clicking star

		try {
			const response = await fetch('/api/schematics/favorites', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ schematicId })
			});

			if (response.ok) {
				const result = await response.json();

				// Update the reactive schematics array
				const schematicIndex = schematics.findIndex((s) => s.id === schematicId);
				if (schematicIndex !== -1) {
					schematics[schematicIndex].is_favorite = result.isFavorited;

					// Trigger reactivity by reassigning the array
					schematics = [...schematics];
				}
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

	<!-- Search Controls -->
	<div class="mb-6 flex justify-center">
		<div class="w-full max-w-md">
			<Input
				label="Search Schematics"
				placeholder="Search by schematic name..."
				bind:value={searchTerm}
			/>
		</div>
	</div>

	<!-- Schematics Table -->
	<DataTable
		mode="table"
		title="Schematics"
		total={data.schematics?.length || 0}
		items={filteredSchematics}
		columns={[
			{ key: 'favorite', label: '⭐' },
			{ key: 'name', label: 'Schematic Name' },
			{ key: 'id', label: 'ID' },
			{ key: 'category', label: 'Category' }
		]}
		emptyMessage={searchTerm
			? 'No schematics found matching your search.'
			: 'No schematics available.'}
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

	{#if filteredSchematics.length > 0}
		<div class="mt-6 text-center text-xs text-slate-500">
			Data sourced from SWGAide schematics database
		</div>
	{/if}
</PageLayout>
