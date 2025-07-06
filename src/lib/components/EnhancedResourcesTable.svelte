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
	import type {
		Schematic,
		SchematicResource,
		Resource,
		ResourceCaps,
		SchematicResourceLoadout,
		SchematicLoadoutSummary
	} from '$lib/types';
	import {
		applyResourceCaps,
		getResourceClassCode,
		getResourceClassCaps,
		normalizeResourceStats
	} from '$lib/utils';

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

	// Experimentation calculator states
	let selectedExperimentationProperty = $state<string | null>(null);
	let showExperimentationCalculator = $state(false);
	let assignedResources = $state<Record<string, Resource>>({});
	let experimentationResult = $state<{ current: number; max: number; percentage: number } | null>(
		null
	);
	let calculatingExperimentation = $state(false);
	let experimentationBreakdown = $state<{
		resources: Array<{
			name: string;
			resourceName: string;
			classCode: string;
			stats: Array<{
				stat: string;
				value: number;
				cap: number;
				normalized: number;
				weight: number;
				contribution: number;
			}>;
			totalContribution: number;
			amount: number;
		}>;
		statContributions: Map<
			string,
			Array<{
				resourceName: string;
				resourceSlotName: string;
				value: number;
				cap: number;
				normalized: number;
				quantity: number;
				totalQuantity: number;
				weight: number;
				contribution: number;
			}>
		>;
		grandTotal: number;
		buffedTotal: number;
		assemblyValue: number;
		buffedAssemblyValue: number;
	} | null>(null);

	// Reactively calculate experimentation value when property changes
	$effect(() => {
		if (browser && selectedExperimentationProperty) {
			calculatingExperimentation = true;
			calculateExperimentationValue(selectedExperimentationProperty)
				.then((result) => {
					experimentationResult = result;
					calculatingExperimentation = false;
				})
				.catch((error) => {
					console.error('Error calculating experimentation value:', error);
					experimentationResult = { current: 0, max: 100, percentage: 0 };
					experimentationBreakdown = null;
					calculatingExperimentation = false;
				});
		} else {
			experimentationResult = null;
			experimentationBreakdown = null;
		}
	});

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
	 * Get the resource class constraint for a specific resource slot
	 */
	function getResourceClassForSlot(resourceSlotName: string): string {
		// Find the resource requirement in the schematic
		const resourceReq = schematic.resources.find((r) => r.name === resourceSlotName);
		if (resourceReq && resourceReq.classes && resourceReq.classes.length > 0) {
			// Return the first (most specific) class requirement
			const firstClass = resourceReq.classes[0];
			return typeof firstClass === 'string'
				? firstClass
				: firstClass.code || firstClass.displayName || '';
		}
		return ''; // No constraint if not found
	}

	/**
	 * Fetch resource data for assigned resources in the current loadout
	 */
	async function loadAssignedResourcesData() {
		if (!browser || loadoutResources.length === 0) {
			assignedResources = {};
			return;
		}

		try {
			const resourceIds = loadoutResources
				.filter((lr) => lr.assigned_resource_id)
				.map((lr) => lr.assigned_resource_id);

			if (resourceIds.length === 0) {
				assignedResources = {};
				return;
			}

			// Fetch resource data for all assigned resources
			const resourcePromises = resourceIds.map(async (resourceId) => {
				const response = await fetch(`/api/resources/${resourceId}`);
				if (response.ok) {
					return await response.json();
				}
				return null;
			});

			const resources = await Promise.all(resourcePromises);
			const resourceMap: Record<string, Resource> = {};

			// Map resources by their corresponding slot names
			loadoutResources.forEach((lr, index) => {
				if (lr.assigned_resource_id && resources[index]) {
					resourceMap[lr.resource_slot_name] = resources[index];
				}
			});

			assignedResources = resourceMap;
		} catch (err) {
			console.error('Failed to load assigned resource data:', err);
			assignedResources = {};
		}
	}

	/**
	 * Calculate experimentation value based on selected property and assigned resources
	 * Uses normalized resource stats (stat/cap) for accurate SWG calculations
	 */
	async function calculateExperimentationValue(propertyDesc: string): Promise<{
		current: number;
		max: number;
		percentage: number;
	}> {
		if (!schematic.experimentation || !selectedExperimentationProperty) {
			experimentationBreakdown = null;
			return { current: 0, max: 100, percentage: 0 };
		}

		// Find the experimentation group and property
		const expGroup = schematic.experimentation.find((group) =>
			group.properties.some((prop) => prop.desc === propertyDesc)
		);

		if (!expGroup) {
			experimentationBreakdown = null;
			return { current: 0, max: 100, percentage: 0 };
		}

		const expProperty = expGroup.properties.find((prop) => prop.desc === propertyDesc);
		if (!expProperty) {
			experimentationBreakdown = null;
			return { current: 0, max: 100, percentage: 0 };
		}

		// Calculate total resource quantity for weighted calculations
		const totalResourceQuantity = schematic.resources.reduce((sum, res) => sum + res.amount, 0);

		// Collect all resource contributions by stat
		const statContributionsMap = new Map<
			string,
			Array<{
				resourceName: string;
				resourceSlotName: string;
				value: number;
				cap: number;
				normalized: number;
				quantity: number;
				totalQuantity: number;
				weight: number;
				contribution: number;
			}>
		>();

		const resourceBreakdowns = [];

		// Process each resource slot
		for (const schematicResource of schematic.resources) {
			const assignedResource = assignedResources[schematicResource.name];
			if (!assignedResource || !assignedResource.attributes) continue;

			// Get the schematic's required resource class for this slot
			const requiredClassCode = getResourceClassCode(schematicResource.classes);
			if (!requiredClassCode) continue;

			// Get the stat caps for the required class
			const classCaps = await getResourceClassCaps(requiredClassCode);
			if (!classCaps || Object.keys(classCaps).length === 0) continue;

			// Build attributes record
			const attributesRecord: Record<string, number> = {
				...(assignedResource.attributes.cr !== undefined && { cr: assignedResource.attributes.cr }),
				...(assignedResource.attributes.cd !== undefined && { cd: assignedResource.attributes.cd }),
				...(assignedResource.attributes.dr !== undefined && { dr: assignedResource.attributes.dr }),
				...(assignedResource.attributes.fl !== undefined && { fl: assignedResource.attributes.fl }),
				...(assignedResource.attributes.hr !== undefined && { hr: assignedResource.attributes.hr }),
				...(assignedResource.attributes.ma !== undefined && { ma: assignedResource.attributes.ma }),
				...(assignedResource.attributes.pe !== undefined && { pe: assignedResource.attributes.pe }),
				...(assignedResource.attributes.oq !== undefined && { oq: assignedResource.attributes.oq }),
				...(assignedResource.attributes.sr !== undefined && { sr: assignedResource.attributes.sr }),
				...(assignedResource.attributes.ut !== undefined && { ut: assignedResource.attributes.ut }),
				...(assignedResource.attributes.er !== undefined && { er: assignedResource.attributes.er })
			};

			const statContributions = [];
			let resourceTotalContribution = 0;

			// Check each stat that could contribute to this experimentation property
			const statWeights = [
				{ stat: 'cd', weight: expProperty.cd },
				{ stat: 'oq', weight: expProperty.oq },
				{ stat: 'ut', weight: expProperty.ut },
				{ stat: 'sr', weight: expProperty.sr },
				{ stat: 'pe', weight: expProperty.pe },
				{ stat: 'hr', weight: expProperty.hr },
				{ stat: 'ma', weight: expProperty.ma },
				{ stat: 'cr', weight: expProperty.cr },
				{ stat: 'dr', weight: expProperty.dr },
				{ stat: 'fl', weight: expProperty.fl },
				{ stat: 'er', weight: expProperty.er }
			];

			for (const { stat, weight } of statWeights) {
				if (
					weight &&
					weight > 0 &&
					attributesRecord[stat] !== undefined &&
					attributesRecord[stat] > 0
				) {
					const statValue = attributesRecord[stat];
					const cap = classCaps[stat as keyof ResourceCaps] || 1;
					const normalized = statValue / cap;

					// SWG experimentation formula: (resource_stat/cap) * (quantity/total_quantity_for_this_stat) * weight * 1000
					// First, we need to calculate the total quantity of resources that have this specific stat (stat > 0)
					let totalQuantityForThisStat = 0;
					for (const otherSchematicResource of schematic.resources) {
						const otherAssignedResource = assignedResources[otherSchematicResource.name];
						if (
							otherAssignedResource &&
							otherAssignedResource.attributes &&
							otherAssignedResource.attributes[stat] !== undefined &&
							otherAssignedResource.attributes[stat] > 0
						) {
							totalQuantityForThisStat += otherSchematicResource.amount;
						}
					}

					const quantityRatio = schematicResource.amount / totalQuantityForThisStat;
					// Convert percentage display value (e.g., 33) to real percentage (e.g., 0.33)
					const realWeight = weight / 100;
					const contribution = normalized * quantityRatio * realWeight * 1000;

					const statContribution = {
						stat: stat.toUpperCase(),
						value: statValue,
						cap: cap,
						normalized: normalized,
						weight: weight,
						contribution: contribution
					};

					statContributions.push(statContribution);
					resourceTotalContribution += contribution;

					// Also collect for stat-wise breakdown
					if (!statContributionsMap.has(stat.toUpperCase())) {
						statContributionsMap.set(stat.toUpperCase(), []);
					}

					statContributionsMap.get(stat.toUpperCase())!.push({
						resourceName: assignedResource.name,
						resourceSlotName: schematicResource.name,
						value: statValue,
						cap: cap,
						normalized: normalized,
						quantity: schematicResource.amount,
						totalQuantity: totalQuantityForThisStat,
						weight: weight,
						realWeight: realWeight,
						contribution: contribution
					});
				}
			}

			if (statContributions.length > 0) {
				resourceBreakdowns.push({
					name: schematicResource.name,
					resourceName: assignedResource.name,
					classCode: requiredClassCode,
					stats: statContributions,
					totalContribution: resourceTotalContribution,
					amount: schematicResource.amount
				});
			}
		}

		// Calculate total from all contributions
		let grandTotal = 0;
		resourceBreakdowns.forEach((resource) => {
			grandTotal += resource.totalContribution;
		});

		if (resourceBreakdowns.length === 0) {
			experimentationBreakdown = null;
			return { current: 0, max: 100, percentage: 0 };
		}

		// Apply 4% buff for quality (representing entertainer buff + bracelet)
		const buffedTotal = Math.min(1000, grandTotal * 1.04);

		// Calculate initial assembly value without experimentation: Y = X*(0.000015*X+0.015)
		const assemblyValue = grandTotal * (0.000015 * grandTotal + 0.015);

		// Calculate buffed assembly value using the buffed total
		const buffedAssemblyValue = buffedTotal * (0.000015 * buffedTotal + 0.015);

		// Store the detailed breakdown including stat-wise contributions
		experimentationBreakdown = {
			resources: resourceBreakdowns,
			statContributions: statContributionsMap,
			grandTotal: grandTotal,
			buffedTotal: buffedTotal,
			assemblyValue: assemblyValue,
			buffedAssemblyValue: buffedAssemblyValue
		};

		// SWG uses 1000 as the theoretical maximum for experimentation points
		// The percentage is typically calculated based on this maximum
		const percentage = Math.min(100, (buffedTotal / 1000) * 100);

		return {
			current: Math.round(buffedTotal),
			max: 1000,
			percentage: Math.round(percentage * 100) / 100
		};
	}

	/**
	 * Get available experimentation properties for the property selector
	 */
	const availableExperimentationProperties = $derived(() => {
		if (!schematic.experimentation) return [];

		const properties: string[] = [];
		schematic.experimentation.forEach((group) => {
			group.properties.forEach((prop) => {
				if (!properties.includes(prop.desc)) {
					properties.push(prop.desc);
				}
			});
		});

		return properties;
	});

	/**
	 * Check if experimentation calculator should be shown
	 */
	const canShowExperimentationCalculator = $derived(() => {
		return (
			currentLoadout &&
			schematic.experimentation &&
			schematic.experimentation.length > 0 &&
			loadoutResources.some((lr) => lr.assigned_resource_id)
		);
	});

	/**
	 * Check if loadout is fully assigned (all slots have resources)
	 */
	const isLoadoutFullyAssigned = $derived(() => {
		if (!currentLoadout || loadoutResources.length === 0) return false;
		return loadoutResources.every((lr) => lr.assigned_resource_id);
	});

	// Auto-show experimentation calculator when loadout is fully assigned
	$effect(() => {
		if (canShowExperimentationCalculator() && isLoadoutFullyAssigned()) {
			showExperimentationCalculator = true;
		}
	});
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

	// Load assigned resource data when loadout resources change
	$effect(() => {
		if (browser && loadoutResources.length > 0) {
			loadAssignedResourcesData();
		}
	});

	$effect(() => {
		if (browser && currentLoadout) {
			loadAssignedResourcesData();
		}
	});

	$effect(() => {
		if (browser && selectedExperimentationProperty) {
			calculatingExperimentation = true;
			calculateExperimentationValue(selectedExperimentationProperty)
				.then((result) => {
					experimentationResult = result;
					calculatingExperimentation = false;
				})
				.catch((error) => {
					console.error('Error calculating experimentation value:', error);
					experimentationResult = { current: 0, max: 100, percentage: 0 };
					calculatingExperimentation = false;
				});
		} else {
			experimentationResult = null;
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

	<!-- Experimentation Calculator -->
	{#if canShowExperimentationCalculator()}
		<div class="rounded-lg border border-blue-600 bg-slate-800">
			<div class="border-b border-slate-600 px-4 py-3">
				<div class="flex items-center justify-between">
					<h5 class="text-lg font-medium text-white">🧪 Experimentation Calculator</h5>
					<Button
						variant="secondary"
						size="sm"
						onclick={() => (showExperimentationCalculator = !showExperimentationCalculator)}
					>
						{showExperimentationCalculator ? 'Hide' : 'Show'}
					</Button>
				</div>
			</div>

			{#if showExperimentationCalculator}
				<div class="space-y-4 p-4">
					<!-- Property Selector -->
					<div>
						<label
							for="experimentation-property-select"
							class="mb-2 block text-sm font-medium text-slate-300"
						>
							Select Experimentation Property
						</label>
						<select
							id="experimentation-property-select"
							bind:value={selectedExperimentationProperty}
							class="w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
						>
							<option value={null}>-- Choose a property to analyze --</option>
							{#each availableExperimentationProperties() as property}
								<option value={property}>{property}</option>
							{/each}
						</select>
					</div>

					<!-- Calculation Results -->
					{#if selectedExperimentationProperty}
						{#if calculatingExperimentation}
							<div class="rounded-lg border border-slate-600 bg-slate-700/50 p-4">
								<div class="text-center text-slate-400">Calculating...</div>
							</div>
						{:else if experimentationResult}
							<div class="rounded-lg border border-slate-600 bg-slate-700/50 p-4">
								<h6 class="mb-3 text-base font-medium text-white">
									{selectedExperimentationProperty}
								</h6>

								<div class="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
									<div class="text-center">
										<div class="text-2xl font-bold text-blue-400">
											{experimentationResult.current}
										</div>
										<div class="text-sm text-slate-400">Current Value</div>
									</div>
									<div class="text-center">
										<div class="text-2xl font-bold text-green-400">{experimentationResult.max}</div>
										<div class="text-sm text-slate-400">Maximum Possible</div>
									</div>
									<div class="text-center">
										<div
											class="text-2xl font-bold {experimentationResult.percentage >= 90
												? 'text-green-400'
												: experimentationResult.percentage >= 75
													? 'text-yellow-400'
													: 'text-red-400'}"
										>
											{experimentationResult.percentage}%
										</div>
										<div class="text-sm text-slate-400">Effectiveness</div>
									</div>
								</div>

								<!-- Progress Bar -->
								<div class="mb-4">
									<div class="mb-1 flex items-center justify-between">
										<span class="text-sm text-slate-300">Resource Quality Impact</span>
										<span class="text-sm text-slate-400">{experimentationResult.percentage}%</span>
									</div>
									<div class="h-2 w-full rounded-full bg-slate-600">
										<div
											class="h-2 rounded-full transition-all duration-300 {experimentationResult.percentage >=
											90
												? 'bg-green-500'
												: experimentationResult.percentage >= 75
													? 'bg-yellow-500'
													: 'bg-red-500'}"
											style="width: {Math.min(100, experimentationResult.percentage)}%"
										></div>
									</div>
								</div>

								<!-- Quality Recommendations -->
								<div class="text-sm text-slate-300">
									{#if experimentationResult.percentage >= 96}
										<div class="flex items-center text-green-400">
											<span class="mr-2">✅</span>
											Excellent! Your resources are providing maximum experimentation potential.
										</div>
									{:else if experimentationResult.percentage >= 90}
										<div class="flex items-center text-green-400">
											<span class="mr-2">✅</span>
											Great resource quality! Very close to maximum potential.
										</div>
									{:else if experimentationResult.percentage >= 75}
										<div class="flex items-center text-yellow-400">
											<span class="mr-2">⚠️</span>
											Good resources, but higher quality could improve this property significantly.
										</div>
									{:else if experimentationResult.percentage >= 50}
										<div class="flex items-center text-orange-400">
											<span class="mr-2">⚠️</span>
											Consider finding better resources for this property. Current quality is limiting
											your potential.
										</div>
									{:else}
										<div class="flex items-center text-red-400">
											<span class="mr-2">❌</span>
											Poor resource quality is severely limiting this property. Seek higher quality resources.
										</div>
									{/if}
								</div>
							</div>

							<!-- Detailed Calculation Breakdown - SWG Style -->
							{#if experimentationBreakdown}
								<div class="rounded-lg border border-slate-600 bg-slate-800/50 p-4">
									<h6 class="mb-4 text-base font-medium text-white">
										{selectedExperimentationProperty}
									</h6>

									<!-- Show breakdown by stat (like in reference) -->
									{#each Array.from(experimentationBreakdown.statContributions.entries()) as [statName, contributions]}
										<div class="mb-3 font-mono">
											<div
												class="flex items-center justify-between rounded bg-slate-700/50 px-3 py-2"
											>
												<div class="flex items-center space-x-2">
													<span class="w-8 font-bold text-blue-300">{statName}</span>
													<span class="text-slate-400">{contributions[0]?.weight}%:</span>
												</div>
												<div class="flex items-center space-x-2 text-sm">
													{#each contributions as contrib, index}
														{#if index > 0}
															<span class="text-slate-500">+</span>
														{/if}
														<span class="text-green-400">{contrib.contribution.toFixed(2)}</span>
													{/each}
													<span class="text-slate-500">=</span>
													<span class="font-bold text-orange-400">
														{contributions.reduce((sum, c) => sum + c.contribution, 0).toFixed(2)}
													</span>
												</div>
											</div>

											<!-- Show individual resource contributions for this stat -->
											<div class="mt-1 ml-4 space-y-1 text-xs text-slate-400">
												{#each contributions as contrib}
													<div class="flex items-center justify-between">
														<span>{contrib.resourceSlotName} ({contrib.resourceName})</span>
														<span>
															{contrib.value}/{contrib.cap} × {contrib.quantity}/{contrib.totalQuantity}
															× {(contrib.weight / 100).toFixed(4)} × 1000 = {contrib.contribution.toFixed(
																4
															)}
														</span>
													</div>
												{/each}
											</div>
										</div>
									{/each}

									<!-- Final calculation -->
									<div class="mt-4 border-t border-slate-600 pt-3 font-mono">
										<div class="flex items-center justify-between text-lg">
											<span class="font-bold text-white">Base Total =</span>
											<div class="flex items-center space-x-2">
												{#each Array.from(experimentationBreakdown.statContributions.entries()) as [statName, contributions], index}
													{#if index > 0}
														<span class="text-slate-500">+</span>
													{/if}
													<span class="text-green-400">
														{contributions.reduce((sum, c) => sum + c.contribution, 0).toFixed(2)}
													</span>
												{/each}
												<span class="text-slate-500">=</span>
												<span class="font-bold text-yellow-400"
													>{experimentationBreakdown.grandTotal.toFixed(4)}</span
												>
											</div>
										</div>
										<div class="mt-2 flex items-center justify-between text-lg">
											<span class="font-bold text-white">With 4% Buff =</span>
											<div class="flex items-center space-x-2">
												<span class="text-yellow-400"
													>{experimentationBreakdown.grandTotal.toFixed(4)}</span
												>
												<span class="text-slate-500">×</span>
												<span class="text-blue-400">1.04</span>
												<span class="text-slate-500">=</span>
												<span class="font-bold text-orange-400"
													>{experimentationBreakdown.buffedTotal.toFixed(4)}</span
												>
											</div>
										</div>
										<div class="mt-2 flex items-center justify-between text-lg">
											<span class="font-bold text-white">Assembly Value =</span>
											<div class="flex items-center space-x-2">
												<span class="text-yellow-400"
													>{experimentationBreakdown.grandTotal.toFixed(4)}</span
												>
												<span class="text-slate-500">×</span>
												<span class="text-blue-400"
													>(0.000015 × {experimentationBreakdown.grandTotal.toFixed(4)} + 0.015)</span
												>
												<span class="text-slate-500">=</span>
												<span class="font-bold text-purple-400"
													>{experimentationBreakdown.assemblyValue.toFixed(4)}</span
												>
											</div>
										</div>
										<div class="mt-2 flex items-center justify-between text-lg">
											<span class="font-bold text-white">Buffed Assembly Value =</span>
											<div class="flex items-center space-x-2">
												<span class="text-orange-400"
													>{experimentationBreakdown.buffedTotal.toFixed(4)}</span
												>
												<span class="text-slate-500">×</span>
												<span class="text-blue-400"
													>(0.000015 × {experimentationBreakdown.buffedTotal.toFixed(4)} + 0.015)</span
												>
												<span class="text-slate-500">=</span>
												<span class="font-bold text-green-400"
													>{experimentationBreakdown.buffedAssemblyValue.toFixed(4)}</span
												>
											</div>
										</div>
									</div>

									<!-- Debug Information -->
									<div class="mt-4 rounded bg-slate-900/50 p-3 text-xs text-slate-500">
										<div class="mb-2 font-bold">Debug - Formula Used:</div>
										<div class="font-mono">
											contribution = (resource_stat / resource_cap) × (resource_quantity /
											total_quantity_for_stat) × stat_weight × 1000
										</div>
										<div class="mt-2">
											<span class="font-bold">Note:</span> Total quantity is calculated per stat (only
											resources with that stat count)
										</div>
										<div class="mt-1">
											<span class="font-bold">Grand Total:</span>
											{experimentationBreakdown.grandTotal.toFixed(6)}
										</div>
										<div>
											<span class="font-bold">With 4% Buff:</span>
											{experimentationBreakdown.buffedTotal.toFixed(6)}
										</div>
										<div class="mt-2">
											<span class="font-bold">Raw Experimentation Property Weights:</span>
											{#if selectedExperimentationProperty}
												{@const expGroup = schematic.experimentation?.find((group) =>
													group.properties.some(
														(prop) => prop.desc === selectedExperimentationProperty
													)
												)}
												{#if expGroup}
													{@const expProperty = expGroup.properties.find(
														(prop) => prop.desc === selectedExperimentationProperty
													)}
													{#if expProperty}
														<div class="mt-1 font-mono text-xs">
															{JSON.stringify(expProperty, null, 2)}
														</div>
														{@const totalWeight =
															(expProperty.cd || 0) +
															(expProperty.oq || 0) +
															(expProperty.ut || 0) +
															(expProperty.sr || 0) +
															(expProperty.pe || 0) +
															(expProperty.hr || 0) +
															(expProperty.ma || 0) +
															(expProperty.cr || 0) +
															(expProperty.dr || 0) +
															(expProperty.fl || 0) +
															(expProperty.er || 0)}
														<div class="mt-1 text-yellow-400">
															Total Weight: {totalWeight.toFixed(6)}% {Math.abs(totalWeight - 100) >
															0.001
																? '⚠️ (Should be 100%)'
																: '✅'}
														</div>
													{/if}
												{/if}
											{/if}
										</div>
									</div>
								</div>
							{/if}
						{/if}
					{/if}
				</div>
			{/if}
		</div>
	{/if}

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
	title={selectedResourceSlot ? `Assign Resource for ${selectedResourceSlot}` : 'Assign Resource'}
	onSelect={handleResourceSelect}
	constrainToClass={selectedResourceSlot ? getResourceClassForSlot(selectedResourceSlot) : ''}
	showSpawnStatus={true}
/>
