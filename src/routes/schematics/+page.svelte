<script lang="ts">
	import type { PageData } from './$types.js';
	import type { Schematic } from '$lib/types.js';

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
</script>

<svelte:head>
	<title>SWG Shipwright - Schematics Browser</title>
</svelte:head>

<div class="h-full">
	<div class="w-full px-4 py-8">
		<header class="mb-8 text-center">
			<h1 class="mb-2 text-3xl font-bold text-yellow-400">Schematics Browser</h1>
			<p class="text-slate-400">Browse all available starship component schematics</p>
		</header>

		<!-- Search Controls -->
		<div class="mb-6 flex justify-center">
			<div class="w-full max-w-md">
				<label for="search" class="mb-2 block text-sm font-medium text-slate-300">
					Search Schematics
				</label>
				<input
					id="search"
					type="text"
					bind:value={searchTerm}
					placeholder="Search by schematic name..."
					class="w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
				/>
			</div>
		</div>

		<!-- Results Summary -->
		<div class="mb-4 text-center text-sm text-slate-400">
			Showing {filteredSchematics.length} of {data.schematics?.length || 0} schematics
		</div>

		<!-- Schematics Table -->
		<div class="flex justify-center">
			<div class="w-full max-w-4xl overflow-hidden rounded-lg border border-slate-700 bg-slate-800">
				<div class="overflow-x-auto">
					<table class="w-full">
						<thead class="bg-slate-700">
							<tr>
								<th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-300">
									Schematic Name
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-300">
									ID
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-300">
									Category
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-300">
									Profession
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-300">
									Complexity
								</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-slate-700">
							{#each filteredSchematics as schematic (schematic.id)}
								<tr class="hover:bg-slate-700/50 transition-colors">
									<td class="px-6 py-4 text-sm font-medium text-white">
										{schematic.name}
									</td>
									<td class="px-6 py-4 text-sm text-slate-300">
										{schematic.id}
									</td>
									<td class="px-6 py-4 text-sm text-slate-300">
										{schematic.category}
									</td>
									<td class="px-6 py-4 text-sm text-slate-300">
										{schematic.profession}
									</td>
									<td class="px-6 py-4 text-sm text-slate-300">
										{schematic.complexity}
									</td>
								</tr>
							{:else}
								<tr>
									<td colspan="5" class="px-6 py-8 text-center text-slate-400">
										{searchTerm ? 'No schematics found matching your search.' : 'No schematics available.'}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</div>

		{#if filteredSchematics.length > 0}
			<div class="mt-6 text-center text-xs text-slate-500">
				Data sourced from SWGAide schematics database
			</div>
		{/if}
	</div>
</div>
