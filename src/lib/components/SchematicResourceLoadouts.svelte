<!--
 * Schematic Resource Loadouts Component
 * 
 * Manages resource loadouts for a specific schematic, allowing users to:
 * - Create new loadouts
 * - Assign concrete resources to required resource slots
 * - Switch between different loadouts
 * - Delete loadouts
-->
<script lang="ts">
	import { browser } from '$app/environment';
	import Button from '$lib/components/Button.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import SimpleTable from '$lib/components/SimpleTable.svelte';
	import type { Schematic, Resource } from '$lib/types';
	import type {
		SchematicResourceLoadout,
		SchematicLoadoutSummary
	} from '$lib/data/database/schematic-resource-loadouts.js';

	let { schematic, class: className = '' } = $props<{
		schematic: Schematic;
		class?: string;
	}>();

	// State
	let loadouts = $state<SchematicLoadoutSummary[]>([]);
	let currentLoadout = $state<string | null>(null);
	let loadoutResources = $state<SchematicResourceLoadout[]>([]);
	let availableResources = $state<Resource[]>([]);
	let loading = $state(false);
	let error = $state<string | null>(null);

	// Modal states
	let showCreateLoadoutModal = $state(false);
	let showResourceAssignModal = $state(false);
	let newLoadoutName = $state('');
	let selectedResourceSlot = $state<string | null>(null);
	let selectedResourceId = $state<number | null>(null);

	// Table columns for loadout resources
	const resourceColumns = [
		{ key: 'resource_slot_name', label: 'Required Resource' },
		{ key: 'assigned_resource_name', label: 'Assigned Resource' },
		{ key: 'actions', label: 'Actions' }
	];

	/**
	 * Load all loadouts for the schematic
	 */
	async function loadLoadouts() {
		if (!browser) return;

		loading = true;
		error = null;

		try {
			const response = await fetch(`/api/schematics/${schematic.id}/loadouts`);
			if (!response.ok) {
				throw new Error(`Failed to load loadouts: ${response.statusText}`);
			}

			loadouts = await response.json();

			// Auto-select first loadout if available
			if (loadouts.length > 0 && !currentLoadout) {
				currentLoadout = loadouts[0].loadout_name;
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load loadouts';
		} finally {
			loading = false;
		}
	}

	/**
	 * Load resources for the currently selected loadout
	 */
	async function loadLoadoutResources() {
		if (!browser || !currentLoadout) return;

		loading = true;
		error = null;

		try {
			const response = await fetch(
				`/api/schematics/${schematic.id}/loadouts?loadout=${encodeURIComponent(currentLoadout)}`
			);
			if (!response.ok) {
				throw new Error(`Failed to load loadout resources: ${response.statusText}`);
			}

			loadoutResources = await response.json();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load loadout resources';
		} finally {
			loading = false;
		}
	}

	/**
	 * Load available resources for assignment
	 */
	async function loadAvailableResources() {
		if (!browser) return;

		try {
			const response = await fetch('/api/resources?limit=500');
			if (!response.ok) {
				throw new Error(`Failed to load resources: ${response.statusText}`);
			}

			const data = await response.json();
			availableResources = data.resources || [];
		} catch (err) {
			console.warn('Failed to load available resources:', err);
			availableResources = [];
		}
	}

	/**
	 * Create a new loadout
	 */
	async function createLoadout() {
		if (!newLoadoutName.trim()) return;

		loading = true;
		error = null;

		try {
			const response = await fetch(`/api/schematics/${schematic.id}/loadouts`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ loadoutName: newLoadoutName.trim() })
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to create loadout');
			}

			// Reload loadouts and select the new one
			await loadLoadouts();
			currentLoadout = newLoadoutName.trim();
			newLoadoutName = '';
			showCreateLoadoutModal = false;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create loadout';
		} finally {
			loading = false;
		}
	}

	/**
	 * Assign a resource to a loadout slot
	 */
	async function assignResource() {
		if (!currentLoadout || !selectedResourceSlot || !selectedResourceId) return;

		const resource = availableResources.find((r) => r.id === selectedResourceId);
		if (!resource) return;

		loading = true;
		error = null;

		try {
			const response = await fetch(`/api/schematics/${schematic.id}/loadouts`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					loadoutName: currentLoadout,
					action: 'assign',
					resourceSlotName: selectedResourceSlot,
					resourceId: selectedResourceId,
					resourceName: resource.name
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to assign resource');
			}

			// Reload loadout resources
			await loadLoadoutResources();
			selectedResourceSlot = null;
			selectedResourceId = null;
			showResourceAssignModal = false;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to assign resource';
		} finally {
			loading = false;
		}
	}

	/**
	 * Delete a loadout
	 */
	async function deleteLoadout(loadoutName: string) {
		if (!confirm(`Are you sure you want to delete the loadout "${loadoutName}"?`)) return;

		loading = true;
		error = null;

		try {
			const response = await fetch(
				`/api/schematics/${schematic.id}/loadouts?loadout=${encodeURIComponent(loadoutName)}`,
				{
					method: 'DELETE'
				}
			);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to delete loadout');
			}

			// Reload loadouts and clear selection if deleted loadout was selected
			await loadLoadouts();
			if (currentLoadout === loadoutName) {
				currentLoadout = loadouts.length > 0 ? loadouts[0].loadout_name : null;
				loadoutResources = [];
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to delete loadout';
		} finally {
			loading = false;
		}
	}

	/**
	 * Open resource assignment modal for a specific slot
	 */
	function openResourceAssignModal(resourceSlotName: string) {
		selectedResourceSlot = resourceSlotName;
		selectedResourceId = null;
		showResourceAssignModal = true;
	}

	// Load data when component mounts or currentLoadout changes
	$effect(() => {
		if (browser) {
			loadLoadouts();
			loadAvailableResources();
		}
	});

	$effect(() => {
		if (browser && currentLoadout) {
			loadLoadoutResources();
		}
	});
