<!--
 * Resource Filters Component
 * 
 * Reusable filtering controls for resource lists and selection.
 * Provides search, class selection, and spawn status filtering.
-->
<script lang="ts">
	import Input from '$lib/components/Input.svelte';
	import FilterSection from '$lib/components/FilterSection.svelte';

	let {
		searchTerm = $bindable(''),
		className = $bindable(''),
		spawnStatus = $bindable('all'),
		onApply,
		onClear,
		resourceClasses = [
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
			'Solid Petrochem Fuel'
		],
		showSpawnStatus = true,
		class: className_ = ''
	} = $props<{
		searchTerm?: string;
		className?: string;
		spawnStatus?: string;
		onApply: () => void;
		onClear: () => void;
		resourceClasses?: string[];
		showSpawnStatus?: boolean;
		class?: string;
	}>();
</script>

<FilterSection {onApply} {onClear}>
	<div>
		<Input id="search" label="Search" bind:value={searchTerm} placeholder="Search resources..." />
	</div>

	<div>
		<label for="class" class="mb-2 block text-sm font-medium text-slate-300">
			Resource Class
		</label>
		<select
			id="class"
			bind:value={className}
			class="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
		>
			<option value="">All Classes</option>
			{#each resourceClasses as resourceClass}
				<option value={resourceClass}>{resourceClass}</option>
			{/each}
		</select>
	</div>

	{#if showSpawnStatus}
		<div>
			<label for="status" class="mb-2 block text-sm font-medium text-slate-300">
				Spawn Status
			</label>
			<select
				id="status"
				bind:value={spawnStatus}
				class="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
			>
				<option value="all">All Resources</option>
				<option value="active">Currently Spawned</option>
				<option value="despawned">Despawned</option>
			</select>
		</div>
	{/if}
</FilterSection>
