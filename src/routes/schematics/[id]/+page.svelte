<script lang="ts">
	import type { PageData } from './$types.js';
	import type { Schematic } from '$lib/types.js';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';

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
</script>

<svelte:head>
	<title>SWG Shipwright - {schematic.name}</title>
</svelte:head>

<div class="h-full">
	<div class="w-full px-4 py-8">
		<!-- Header -->
		<header class="mb-8">
			<div class="mb-4">
				<a
					href={backUrl}
					class="inline-flex items-center text-sm text-slate-400 transition-colors hover:text-slate-300"
				>
					<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15 19l-7-7 7-7"
						></path>
					</svg>
					{backText}
				</a>
			</div>
			<h1 class="text-3xl font-bold text-yellow-400">{schematic.name}</h1>
			<p class="mt-2 text-slate-400">Schematic Details</p>
		</header>

		<!-- Schematic Details -->
		<div class="mx-auto max-w-4xl">
			<!-- Basic Information Card -->
			<div class="mb-6 rounded-lg border border-slate-700 bg-slate-800 p-6">
				<h2 class="mb-4 flex items-center text-xl font-semibold text-white">
					<svg
						class="mr-2 h-5 w-5 text-blue-400"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						></path>
					</svg>
					Basic Information
				</h2>
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
			</div>

			<!-- Ingredients Section -->
			{#if schematic.ingredients && schematic.ingredients.length > 0}
				<div class="mb-6 rounded-lg border border-slate-700 bg-slate-800 p-6">
					<h2 class="mb-4 flex items-center text-xl font-semibold text-white">
						<svg
							class="mr-2 h-5 w-5 text-green-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
							></path>
						</svg>
						Required Ingredients
					</h2>
					<div class="overflow-x-auto">
						<table class="w-full">
							<thead class="bg-slate-700">
								<tr>
									<th
										class="px-4 py-3 text-left text-xs font-medium tracking-wider text-slate-300 uppercase"
										>Ingredient</th
									>
									<th
										class="px-4 py-3 text-left text-xs font-medium tracking-wider text-slate-300 uppercase"
										>Amount</th
									>
									<th
										class="px-4 py-3 text-left text-xs font-medium tracking-wider text-slate-300 uppercase"
										>Units</th
									>
								</tr>
							</thead>
							<tbody class="divide-y divide-slate-700">
								{#each schematic.ingredients as ingredient}
									<tr class="transition-colors hover:bg-slate-700/50">
										<td class="px-4 py-3 text-sm text-white">{ingredient.name}</td>
										<td class="px-4 py-3 text-sm text-slate-300">{ingredient.amount}</td>
										<td class="px-4 py-3 text-sm text-slate-300">{ingredient.units}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			{:else}
				<div class="mb-6 rounded-lg border border-slate-700 bg-slate-800 p-6">
					<h2 class="mb-4 flex items-center text-xl font-semibold text-white">
						<svg
							class="mr-2 h-5 w-5 text-green-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
							></path>
						</svg>
						Required Ingredients
					</h2>
					<div class="py-8 text-center text-slate-400">
						<p>Ingredient data not yet available</p>
						<p class="mt-1 text-sm">This information will be populated in a future update</p>
					</div>
				</div>
			{/if}

			<!-- Resources Section -->
			{#if schematic.resources && schematic.resources.length > 0}
				<div class="mb-6 rounded-lg border border-slate-700 bg-slate-800 p-6">
					<h2 class="mb-4 flex items-center text-xl font-semibold text-white">
						<svg
							class="mr-2 h-5 w-5 text-purple-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
							></path>
						</svg>
						Required Resources
					</h2>
					<div class="overflow-x-auto">
						<table class="w-full">
							<thead class="bg-slate-700">
								<tr>
									<th
										class="px-4 py-3 text-left text-xs font-medium tracking-wider text-slate-300 uppercase"
										>Resource</th
									>
									<th
										class="px-4 py-3 text-left text-xs font-medium tracking-wider text-slate-300 uppercase"
										>Amount</th
									>
									<th
										class="px-4 py-3 text-left text-xs font-medium tracking-wider text-slate-300 uppercase"
										>Units</th
									>
									<th
										class="px-4 py-3 text-left text-xs font-medium tracking-wider text-slate-300 uppercase"
										>Classes</th
									>
								</tr>
							</thead>
							<tbody class="divide-y divide-slate-700">
								{#each schematic.resources as resource}
									<tr class="transition-colors hover:bg-slate-700/50">
										<td class="px-4 py-3 text-sm text-white">{resource.name}</td>
										<td class="px-4 py-3 text-sm text-slate-300">{resource.amount}</td>
										<td class="px-4 py-3 text-sm text-slate-300">{resource.units}</td>
										<td class="px-4 py-3 text-sm text-slate-300">
											{#if resource.classes && resource.classes.length > 0}
												<div class="flex flex-wrap gap-1">
													{#each resource.classes as resourceClass}
														<span
															class="inline-flex items-center rounded bg-purple-500/20 px-2 py-1 text-xs text-purple-300"
														>
															{resourceClass}
														</span>
													{/each}
												</div>
											{:else}
												<span class="text-slate-500">-</span>
											{/if}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			{:else}
				<div class="mb-6 rounded-lg border border-slate-700 bg-slate-800 p-6">
					<h2 class="mb-4 flex items-center text-xl font-semibold text-white">
						<svg
							class="mr-2 h-5 w-5 text-purple-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
							></path>
						</svg>
						Required Resources
					</h2>
					<div class="py-8 text-center text-slate-400">
						<p>Resource data not yet available</p>
						<p class="mt-1 text-sm">This information will be populated in a future update</p>
					</div>
				</div>
			{/if}

			<!-- Footer -->
			<div class="mt-8 text-center text-xs text-slate-500">
				Data sourced from SWGAide schematics database
			</div>
		</div>
	</div>
</div>
