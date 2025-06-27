<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import Card from '$lib/components/Card.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import SimpleTable from '$lib/components/SimpleTable.svelte';
	import type { Schematic, SchematicComponent, SchematicResource } from '$lib/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Cast data to include schematic property - this is guaranteed by the server loader
	const pageData = data as PageData & { schematic: Schematic };
	const schematic = pageData.schematic;

	// Determine back navigation based on URL parameter or referrer
	let backUrl = $state('/schematics');
	let backText = $state('Back to Schematics');

	// Check for explicit source parameter or use referrer as fallback
	$effect(() => {
		if (browser) {
			// First check if there's an explicit 'from' parameter in the URL
			const fromParam = $page.url.searchParams.get('from');

			if (fromParam === 'inventory') {
				backUrl = '/inventory';
				backText = 'Back to Inventory';
			} else if (fromParam === 'schematics') {
				backUrl = '/schematics';
				backText = 'Back to Schematics';
			} else {
				// Fallback to referrer detection only on first load
				if (document.referrer) {
					const referrerUrl = new URL(document.referrer);

					if (referrerUrl.pathname === '/inventory') {
						backUrl = '/inventory';
						backText = 'Back to Inventory';
					} else {
						backUrl = '/schematics';
						backText = 'Back to Schematics';
					}
				}
			}
		}
	});

	// Table column definitions
	const componentColumns = [
		{ key: 'name', label: 'Component' },
		{ key: 'amount', label: 'Amount' },
		{ key: 'units', label: 'Units' }
	];

	const resourceColumns = [
		{ key: 'name', label: 'Resource' },
		{ key: 'amount', label: 'Amount' },
		{ key: 'units', label: 'Units' },
		{ key: 'classes', label: 'Classes' }
	];
</script>

<svelte:head>
	<title>SWG Shipwright - {schematic.name}</title>
</svelte:head>

<PageLayout maxWidth="4xl">
	<PageHeader title={schematic.name} subtitle="Schematic Details" backLink={backUrl} {backText} />

	<!-- Basic Information Card -->
	<Card
		title="Basic Information"
		icon="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
		class="mb-6"
	>
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
			<div class="rounded-lg bg-slate-700 p-4">
				<h3 class="mb-1 text-sm font-medium text-slate-300">Schematic ID</h3>
				<p class="font-mono text-sm text-white">{schematic.id}</p>
			</div>
			<div class="rounded-lg bg-slate-700 p-4">
				<h3 class="mb-1 text-sm font-medium text-slate-300">Category</h3>
				<p class="text-white">{schematic.category}</p>
			</div>
			<div class="rounded-lg bg-slate-700 p-4">
				<h3 class="mb-1 text-sm font-medium text-slate-300">Profession</h3>
				<p class="text-white">{schematic.profession}</p>
			</div>
			<div class="rounded-lg bg-slate-700 p-4">
				<h3 class="mb-1 text-sm font-medium text-slate-300">Complexity</h3>
				<p class="text-white">
					<span class="inline-flex items-center">
						{schematic.complexity}
						{#if schematic.complexity >= 20}
							<span class="ml-2 text-xs text-red-400">(Master)</span>
						{:else if schematic.complexity >= 15}
							<span class="ml-2 text-xs text-orange-400">(Advanced)</span>
						{:else if schematic.complexity >= 10}
							<span class="ml-2 text-xs text-yellow-400">(Intermediate)</span>
						{:else}
							<span class="ml-2 text-xs text-green-400">(Novice)</span>
						{/if}
					</span>
				</p>
			</div>
			<div class="rounded-lg bg-slate-700 p-4">
				<h3 class="mb-1 text-sm font-medium text-slate-300">Datapad</h3>
				<p class="text-white">{schematic.datapad}</p>
			</div>
			<div class="rounded-lg bg-slate-700 p-4">
				<h3 class="mb-1 text-sm font-medium text-slate-300">Full Name</h3>
				<p class="break-words text-white">{schematic.name}</p>
			</div>
		</div>
	</Card>

	<!-- Components Section -->
	<Card
		title="Required Components"
		icon="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
		class="mb-6"
	>
		<SimpleTable
			columns={componentColumns}
			items={schematic.components || []}
			emptyMessage="No sub-components required"
		>
			{#snippet renderCell(
				item: SchematicComponent,
				column: { key: string; label: string },
				i: number
			)}
				{#if column.key === 'name'}
					{item.name}
				{:else if column.key === 'amount'}
					{item.amount}
				{:else if column.key === 'units'}
					{item.units}
				{:else}
					-
				{/if}
			{/snippet}
		</SimpleTable>
	</Card>

	<!-- Resources Section -->
	<Card
		title="Required Resources"
		icon="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
		class="mb-6"
	>
		<SimpleTable
			columns={resourceColumns}
			items={schematic.resources || []}
			emptyMessage="Resource data not yet available"
		>
			{#snippet renderCell(
				item: SchematicResource,
				column: { key: string; label: string },
				i: number
			)}
				{#if column.key === 'name'}
					{item.name}
				{:else if column.key === 'amount'}
					{item.amount}
				{:else if column.key === 'units'}
					{item.units}
				{:else if column.key === 'classes'}
					{#if item.classes && item.classes.length > 0}
						<div class="flex flex-wrap gap-1">
							{#each item.classes as cls}
								<span
									class="inline-flex items-center rounded bg-purple-500/20 px-2 py-1 text-xs text-purple-300"
								>
									{typeof cls === 'string' ? cls : cls.displayName || cls.code}
								</span>
							{/each}
						</div>
					{:else}
						-
					{/if}
				{:else}
					-
				{/if}
			{/snippet}
		</SimpleTable>
	</Card>

	<!-- Footer -->
	<div class="mt-8 text-center text-xs text-slate-500">
		Data sourced from SWGAide schematics database
	</div>
</PageLayout>
