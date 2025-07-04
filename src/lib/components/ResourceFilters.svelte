<!--
 * Resource Filters Component
 * 
 * Reusable filtering controls for resource lists and selection.
 * Provides search, class selection, and spawn status filtering.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import Input from '$lib/components/Input.svelte';
	import FilterSection from '$lib/components/FilterSection.svelte';
	import type { ResourceClass, GetResourceTreeResponse } from '$lib/types/api';

	let {
		searchTerm = $bindable(''),
		className = $bindable(''),
		spawnStatus = $bindable('all'),
		onApply,
		onClear,
		showSpawnStatus = true,
		class: className_ = ''
	} = $props<{
		searchTerm?: string;
		className?: string;
		spawnStatus?: string;
		onApply: () => void;
		onClear: () => void;
		showSpawnStatus?: boolean;
		class?: string;
	}>();

	let resourceTree: ResourceClass[] = $state([]);
	let flatResourceClasses: ResourceClass[] = $state([]);
	let isLoadingResourceTree = $state(false);

	onMount(async () => {
		await loadResourceTree();
	});

	async function loadResourceTree() {
		isLoadingResourceTree = true;
		try {
			const response = await fetch('/api/resource-tree');
			if (response.ok) {
				const data: GetResourceTreeResponse = await response.json();
				resourceTree = data.tree;
				flatResourceClasses = data.flat;
			} else {
				console.error('Failed to fetch resource tree:', response.statusText);
			}
		} catch (error) {
			console.error('Error loading resource tree:', error);
		} finally {
			isLoadingResourceTree = false;
		}
	}

	function renderResourceOption(resourceClass: ResourceClass, depth = 0): string {
		const indent = '　'.repeat(depth); // Japanese full-width space for better indentation
		return `${indent}${resourceClass.name}`;
	}

	function getFilterableResourceClasses(): { resourceClass: ResourceClass; depth: number }[] {
		// Build a flat list with proper depths from the tree structure
		const result: { resourceClass: ResourceClass; depth: number }[] = [];

		function traverse(nodes: ResourceClass[], currentDepth = 0) {
			for (const node of nodes) {
				// Only include harvested resources for filtering
				if (node.harvested) {
					result.push({ resourceClass: node, depth: currentDepth });
				}
				// Recursively traverse children, but only if this node is harvested or has harvested descendants
				if (node.children && node.children.length > 0) {
					traverse(node.children, currentDepth + 1);
				}
			}
		}

		traverse(resourceTree);
		return result;
	}
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
			disabled={isLoadingResourceTree}
			class="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:opacity-50"
		>
			<option value="">
				{isLoadingResourceTree ? 'Loading classes...' : 'All Classes'}
			</option>
			{#each getFilterableResourceClasses() as { resourceClass, depth }}
				<option value={resourceClass.swgcraft_id}>
					{renderResourceOption(resourceClass, depth)}
				</option>
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
