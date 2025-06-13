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

	// Filter schematics based on search term
	$effect(() => {
		if (!searchTerm.trim()) {
			filteredSchematics = data.schematics || [];
		} else {
			const search = searchTerm.toLowerCase();
			filteredSchematics = (data.schematics || []).filter((schematic) =>
				schematic.name?.toLowerCase().includes(search)
			);
		}
	});

	// Columns for the data table
	const columns = [
		{ key: 'name', label: 'Schematic Name', sortable: true },
		{ key: 'id', label: 'ID', sortable: true },
		{ key: 'category', label: 'Category', sortable: true },
		{ key: 'profession', label: 'Profession', sortable: true },
		{ key: 'complexity', label: 'Complexity', sortable: true }
	];

	// Transform data for the table
	const tableData = $derived(
		filteredSchematics.map((schematic) => ({
			...schematic,
			raw: schematic
		}))
	);

	// Handle row click
	function handleRowClick(row: any) {
		window.location.href = `/schematics/${row.id}?from=schematics`;
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

	<!-- Results Summary -->
	<div class="mb-4 text-center text-sm text-slate-400">
		Showing {filteredSchematics.length} of {data.schematics?.length || 0} schematics
	</div>

	<!-- Schematics Table -->
	<DataTable
		data={tableData}
		{columns}
		onRowClick={handleRowClick}
		emptyMessage={searchTerm
			? 'No schematics found matching your search.'
			: 'No schematics available.'}
	>
		{#snippet cell(column, row)}
			{#if column.key === 'name'}
				<a
					href="/schematics/{row.id}?from=schematics"
					class="font-medium text-white transition-colors hover:text-yellow-400"
				>
					{row.name}
				</a>
			{:else}
				{row[column.key]}
			{/if}
		{/snippet}
	</DataTable>

	{#if filteredSchematics.length > 0}
		<div class="mt-6 text-center text-xs text-slate-500">
			Data sourced from SWGAide schematics database
		</div>
	{/if}
</PageLayout>
