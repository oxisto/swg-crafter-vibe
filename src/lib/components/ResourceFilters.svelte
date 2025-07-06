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
		showInInventoryOnly = $bindable(false),
		onApply,
		onClear,
		showSpawnStatus = true,
		disabled = false,
		class: className_ = ''
	} = $props<{
		searchTerm?: string;
		className?: string;
		spawnStatus?: string;
		showInInventoryOnly?: boolean;
		onApply: () => void;
		onClear: () => void;
		showSpawnStatus?: boolean;
		disabled?: boolean; // Disable the class dropdown when constrained
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
		// Build a smart filtered list that shows:
		// - All classes up to depth 3 (broad categories)
		// - Child classes only if their parent is selected
		const result: { resourceClass: ResourceClass; depth: number }[] = [];
		const selectedResourceClass = className
			? flatResourceClasses.find((rc) => rc.swgcraft_id === className)
			: null;

		function shouldShowClass(resourceClass: ResourceClass, depth: number): boolean {
			// Normal smart filtering logic
			// Always show top-level categories (depth 0-2)
			if (depth <= 2) return true;

			// Check if this class has children (is not a leaf node)
			const hasChildren = resourceClass.children && resourceClass.children.length > 0;

			// For depth 3+, be more selective:
			// - Always show non-leaf nodes (they have subcategories)
			// - Only show leaf nodes if they're related to the current selection
			if (depth >= 3 && hasChildren) {
				return true; // Non-leaf nodes are always shown for navigation
			}

			// For leaf nodes at depth 3+, only show if:
			// 1. This class is currently selected, OR
			// 2. A parent of this class is currently selected, OR
			// 3. This class is a direct child of the selected class
			if (selectedResourceClass) {
				// Check if this is the selected class
				if (resourceClass.swgcraft_id === selectedResourceClass.swgcraft_id) {
					return true;
				}

				// Check if selected class is a parent of this class
				// (this class's path should contain the selected class)
				if (isDescendantOf(resourceClass, selectedResourceClass)) {
					return true;
				}

				// Check if this class is a direct child of the selected class
				if (resourceClass.parent_id === selectedResourceClass.swgcraft_id) {
					return true;
				}
			}

			// Don't show deep leaf nodes by default
			return false;
		}

		function isDescendantOf(child: ResourceClass, ancestor: ResourceClass): boolean {
			// Walk up the tree from child to see if we find ancestor
			let current = child;
			while (current.parent_id) {
				const parent = flatResourceClasses.find((rc) => rc.swgcraft_id === current.parent_id);
				if (!parent) break;
				if (parent.swgcraft_id === ancestor.swgcraft_id) return true;
				current = parent;
			}
			return false;
		}

		// ...existing code...

		function traverse(nodes: ResourceClass[], currentDepth = 0) {
			for (const node of nodes) {
				// Only include harvested resources that should be shown
				if (node.harvested && shouldShowClass(node, currentDepth)) {
					result.push({ resourceClass: node, depth: currentDepth });
				}
				// Always traverse children to find deeper matches
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
			{#if disabled}
				<span class="ml-2 text-xs text-slate-400">(filtered by schematic)</span>
			{/if}
		</label>
		<select
			id="class"
			bind:value={className}
			disabled={isLoadingResourceTree || disabled}
			class="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:opacity-50"
		>
			<option value="">
				{#if disabled}
					Showing schematic-compatible classes only
				{:else if isLoadingResourceTree}
					Loading classes...
				{:else}
					All Classes
				{/if}
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

	<div>
		<label class="mb-2 flex items-center text-sm font-medium text-slate-300">
			<input
				type="checkbox"
				bind:checked={showInInventoryOnly}
				class="mr-2 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-2 focus:ring-blue-500/20"
			/>
			Show only resources in inventory
		</label>
	</div>
</FilterSection>