</script>

<div class={`space-y-6 ${className}`}>
	<!-- Header with loadout selector and actions -->
	<div class="flex items-center justify-between">
		<div class="flex items-center space-x-4">
			<h3 class="text-lg font-semibold text-white">Resource Loadouts</h3>

			{#if loadouts.length > 0}
				<select
					bind:value={currentLoadout}
					class="rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
				>
					{#each loadouts as loadout}
						<option value={loadout.loadout_name}>
							{loadout.loadout_name} ({loadout.assigned_slots}/{loadout.total_slots})
						</option>
					{/each}
				</select>
			{/if}
		</div>

		<div class="flex space-x-2">
			<Button
				variant="primary"
				size="sm"
				onclick={() => {
					showCreateLoadoutModal = true;
				}}
				disabled={loading}
			>
				Create Loadout
			</Button>

			{#if currentLoadout}
				<Button
					variant="danger"
					size="sm"
					onclick={() => deleteLoadout(currentLoadout!)}
					disabled={loading}
				>
					Delete
				</Button>
			{/if}
		</div>
	</div>

	<!-- Error display -->
	{#if error}
		<div class="rounded-md border border-red-500 bg-red-900/50 p-4">
			<p class="text-red-200">{error}</p>
		</div>
	{/if}

	<!-- Loading state -->
	{#if loading}
		<div class="py-8 text-center">
			<p class="text-slate-400">Loading...</p>
		</div>
	{/if}

	<!-- Loadout resources table -->
	{#if currentLoadout && loadoutResources.length > 0}
		<div class="rounded-lg border border-slate-600 bg-slate-800">
			<div class="border-b border-slate-600 px-6 py-4">
				<h4 class="text-lg font-medium text-white">Loadout: {currentLoadout}</h4>
			</div>

			<SimpleTable
				columns={resourceColumns}
				items={loadoutResources}
				emptyMessage="No resources configured"
			>
				{#snippet renderCell(
					item: SchematicResourceLoadout,
					column: { key: string; label: string },
					i: number
				)}
					{#if column.key === 'resource_slot_name'}
						<span class="font-medium text-slate-200">{item.resource_slot_name}</span>
					{:else if column.key === 'assigned_resource_name'}
						{#if item.assigned_resource_name}
							<span class="text-green-400">{item.assigned_resource_name}</span>
						{:else}
							<span class="text-slate-500 italic">Not assigned</span>
						{/if}
					{:else if column.key === 'actions'}
						<Button
							variant="secondary"
							size="sm"
							onclick={() => openResourceAssignModal(item.resource_slot_name)}
							disabled={loading}
						>
							{item.assigned_resource_name ? 'Change' : 'Assign'}
						</Button>
					{:else}
						-
					{/if}
				{/snippet}
			</SimpleTable>
		</div>
	{:else if currentLoadout && !loading}
		<div class="py-8 text-center text-slate-400">
			<p>No resources found for this loadout.</p>
		</div>
	{/if}

	<!-- Empty state -->
	{#if loadouts.length === 0 && !loading}
		<div class="py-8 text-center text-slate-400">
			<p class="mb-4">No resource loadouts created yet.</p>
			<p class="text-sm">
				Create a loadout to start assigning concrete resources to this schematic's requirements.
			</p>
		</div>
	{/if}
</div>

<!-- Create Loadout Modal -->
<Modal bind:open={showCreateLoadoutModal} title="Create New Loadout">
	<div class="space-y-4">
		<div>
			<label for="loadout-name" class="mb-2 block text-sm font-medium text-slate-300">
				Loadout Name
			</label>
			<input
				id="loadout-name"
				type="text"
				bind:value={newLoadoutName}
				placeholder="Enter loadout name..."
				class="w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
				onkeydown={(e) => e.key === 'Enter' && createLoadout()}
			/>
		</div>

		<div class="flex justify-end space-x-2">
			<Button
				variant="secondary"
				onclick={() => {
					showCreateLoadoutModal = false;
					newLoadoutName = '';
				}}
			>
				Cancel
			</Button>
			<Button
				variant="primary"
				onclick={createLoadout}
				disabled={!newLoadoutName.trim() || loading}
			>
				Create
			</Button>
		</div>
	</div>
</Modal>

<!-- Resource Assignment Modal -->
<Modal bind:open={showResourceAssignModal} title="Assign Resource">
	<div class="space-y-4">
		{#if selectedResourceSlot}
			<p class="text-slate-300">
				Assigning resource for: <strong class="text-white">{selectedResourceSlot}</strong>
			</p>

			<div>
				<label for="resource-select" class="mb-2 block text-sm font-medium text-slate-300">
					Select Resource
				</label>
				<select
					id="resource-select"
					bind:value={selectedResourceId}
					class="w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
				>
					<option value={null}>-- Select a resource --</option>
					{#each availableResources as resource}
						<option value={resource.id}>
							{resource.name} ({resource.type})
						</option>
					{/each}
				</select>
			</div>

			<div class="flex justify-end space-x-2">
				<Button
					variant="secondary"
					onclick={() => {
						showResourceAssignModal = false;
						selectedResourceSlot = null;
						selectedResourceId = null;
					}}
				>
					Cancel
				</Button>
				<Button
					variant="primary"
					onclick={assignResource}
					disabled={!selectedResourceId || loading}
				>
					Assign
				</Button>
			</div>
		{/if}
	</div>
</Modal>
