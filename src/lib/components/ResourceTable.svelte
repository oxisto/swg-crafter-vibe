<!--
 * Resource Table Component
 * 
 * Reusable table component for displaying resources with customizable columns and actions.
 * Can be used for both full resource listing and resource selection scenarios.
-->
<script lang="ts">
	import type { Resource } from '$lib/types';
	import { getPlanetInfo } from '$lib/types';
	import DataTable from '$lib/components/DataTable.svelte';

	let {
		resources,
		total = 0,
		pagination = null,
		onPageChange,
		onResourceClick,
		onResourceAction,
		mode = 'full', // 'full' | 'selection'
		emptyMessage = 'No resources found',
		emptySubMessage = '',
		actionLabel = 'Select',
		showColumns = {
			name: true,
			stats: true,
			planets: true,
			status: true,
			inventory: true,
			action: false
		},
		class: className = ''
	} = $props<{
		resources: Resource[];
		total?: number;
		pagination?: any;
		onPageChange?: (page: number) => void;
		onResourceClick?: (resource: Resource) => void;
		onResourceAction?: (resource: Resource) => void;
		mode?: 'full' | 'selection';
		emptyMessage?: string;
		emptySubMessage?: string;
		actionLabel?: string;
		showColumns?: {
			name?: boolean;
			stats?: boolean;
			planets?: boolean;
			status?: boolean;
			inventory?: boolean;
			action?: boolean;
		};
		class?: string;
	}>();

	// Generate columns based on mode and showColumns settings
	const columns = $derived(() => {
		const cols = [];

		if (showColumns.name) {
			cols.push({ key: 'name', label: 'Name' });
		}

		if (showColumns.stats) {
			cols.push(
				{ key: 'oq', label: 'OQ' },
				{ key: 'cr', label: 'CR' },
				{ key: 'cd', label: 'CD' },
				{ key: 'dr', label: 'DR' },
				{ key: 'fl', label: 'FL' },
				{ key: 'hr', label: 'HR' },
				{ key: 'ma', label: 'MA' },
				{ key: 'pe', label: 'PE' },
				{ key: 'sr', label: 'SR' },
				{ key: 'ut', label: 'UT' }
			);
		}

		if (showColumns.planets) {
			cols.push({ key: 'planets', label: 'Planets' });
		}

		if (showColumns.status) {
			cols.push({ key: 'status', label: 'Status' });
		}

		if (showColumns.inventory) {
			cols.push({ key: 'inventory', label: 'Inventory' });
		}

		if (showColumns.action) {
			cols.push({ key: 'action', label: 'Action' });
		}

		return cols;
	});

	// Get stat value safely
	function getStatValue(resource: Resource, stat: string): string {
		if (!resource.attributes) return '-';

		const value = resource.attributes[stat as keyof typeof resource.attributes];
		return value ? value.toString() : '-';
	}

	// Get stat color class based on value quality
	function getStatColorClass(resource: Resource, stat: string): string {
		if (!resource.attributes) return 'text-slate-400';

		const value = resource.attributes[stat as keyof typeof resource.attributes];
		if (!value) return 'text-slate-400';

		// Simplified color coding: gray for <500, yellow/green scale for 500+
		if (value < 500) return 'text-slate-400';
		if (value >= 900) return 'text-green-500 font-semibold'; // Excellent
		if (value >= 750) return 'text-emerald-500'; // Very Good
		if (value >= 600) return 'text-yellow-500'; // Good
		return 'text-yellow-400'; // Decent (500-599)
	}

	// Get inventory status class
	function getInventoryStatusClass(resource: Resource): string {
		if (!resource.inventory) return 'text-slate-500';

		switch (resource.inventory.amount) {
			case 'very_low':
				return 'text-red-400';
			case 'low':
				return 'text-orange-400';
			case 'medium':
				return 'text-yellow-400';
			case 'high':
				return 'text-green-400';
			default:
				return 'text-slate-500';
		}
	}

	// Get inventory display text
	function getInventoryDisplayText(resource: Resource): string {
		if (!resource.inventory) return 'None';
		return resource.inventory.amount.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
	}

	// Handle resource click
	function handleResourceClick(resource: Resource) {
		if (onResourceClick) {
			onResourceClick(resource);
		}
	}

	// Handle resource action button
	function handleResourceAction(resource: Resource) {
		if (onResourceAction) {
			onResourceAction(resource);
		}
	}
</script>

<div class={className}>
	<DataTable
		mode="table"
		title="Resources"
		{total}
		items={resources}
		{emptyMessage}
		{emptySubMessage}
		{pagination}
		{onPageChange}
		columns={columns()}
	>
		{#snippet renderCell(resource: Resource, column: { key: string; label: string }, i: number)}
			{#if column.key === 'name'}
				<div>
					{#if mode === 'selection'}
						<button
							onclick={() => handleResourceClick(resource)}
							class="text-left text-base font-medium text-white transition-colors hover:text-blue-400 focus:text-blue-400 focus:outline-none"
						>
							{resource.name}
						</button>
					{:else}
						<a
							href="/resources/{resource.id}"
							class="text-base font-medium text-white transition-colors hover:text-blue-400"
						>
							{resource.name}
						</a>
					{/if}
					<div class="text-xs text-slate-500">{resource.type}</div>
				</div>
			{:else if ['oq', 'cr', 'cd', 'dr', 'fl', 'hr', 'ma', 'pe', 'sr', 'ut'].includes(column.key)}
				<span class="font-mono text-sm {getStatColorClass(resource, column.key)}">
					{getStatValue(resource, column.key)}
				</span>
			{:else if column.key === 'planets'}
				<div class="flex flex-wrap justify-end gap-1">
					{#if resource.isCurrentlySpawned}
						{#each Object.keys(resource.planetDistribution) as planet}
							{@const planetInfo = getPlanetInfo(planet)}
							<span
								class="inline-flex h-6 w-6 cursor-default items-center justify-center rounded-full font-mono text-xs font-bold {planetInfo.color} {planetInfo.bg} border border-current/20"
								title={planetInfo.name}
							>
								{planetInfo.letter}
							</span>
						{/each}
					{:else}
						<span class="text-xs text-slate-500">-</span>
					{/if}
				</div>
			{:else if column.key === 'status'}
				<div class="flex items-center gap-2">
					<div
						class="h-2 w-2 rounded-full {resource.isCurrentlySpawned
							? 'bg-green-400'
							: 'bg-red-400'}"
						title={resource.isCurrentlySpawned ? 'Currently spawned' : 'Despawned'}
					></div>
					<span class="text-sm {resource.isCurrentlySpawned ? 'text-green-400' : 'text-red-400'}">
						{resource.isCurrentlySpawned ? 'Active' : 'Despawned'}
					</span>
				</div>
			{:else if column.key === 'inventory'}
				<button
					onclick={() => onResourceAction ? handleResourceAction(resource) : handleResourceClick(resource)}
					class="cursor-pointer text-sm {getInventoryStatusClass(
						resource
					)} hover:underline focus:underline focus:outline-none"
				>
					{getInventoryDisplayText(resource)}
				</button>
			{:else if column.key === 'action'}
				<button
					onclick={() => handleResourceAction(resource)}
					class="rounded bg-blue-600 px-3 py-1 text-sm text-white transition-colors hover:bg-blue-700 focus:bg-blue-700 focus:outline-none"
				>
					{actionLabel}
				</button>
			{/if}
		{/snippet}
	</DataTable>
</div>
