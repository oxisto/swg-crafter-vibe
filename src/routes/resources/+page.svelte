<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { invalidateAll } from '$app/navigation';
	import type { PageData } from './$types';
	import type { Resource, ResourceInventoryAmount } from '$lib/types';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import Loading from '$lib/components/Loading.svelte';
	import ResourceFilters from '$lib/components/ResourceFilters.svelte';
	import ResourceTable from '$lib/components/ResourceTable.svelte';
	import { RESOURCE_INVENTORY_AMOUNTS } from '$lib/types/resource-inventory.js';

	let { data }: { data: PageData } = $props();

	// Filter controls - use server-provided data
	let searchTerm = $state(data.filters?.searchTerm || '');
	let className = $state(data.filters?.className || '');
	let spawnStatus = $state(data.filters?.spawnStatus || 'all');

	// Inventory management modal state
	let showInventoryModal = $state(false);
	let selectedResource: Resource | null = $state(null);
	let selectedAmount: ResourceInventoryAmount = $state('very_low');
	let inventoryNotes = $state('');
	let isUpdating = $state(false);

	// Handle filter changes
	function applyFilters() {
		const url = new URL($page.url);

		const filters = {
			searchTerm: searchTerm,
			className: className,
			spawnStatus: spawnStatus
		};

		if (filters.searchTerm) {
			url.searchParams.set('search', filters.searchTerm);
		} else {
			url.searchParams.delete('search');
		}

		if (filters.className) {
			url.searchParams.set('class', filters.className);
		} else {
			url.searchParams.delete('class');
		}

		if (filters.spawnStatus && filters.spawnStatus !== 'all') {
			url.searchParams.set('status', filters.spawnStatus);
		} else {
			url.searchParams.delete('status');
		}

		url.searchParams.delete('page'); // Reset to first page
		goto(url.toString());
	}

	// Clear filters
	function clearFilters() {
		searchTerm = '';
		className = '';
		spawnStatus = 'all';
		applyFilters();
	}

	// Pagination
	function goToPage(pageNum: number) {
		const url = new URL($page.url);
		url.searchParams.set('page', pageNum.toString());
		goto(url.toString());
	}

	// Open inventory modal
	function openInventoryModal(resource: Resource) {
		selectedResource = resource;
		selectedAmount = resource.inventory?.amount || 'very_low';
		inventoryNotes = resource.inventory?.notes || '';
		showInventoryModal = true;
	}

	// Close inventory modal
	function closeInventoryModal() {
		showInventoryModal = false;
		selectedResource = null;
		selectedAmount = 'very_low';
		inventoryNotes = '';
		isUpdating = false;
	}

	// Handle modal close
	$effect(() => {
		if (!showInventoryModal) {
			selectedResource = null;
			selectedAmount = 'very_low';
			inventoryNotes = '';
			isUpdating = false;
		}
	});

	// Save inventory
	async function saveInventory() {
		if (!selectedResource) return;

		isUpdating = true;
		try {
			const response = await fetch(`/api/resources/${selectedResource.id}/inventory`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					amount: selectedAmount,
					notes: inventoryNotes.trim() || null
				})
			});

			if (response.ok) {
				await invalidateAll();
				closeInventoryModal();
			} else {
				const error = await response.json();
				alert(`Failed to save inventory: ${error.error}`);
			}
		} catch (error) {
			console.error('Error saving inventory:', error);
			alert('Failed to save inventory. Please try again.');
		} finally {
			isUpdating = false;
		}
	}

	// Remove inventory
	async function removeInventory() {
		if (!selectedResource) return;

		isUpdating = true;
		try {
			const response = await fetch(`/api/resources/${selectedResource.id}/inventory`, {
				method: 'DELETE'
			});

			if (response.ok) {
				await invalidateAll();
				closeInventoryModal();
			} else {
				const error = await response.json();
				alert(`Failed to remove inventory: ${error.error}`);
			}
		} catch (error) {
			console.error('Error removing inventory:', error);
			alert('Failed to remove inventory. Please try again.');
		} finally {
			isUpdating = false;
		}
	}

	// Get stat value safely (used in modal)
	function getStatValue(resource: Resource, stat: string): string {
		if (!resource.attributes) return '-';

		const value = resource.attributes[stat as keyof typeof resource.attributes];
		return value ? value.toString() : '-';
	}

	// Get stat color class based on value quality (used in modal)
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
</script>

