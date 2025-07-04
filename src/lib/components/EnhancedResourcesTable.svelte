<!--
 * Enhanced Resources Table Component
 * 
 * Combines the required resources display with resource loadouts functionality.
 * Shows schematic requirements alongside loadout management and resource assignment.
-->
<script lang="ts">
	import { browser } from '$app/environment';
	import Button from '$lib/components/Button.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import SimpleTable from '$lib/components/SimpleTable.svelte';
	import ResourceSelectionModal from '$lib/components/ResourceSelectionModal.svelte';
	import type { Schematic, SchematicResource, Resource } from '$lib/types';
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
	let loading = $state(false);
	let error = $state<string | null>(null);

	// Modal states
	let showCreateLoadoutModal = $state(false);
	let showResourceAssignModal = $state(false);
	let newLoadoutName = $state('');
	let selectedResourceSlot = $state<string | null>(null);

	// Enhanced table columns that include loadout assignment
	const enhancedResourceColumns = [
		{ key: 'name', label: 'Required Resource' },
		{ key: 'amount', label: 'Amount' },
		{ key: 'units', label: 'Units' },
		{ key: 'classes', label: 'Classes' },
		{ key: 'assigned_resource', label: 'Assigned Resource' },
		{ key: 'actions', label: 'Actions' }
	];

	/**
	 * Create enhanced data by combining schematic resources with loadout assignments
	 */
	const enhancedResourceData = $derived(() => {
		return schematic.resources.map((resource: SchematicResource) => {
			const assignment = loadoutResources.find((lr) => lr.resource_slot_name === resource.name);
			return {
				...resource,
				assignment: assignment || null
			};
		});
	});

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
		if (!browser || !currentLoadout) {
			loadoutResources = [];
			return;
		}

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
	 * Assign a resource to a loadout slot from the resource selection modal
	 */
	async function assignResourceFromModal(resource: Resource) {
		if (!currentLoadout || !selectedResourceSlot) return;

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
					resourceId: resource.id,
					resourceName: resource.name
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to assign resource');
			}

			// Reload loadout resources and close modal
			await loadLoadoutResources();
			selectedResourceSlot = null;
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
		showResourceAssignModal = true;
	}

	/**
	 * Handle resource selection from the modal
	 */
	async function handleResourceSelect(resource: Resource) {
		if (!currentLoadout || !selectedResourceSlot) return;

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
					resourceId: resource.id,
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
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to assign resource';
		} finally {
			loading = false;
		}
	}

	// Load data when component mounts or currentLoadout changes
	$effect(() => {
		if (browser) {
			loadLoadouts();
		}
	});

	$effect(() => {
		if (browser && currentLoadout) {
			loadLoadoutResources();
		}
	});
</script>

<div class={`space-y-4 ${className}`}>
	<!-- Header with loadout management -->
	<div class="flex items-center justify-between">
		<div class="flex items-center space-x-4">
			<h4 class="text-lg font-semibold text-white">Required Resources</h4>

			{#if loadouts.length > 0}
				<div class="flex items-center space-x-2">
					<span class="text-sm text-slate-400">Loadout:</span>
					<select
						bind:value={currentLoadout}
						class="rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
					>
						<option value={null}>-- Select loadout --</option>
						{#each loadouts as loadout}
							<option value={loadout.loadout_name}>
								{loadout.loadout_name} ({loadout.assigned_slots}/{loadout.total_slots})
							</option>
						{/each}
					</select>
				</div>
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
				New Loadout
			</Button>

			{#if currentLoadout}
				<Button
					variant="danger"
					size="sm"
					onclick={() => deleteLoadout(currentLoadout!)}
					disabled={loading}
				>
					Delete Loadout
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

	<!-- Help message when no loadout selected -->
	{#if !currentLoadout && loadouts.length > 0}
		<div class="rounded-md border border-blue-500/30 bg-blue-900/30 p-4">
			<p class="text-blue-200">
				<strong>Select a loadout</strong> from the dropdown above to assign resources to requirement
				slots.
			</p>
		</div>
	{/if}

	<!-- Enhanced resources table -->
	<div class="rounded-lg border border-slate-600 bg-slate-800">
		<SimpleTable
			columns={enhancedResourceColumns}
			items={enhancedResourceData()}
			emptyMessage="No resource requirements found"
			tableClass="min-w-full divide-y divide-slate-600"
		>
			{#snippet renderCell(
				item: SchematicResource & { assignment: SchematicResourceLoadout | null },
				column: { key: string; label: string },
				i: number
			)}
				{#if column.key === 'name'}
					<span class="font-medium text-slate-200">{item.name}</span>
				{:else if column.key === 'amount'}
					<span class="text-slate-300">{item.amount}</span>
				{:else if column.key === 'units'}
					<span class="text-slate-400">{item.units}</span>
				{:else if column.key === 'classes'}
					{#if item.classes && item.classes.length > 0}
						<div class="flex flex-wrap gap-1">
							{#each item.classes as cls}
								<span
									class="inline-flex items-center rounded bg-purple-500/20 px-2 py-1 text-xs text-purple-300"
								>
									{typeof cls === 'string' ? cls : cls.displayName || cls.code}
								</span>
							{/each}
						</div>
					{:else}
						<span class="text-slate-500">-</span>
					{/if}
				{:else if column.key === 'assigned_resource'}
					{#if currentLoadout}
						{#if item.assignment?.assigned_resource_name}
							<span class="font-medium text-green-400"
								>{item.assignment.assigned_resource_name}</span
							>
						{:else}
							<span class="text-slate-500 italic">Not assigned</span>
						{/if}
					{:else}
						<span class="text-sm text-slate-600">Select a loadout</span>
					{/if}
				{:else if column.key === 'actions'}
					{#if currentLoadout}
						<Button
							variant="secondary"
							size="sm"
							onclick={() => openResourceAssignModal(item.name)}
							disabled={loading}
						>
							{item.assignment?.assigned_resource_name ? 'Change' : 'Assign'}
						</Button>
					{:else}
						<span class="text-sm text-slate-600">-</span>
					{/if}
				{:else}
					<span class="text-slate-500">-</span>
				{/if}
			{/snippet}
		</SimpleTable>
	</div>

	<!-- Empty state for loadouts -->
	{#if loadouts.length === 0 && !loading}
		<div class="rounded-lg border border-slate-600 bg-slate-800/50 py-6 text-center text-slate-400">
			<p class="mb-2">No resource loadouts created yet.</p>
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
<ResourceSelectionModal
	bind:open={showResourceAssignModal}
	title="Assign Resource"
	onSelect={assignResourceFromModal}
/>
