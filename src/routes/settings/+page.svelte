<script lang="ts">
	import {
		inventory,
		settings,
		updateRecommendedStockLevel,
		updateSellValues
	} from '$lib/stores.js';
	import { PART_CATEGORIES, MARK_LEVELS } from '$lib/types.js';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Card from '$lib/components/Card.svelte';
	import Section from '$lib/components/Section.svelte';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	// Initialize settings store with server data if available
	if (data && 'settings' in data) {
		settings.set(data.settings);
	}

	// Settings state
	let currentSettings = $state(
		$settings || {
			recommendedStockLevel: 10,
			sellValues: { I: 0, II: 0, III: 0, IV: 0, V: 0 }
		}
	);
	let editingRecommendedLevel = $state(false);
	let tempRecommendedLevel = $state(10);
	let editingSellValues = $state(false);
	let tempSellValues = $state({ I: 0, II: 0, III: 0, IV: 0, V: 0 });

	// Update local state when settings store changes
	$effect(() => {
		currentSettings = $settings || {
			recommendedStockLevel: 10,
			sellValues: { I: 0, II: 0, III: 0, IV: 0, V: 0 }
		};
		if (!editingRecommendedLevel) {
			tempRecommendedLevel = currentSettings.recommendedStockLevel;
		}
		if (!editingSellValues) {
			tempSellValues = { ...currentSettings.sellValues };
		}
	});

	// Favorites restoration state
	let restoringFavorites = $state(false);
	let favoritesMessage = $state<string | null>(null);

	async function restoreFavorites() {
		restoringFavorites = true;
		favoritesMessage = null;

		try {
			const response = await fetch('/api/schematics/restore-favorites', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result = await response.json();

			if (result.success) {
				favoritesMessage = `Successfully marked ${result.updatedCount} schematics with loadouts as favorites.`;
			} else {
				favoritesMessage = 'Failed to restore favorites. Please try again.';
			}
		} catch (error) {
			console.error('Error restoring favorites:', error);
			favoritesMessage = 'An error occurred while restoring favorites. Please try again.';
		} finally {
			restoringFavorites = false;
		}
	}

	let showExportModal = $state(false);
	let showImportModal = $state(false);
	let showClearModal = $state(false);
	let importData = $state('');
	let exportedData = $state('');

	function exportInventory() {
		const currentInventory = $inventory || {};
		exportedData = JSON.stringify(currentInventory, null, 2);
		showExportModal = true;
	}

	function importInventory() {
		showImportModal = true;
	}

	function confirmImport() {
		try {
			const data = JSON.parse(importData);
			// Validate the data structure
			if (typeof data === 'object' && data !== null) {
				inventory.set(data);
				showImportModal = false;
				importData = '';
				alert('Inventory imported successfully!');
			} else {
				alert('Invalid data format. Please check your JSON.');
			}
		} catch (error) {
			alert('Invalid JSON format. Please check your data.');
		}
	}

	function clearAllInventory() {
		showClearModal = true;
	}

	function confirmClear() {
		const emptyInventory: Record<string, number> = {};
		inventory.set(emptyInventory);
		showClearModal = false;
		alert('All inventory cleared!');
	}

	function copyToClipboard() {
		navigator.clipboard.writeText(exportedData);
		alert('Exported data copied to clipboard!');
	}

	function closeModal() {
		showExportModal = false;
		showImportModal = false;
		showClearModal = false;
		importData = '';
		exportedData = '';
	}

	function editRecommendedLevel() {
		tempRecommendedLevel = currentSettings.recommendedStockLevel;
		editingRecommendedLevel = true;
	}

	async function saveRecommendedLevel() {
		const level = parseInt(tempRecommendedLevel.toString(), 10);
		if (!isNaN(level) && level >= 0) {
			try {
				await updateRecommendedStockLevel(level);
				editingRecommendedLevel = false;
			} catch (error) {
				console.error('Failed to save recommended level:', error);
			}
		}
	}

	function cancelEditRecommendedLevel() {
		editingRecommendedLevel = false;
	}

	function handleRecommendedLevelKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			saveRecommendedLevel();
		} else if (event.key === 'Escape') {
			cancelEditRecommendedLevel();
		}
	}

	function editSellValues() {
		tempSellValues = { ...currentSettings.sellValues };
		editingSellValues = true;
	}

	async function saveSellValues() {
		try {
			// Validate all values are numbers >= 0
			const validatedValues: Record<string, number> = {};
			for (const [markLevel, value] of Object.entries(tempSellValues)) {
				const numValue = parseFloat(value.toString());
				if (isNaN(numValue) || numValue < 0) {
					alert(`Invalid sell value for Mark ${markLevel}. Please enter a number >= 0.`);
					return;
				}
				validatedValues[markLevel] = numValue;
			}

			await updateSellValues(validatedValues);
			editingSellValues = false;
		} catch (error) {
			console.error('Failed to save sell values:', error);
		}
	}

	function cancelEditSellValues() {
		editingSellValues = false;
	}

	function handleSellValueKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			saveSellValues();
		} else if (event.key === 'Escape') {
			cancelEditSellValues();
		}
	}