<svelte:head>
	<title>SWG Shipwright - Resources</title>
</svelte:head>

<PageLayout maxWidth="7xl">
	<PageHeader
		title="Resources"
		subtitle="Manage your resource inventory and track spawns"
		emoji="🪨"
		centered={true}
	/>

	<!-- Filters -->
	<ResourceFilters
		bind:searchTerm
		bind:className
		bind:spawnStatus
		onApply={applyFilters}
		onClear={clearFilters}
	/>

	<!-- Resources Table -->
	<ResourceTable
		resources={data.resources}
		total={data.total}
		pagination={data.pagination}
		onPageChange={goToPage}
		onResourceAction={openInventoryModal}
		emptyMessage="No resources found"
		emptySubMessage={data.filters.searchTerm ||
		data.filters.className ||
		(data.filters.spawnStatus && data.filters.spawnStatus !== 'all')
			? 'Try adjusting your filters to see more resources.'
			: 'No resource data available.'}
		showColumns={{
			name: true,
			stats: true,
			planets: true,
			status: true,
			inventory: true,
			action: false
		}}
	/>
</PageLayout>

<!-- Inventory Management Modal -->
<Modal bind:open={showInventoryModal} title="Manage Inventory">
	{#if selectedResource}
		<div class="space-y-6">
			<div>
				<h2 class="text-xl font-bold text-white">
					Manage Inventory: {selectedResource.name}
				</h2>
				<p class="text-sm text-slate-400">
					{selectedResource.className} • {selectedResource.type}
				</p>
				{#if selectedResource.attributes}
					<div class="mt-2 grid grid-cols-5 gap-2 text-xs text-slate-500">
						{#each ['oq', 'cr', 'cd', 'dr', 'fl', 'hr', 'ma', 'pe', 'sr', 'ut'] as stat}
							{@const value = getStatValue(selectedResource, stat)}
							{#if value !== '-'}
								<div class="text-center">
									<div class="font-mono text-xs text-blue-300 uppercase">{stat}</div>
									<div class="font-mono font-semibold {getStatColorClass(selectedResource, stat)}">
										{value}
									</div>
								</div>
							{/if}
						{/each}
					</div>
				{/if}
			</div>

			<div>
				<label for="amount" class="mb-2 block text-sm font-medium text-slate-300"> Amount </label>
				<select
					id="amount"
					bind:value={selectedAmount}
					class="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
				>
					{#each Object.values(RESOURCE_INVENTORY_AMOUNTS) as amountDef}
						<option value={amountDef.value}>
							{amountDef.label} ({amountDef.description})
						</option>
					{/each}
				</select>
			</div>

			<div>
				<Input
					id="notes"
					label="Notes (optional)"
					bind:value={inventoryNotes}
					placeholder="Add notes about this resource..."
				/>
			</div>

			<div class="flex gap-3">
				<Button onclick={saveInventory} disabled={isUpdating} variant="primary" class="flex-1">
					{#if isUpdating}
						<Loading size="sm" />
						Saving...
					{:else}
						Save Inventory
					{/if}
				</Button>

				{#if selectedResource.inventory}
					<Button onclick={removeInventory} disabled={isUpdating} variant="danger">
						{#if isUpdating}
							<Loading size="sm" />
						{:else}
							Remove
						{/if}
					</Button>
				{/if}

				<Button onclick={closeInventoryModal} disabled={isUpdating} variant="secondary">
					Cancel
				</Button>
			</div>
		</div>
	{/if}
</Modal>
