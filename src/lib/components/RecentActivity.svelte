<!--
	@fileoverview RecentActivity component for the SWG Shipwright application.
	Displays recently updated inventory items with timestamps.
	
	@component
	@author SWG Crafter Team
	@since 1.0.0
-->

<script lang="ts">
	import { onMount } from 'svelte';
	import type { InventoryItemWithTimestamp } from '$lib/types.js';

	/**
	 * Component properties interface defining the required props.
	 */
	interface Props {
		/** Maximum number of items to display */
		limit?: number;
		/** Whether to include schematic information */
		includeSchematic?: boolean;
		/** Whether to show the component title */
		showTitle?: boolean;
		/** Custom title for the component */
		title?: string;
	}

	let {
		limit = 5,
		includeSchematic = true,
		showTitle = true,
		title = 'Recent Activity'
	}: Props = $props();

	let recentItems: (InventoryItemWithTimestamp & {
		displayName?: string;
		schematicId?: string;
	})[] = $state([]);
	let isLoading = $state(true);
	let error = $state<string | null>(null);

	/**
	 * Fetches recent inventory activity from the API
	 */
	async function fetchRecentActivity() {
		try {
			isLoading = true;
			error = null;

			const params = new URLSearchParams({
				limit: limit.toString(),
				includeSchematic: includeSchematic.toString()
			});

			const response = await fetch(`/api/inventory/recent?${params}`);

			if (!response.ok) {
				throw new Error(`Failed to fetch recent activity: ${response.statusText}`);
			}

			const data = await response.json();
			recentItems = data.recentUpdates || [];
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load recent activity';
			console.error('Error fetching recent activity:', err);
		} finally {
			isLoading = false;
		}
	}

	/**
	 * Formats a timestamp for display
	 */
	function formatTimestamp(timestamp: string): string {
		const date = new Date(timestamp);
		const now = new Date();
		const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

		if (diffInSeconds < 60) {
			return 'Just now';
		} else if (diffInSeconds < 3600) {
			const minutes = Math.floor(diffInSeconds / 60);
			return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
		} else if (diffInSeconds < 86400) {
			const hours = Math.floor(diffInSeconds / 3600);
			return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
		} else {
			const days = Math.floor(diffInSeconds / 86400);
			if (days <= 7) {
				return `${days} day${days !== 1 ? 's' : ''} ago`;
			} else {
				return date.toLocaleDateString();
			}
		}
	}

	// Fetch data when component mounts
	onMount(fetchRecentActivity);
</script>

{#if showTitle}
	<div class="mb-4 flex items-center justify-between">
		<h3 class="text-lg font-semibold text-yellow-400">{title}</h3>
		<button
			onclick={fetchRecentActivity}
			class="rounded bg-slate-700 px-3 py-1 text-sm text-slate-300 transition-colors hover:bg-slate-600 hover:text-white"
			disabled={isLoading}
		>
			{isLoading ? '⟳' : '↻'} Refresh
		</button>
	</div>
{/if}

<div class="space-y-2">
	{#if isLoading}
		<div class="flex items-center justify-center py-8 text-slate-400">
			<div class="h-6 w-6 animate-spin rounded-full border-b-2 border-yellow-400"></div>
			<span class="ml-2">Loading recent activity...</span>
		</div>
	{:else if error}
		<div class="rounded-lg border border-red-600 bg-red-900/20 p-4 text-red-400">
			<p class="font-medium">Error loading recent activity</p>
			<p class="text-sm text-red-300">{error}</p>
		</div>
	{:else if recentItems.length === 0}
		<div class="rounded-lg border border-slate-600 bg-slate-800/50 p-6 text-center text-slate-400">
			<p>No recent activity found</p>
			<p class="text-sm">Update some inventory items to see activity here</p>
		</div>
	{:else}
		{#each recentItems as item}
			<div
				class="flex items-center justify-between rounded-lg border border-slate-600 bg-slate-800/30 p-3 transition-colors hover:bg-slate-700/30"
			>
				<div class="flex-1">
					<div class="flex items-center gap-2">
						<span class="font-medium text-white">
							{item.displayName || `${item.category} Mark ${item.markLevel}`}
						</span>
						<span class="rounded bg-blue-600 px-2 py-0.5 text-xs text-white">
							Qty: {item.quantity}
						</span>
					</div>
					{#if item.displayName && item.displayName !== `${item.category} Mark ${item.markLevel}`}
						<div class="text-sm text-slate-400">
							{item.category} - Mark {item.markLevel}
						</div>
					{/if}
				</div>
				<div class="text-right">
					<div class="text-sm text-slate-300">
						{formatTimestamp(item.updatedAt)}
					</div>
					{#if item.schematicId}
						<a
							href="/schematics/{item.schematicId}?from=recent"
							class="text-xs text-yellow-400 hover:text-yellow-300 hover:underline"
						>
							View Schematic
						</a>
					{/if}
				</div>
			</div>
		{/each}
	{/if}
</div>
