<!--
 * Resource Selection Modal Component
 * 
 * A modal dialog for selecting resources with search, filtering, and pagination.
 * Uses the reusable ResourceFilters and ResourceTable components.
-->
<script lang="ts">
	import { browser } from '$app/environment';
	import type { Resource } from '$lib/types';
	import Modal from '$lib/components/Modal.svelte';
	import ResourceFilters from '$lib/components/ResourceFilters.svelte';
	import ResourceTable from '$lib/components/ResourceTable.svelte';
	import Loading from '$lib/components/Loading.svelte';

	let {
		open = $bindable(false),
		onSelect,
		onClose,
		title = 'Select Resource',
		resourceClasses = [],
		showSpawnStatus = true,
		selectedResourceId = null,
		class: className = ''
	} = $props<{
		open?: boolean;
		onSelect: (resource: Resource) => void;
		onClose?: () => void;
		title?: string;
		resourceClasses?: string[];
		showSpawnStatus?: boolean;
		selectedResourceId?: number | null;
		class?: string;
	}>();

	// Filter state
	let searchTerm = $state('');
	let resourceClass = $state('');
	let spawnStatus = $state('all');

	// Data state
	let resources = $state<Resource[]>([]);
	let total = $state(0);
	let loading = $state(false);
	let error = $state<string | null>(null);

	// Pagination state
	let currentPage = $state(1);
	let limit = $state(5);
	let totalPages = $state(1);

	/**
	 * Reset filters when modal opens/closes
	 */
	$effect(() => {
		if (!open) {
			// Reset filters when closing
			searchTerm = '';
			resourceClass = '';
			spawnStatus = 'all';
			currentPage = 1;
			
			if (onClose) {
				onClose();
			}
		}
	});

	/**
	 * Build API URL with current filters and pagination
	 */
	function buildApiUrl(): string {
		const url = new URL('/api/resources', window.location.origin);

		if (searchTerm.trim()) {
			url.searchParams.set('search', searchTerm.trim());
		}

		if (resourceClass) {
			url.searchParams.set('class', resourceClass);
		}

		if (spawnStatus && spawnStatus !== 'all') {
			url.searchParams.set('status', spawnStatus);
		}

		url.searchParams.set('page', currentPage.toString());
		url.searchParams.set('limit', limit.toString());

		return url.toString();
	}

	/**
	 * Load resources from API
	 */
	async function loadResources() {
		if (!browser) return;

		loading = true;
		error = null;

		try {
			const response = await fetch(buildApiUrl());

			if (!response.ok) {
				throw new Error(`Failed to load resources: ${response.statusText}`);
			}

			const data = await response.json();
			resources = data.resources || [];
			total = data.total || 0;

			// Calculate pagination info
			totalPages = Math.max(1, Math.ceil(total / limit));
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load resources';
			resources = [];
			total = 0;
		} finally {
			loading = false;
		}
	}

	/**
	 * Apply filters and reset pagination
	 */
	function applyFilters() {
		currentPage = 1;
		loadResources();
	}

	/**
	 * Clear all filters
	 */
	function clearFilters() {
		searchTerm = '';
		resourceClass = '';
		spawnStatus = 'all';
		applyFilters();
	}

	/**
	 * Handle page change
	 */
	function handlePageChange(page: number) {
		currentPage = page;
		loadResources();
	}

	/**
	 * Handle resource selection
	 */
	function handleResourceSelect(resource: Resource) {
		onSelect(resource);
		open = false;
	}

	// Load resources when modal opens or filters change
	$effect(() => {
		if (open && browser) {
			loadResources();
		}
	});

	// Pagination object for ResourceTable
	let paginationData = $state({
		page: 1,
		limit: 5,
		total: 0,
		totalPages: 1
	});

	// Update pagination data when values change
	$effect(() => {
		paginationData = {
			page: currentPage,
			limit: limit,
			total: total,
			totalPages: totalPages
		};
	});
</script>	<Modal bind:open {title} maxWidth="max-w-7xl">
	<div class="space-y-6">
		<!-- Filters -->
		<ResourceFilters
			bind:searchTerm
			bind:className={resourceClass}
			bind:spawnStatus
			onApply={applyFilters}
			onClear={clearFilters}
			{resourceClasses}
			{showSpawnStatus}
		/>

		<!-- Error display -->
		{#if error}
			<div class="rounded-md border border-red-500 bg-red-900/50 p-4">
				<p class="text-red-200">{error}</p>
			</div>
		{/if}

		<!-- Loading state -->
		{#if loading}
			<div class="flex justify-center py-8">
				<Loading size="lg" />
			</div>
		{:else}
			<!-- Resources table -->
			<ResourceTable
				{resources}
				{total}
				pagination={paginationData}
				onPageChange={handlePageChange}
				onResourceAction={handleResourceSelect}
				mode="selection"
				emptyMessage="No resources found"
				emptySubMessage="Try adjusting your filters to see more resources."
				actionLabel="Select"
				showColumns={{
					name: true,
					stats: true,
					planets: false,
					status: true,
					inventory: false,
					action: true
				}}
			/>
		{/if}
	</div>
</Modal>