</script>

<svelte:head>
	<title>SWG Shipwright - Settings</title>
</svelte:head>

<PageLayout maxWidth="4xl" padding="default">
	<PageHeader
		title="Settings"
		subtitle="Manage your inventory data and application preferences"
		emoji="⚙️"
		centered={true}
	/>

	<div class="space-y-8">
		<!-- Inventory Settings Section -->
		<Section title="Inventory Settings" icon="📊">
			<div class="space-y-4">
				<Card>
					<div class="flex items-center justify-between">
						<div>
							<h3 class="text-lg font-medium text-white">Recommended Stock Level</h3>
							<p class="text-sm text-slate-400">
								Items below this quantity will be highlighted in red
							</p>
						</div>
						<div class="flex items-center gap-3">
							{#if editingRecommendedLevel}
								<Input
									type="number"
									bind:value={tempRecommendedLevel}
									onkeydown={handleRecommendedLevelKeydown}
									className="w-20 text-center"
									min="0"
									step="1"
								/>
								<Button onclick={saveRecommendedLevel} variant="success" size="sm">✓</Button>
								<Button onclick={cancelEditRecommendedLevel} variant="secondary" size="sm">
									✕
								</Button>
							{:else}
								<span class="text-xl font-bold text-blue-400">
									{currentSettings.recommendedStockLevel}
								</span>
								<Button onclick={editRecommendedLevel} variant="primary" size="sm">Edit</Button>
							{/if}
						</div>
					</div>
				</Card>

				<Card>
					<div class="flex items-center justify-between">
						<div>
							<h3 class="text-lg font-medium text-white">Sell Values</h3>
							<p class="text-sm text-slate-400">Set the sell values for each mark level</p>
						</div>
						<div class="flex items-center gap-3">
							{#if !editingSellValues}
								<Button onclick={editSellValues} variant="primary" size="sm">Edit</Button>
							{/if}
						</div>
					</div>

					{#if editingSellValues}
						<div class="mt-4 space-y-3">
							<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
								{#each MARK_LEVELS as markLevel}
									<div class="flex flex-col gap-1">
										<Input
											id="sell-value-{markLevel}"
											label="Mark {markLevel}"
											type="number"
											bind:value={tempSellValues[markLevel]}
											className="text-center"
											min="0"
											step="0.01"
											placeholder="0.00"
										/>
									</div>
								{/each}
							</div>
							<div class="flex justify-end gap-2">
								<Button onclick={cancelEditSellValues} variant="secondary">Cancel</Button>
								<Button onclick={saveSellValues} variant="success">Save</Button>
							</div>
						</div>
					{:else}
						<div class="mt-4">
							<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
								{#each MARK_LEVELS as markLevel}
									<div class="rounded bg-slate-600 p-3 text-center">
										<div class="text-sm font-medium text-slate-300">Mark {markLevel}</div>
										<div class="text-lg font-bold text-blue-400">
											{currentSettings.sellValues[markLevel] || 0}
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</Card>
			</div>
		</Section>

		<!-- Data Management Section -->
		<Section title="Data Management" icon="💾">
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Button
					onclick={exportInventory}
					variant="primary"
					className="flex flex-col items-center gap-2 p-6 h-auto"
				>
					<span class="text-2xl">📤</span>
					<span class="font-medium">Export Data</span>
					<span class="text-center text-sm opacity-75"> Export your inventory to JSON format </span>
				</Button>

				<Button
					onclick={importInventory}
					variant="success"
					className="flex flex-col items-center gap-2 p-6 h-auto"
				>
					<span class="text-2xl">📥</span>
					<span class="font-medium">Import Data</span>
					<span class="text-center text-sm opacity-75"> Import inventory from JSON format </span>
				</Button>

				<Button
					onclick={restoreFavorites}
					variant="secondary"
					className="flex flex-col items-center gap-2 p-6 h-auto"
					disabled={restoringFavorites}
				>
					<span class="text-2xl">⭐</span>
					<span class="font-medium">
						{restoringFavorites ? 'Restoring...' : 'Restore Favorites'}
					</span>
					<span class="text-center text-sm opacity-75">
						Mark all schematics with loadouts as favorites
					</span>
				</Button>

				<Button
					onclick={clearAllInventory}
					variant="danger"
					className="flex flex-col items-center gap-2 p-6 h-auto"
				>
					<span class="text-2xl">🗑️</span>
					<span class="font-medium">Clear All</span>
					<span class="text-center text-sm opacity-75">
						Reset all inventory quantities to zero
					</span>
				</Button>
			</div>

			{#if favoritesMessage}
				<div class="mt-4 rounded-lg border border-green-500/20 bg-green-500/10 p-3">
					<p class="text-sm text-green-400">{favoritesMessage}</p>
				</div>
			{/if}
		</Section>

		<!-- Application Info Section -->
		<Section title="Application Information" icon="ℹ️">
			<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
				<div>
					<h3 class="mb-2 text-lg font-medium text-yellow-400">Part Categories</h3>
					<ul class="space-y-1 text-slate-300">
						{#each PART_CATEGORIES as category}
							<li class="flex items-center gap-2">
								<span class="h-2 w-2 rounded-full bg-blue-400"></span>
								{category}
							</li>
						{/each}
					</ul>
				</div>

				<div>
					<h3 class="mb-2 text-lg font-medium text-yellow-400">Mark Levels</h3>
					<ul class="space-y-1 text-slate-300">
						{#each MARK_LEVELS as level}
							<li class="flex items-center gap-2">
								<span class="h-2 w-2 rounded-full bg-yellow-400"></span>
								Mark {level}
							</li>
						{/each}
					</ul>
				</div>
			</div>

			<div class="mt-6 border-t border-slate-700 pt-6">
				<p class="text-sm text-slate-400">
					<strong class="text-white">Server:</strong> Star Wars Galaxies - Restoration III
				</p>
				<p class="mt-1 text-sm text-slate-400">
					<strong class="text-white">Purpose:</strong> Shipwright inventory management and stock tracking
				</p>
			</div>
		</Section>
	</div>
</PageLayout>

<!-- Export Modal -->
<Modal bind:open={showExportModal} title="Export Inventory Data" maxWidth="max-w-2xl">
	<textarea
		readonly
		value={exportedData}
		class="h-64 w-full rounded border border-slate-600 bg-slate-700 p-3 font-mono text-sm text-white"
		placeholder="Exported data will appear here..."
	></textarea>

	{#snippet actions()}
		<Button onclick={copyToClipboard} variant="primary">Copy to Clipboard</Button>
		<Button onclick={closeModal} variant="secondary">Close</Button>
	{/snippet}
</Modal>

<!-- Import Modal -->
<Modal bind:open={showImportModal} title="Import Inventory Data" maxWidth="max-w-2xl">
	<textarea
		bind:value={importData}
		class="h-64 w-full rounded border border-slate-600 bg-slate-700 p-3 font-mono text-sm text-white"
		placeholder="Paste your JSON inventory data here..."
	></textarea>

	{#snippet actions()}
		<Button onclick={confirmImport} variant="success" disabled={!importData.trim()}>
			Import Data
		</Button>
		<Button onclick={closeModal} variant="secondary">Cancel</Button>
	{/snippet}
</Modal>

<!-- Clear Confirmation Modal -->
<Modal bind:open={showClearModal} title="⚠️ Confirm Clear All" maxWidth="max-w-md">
	<p class="mb-6 text-center text-slate-300">
		Are you sure you want to clear all inventory quantities? This action cannot be undone.
	</p>

	{#snippet actions()}
		<Button onclick={confirmClear} variant="danger">Yes, Clear All</Button>
		<Button onclick={closeModal} variant="secondary">Cancel</Button>
	{/snippet}
</Modal>
