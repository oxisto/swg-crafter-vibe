<script lang="ts">
	import { inventory, settings, updateRecommendedStockLevel } from '$lib/stores.js';
	import { PART_CATEGORIES, MARK_LEVELS } from '$lib/types.js';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	// Initialize settings store with server data if available
	if (data && 'settings' in data) {
		settings.set(data.settings);
	}

	// Settings state
	let currentSettings = $state($settings || { recommendedStockLevel: 10 });
	let editingRecommendedLevel = $state(false);
	let tempRecommendedLevel = $state(10);

	// Update local state when settings store changes
	$effect(() => {
		currentSettings = $settings || { recommendedStockLevel: 10 };
		if (!editingRecommendedLevel) {
			tempRecommendedLevel = currentSettings.recommendedStockLevel;
		}
	});

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
</script>

<svelte:head>
	<title>SWG Shipwright - Settings</title>
</svelte:head>

<div class="h-full">
	<div class="container mx-auto px-6 py-8 max-w-4xl">
		<header class="text-center mb-8">
			<h1 class="text-3xl font-bold text-yellow-400 mb-2">
				Settings
			</h1>
			<p class="text-slate-400">
				Manage your inventory data and application preferences
			</p>
		</header>

		<div class="space-y-8">
			<!-- Inventory Settings Section -->
			<section class="bg-slate-800 rounded-lg p-6 border border-slate-700">
				<h2 class="text-xl font-semibold text-white mb-4 flex items-center gap-2">
					<span>📊</span>
					Inventory Settings
				</h2>
				
				<div class="space-y-4">
					<div class="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
						<div>
							<h3 class="text-lg font-medium text-white">Recommended Stock Level</h3>
							<p class="text-sm text-slate-400">
								Items below this quantity will be highlighted in red
							</p>
						</div>
						<div class="flex items-center gap-3">
							{#if editingRecommendedLevel}
								<input
									type="number"
									bind:value={tempRecommendedLevel}
									onkeydown={handleRecommendedLevelKeydown}
									class="w-20 px-3 py-1 bg-slate-600 border border-slate-500 rounded text-white text-center"
									min="0"
									step="1"
								/>
								<button
									onclick={saveRecommendedLevel}
									class="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
								>
									✓
								</button>
								<button
									onclick={cancelEditRecommendedLevel}
									class="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
								>
									✕
								</button>
							{:else}
								<span class="text-xl font-bold text-blue-400">
									{currentSettings.recommendedStockLevel}
								</span>
								<button
									onclick={editRecommendedLevel}
									class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
								>
									Edit
								</button>
							{/if}
						</div>
					</div>
				</div>
			</section>

			<!-- Data Management Section -->
			<section class="bg-slate-800 rounded-lg p-6 border border-slate-700">
				<h2 class="text-xl font-semibold text-white mb-4 flex items-center gap-2">
					<span>💾</span>
					Data Management
				</h2>
				
				<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
					<button
						onclick={exportInventory}
						class="flex flex-col items-center gap-2 p-4 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
					>
						<span class="text-2xl">📤</span>
						<span class="font-medium">Export Data</span>
						<span class="text-sm text-blue-100 text-center">
							Export your inventory to JSON format
						</span>
					</button>

					<button
						onclick={importInventory}
						class="flex flex-col items-center gap-2 p-4 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
					>
						<span class="text-2xl">📥</span>
						<span class="font-medium">Import Data</span>
						<span class="text-sm text-green-100 text-center">
							Import inventory from JSON format
						</span>
					</button>

					<button
						onclick={clearAllInventory}
						class="flex flex-col items-center gap-2 p-4 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
					>
						<span class="text-2xl">🗑️</span>
						<span class="font-medium">Clear All</span>
						<span class="text-sm text-red-100 text-center">
							Reset all inventory quantities to zero
						</span>
					</button>
				</div>
			</section>

			<!-- Application Info Section -->
			<section class="bg-slate-800 rounded-lg p-6 border border-slate-700">
				<h2 class="text-xl font-semibold text-white mb-4 flex items-center gap-2">
					<span>ℹ️</span>
					Application Information
				</h2>
				
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div>
						<h3 class="text-lg font-medium text-yellow-400 mb-2">Part Categories</h3>
						<ul class="space-y-1 text-slate-300">
							{#each PART_CATEGORIES as category}
								<li class="flex items-center gap-2">
									<span class="w-2 h-2 bg-blue-400 rounded-full"></span>
									{category}
								</li>
							{/each}
						</ul>
					</div>

					<div>
						<h3 class="text-lg font-medium text-yellow-400 mb-2">Mark Levels</h3>
						<ul class="space-y-1 text-slate-300">
							{#each MARK_LEVELS as level}
								<li class="flex items-center gap-2">
									<span class="w-2 h-2 bg-yellow-400 rounded-full"></span>
									Mark {level}
								</li>
							{/each}
						</ul>
					</div>
				</div>

				<div class="mt-6 pt-6 border-t border-slate-700">
					<p class="text-slate-400 text-sm">
						<strong class="text-white">Server:</strong> Star Wars Galaxies - Restoration III
					</p>
					<p class="text-slate-400 text-sm mt-1">
						<strong class="text-white">Purpose:</strong> Shipwright inventory management and stock tracking
					</p>
				</div>
			</section>
		</div>
	</div>
</div>

<!-- Export Modal -->
{#if showExportModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
		<div class="bg-slate-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-auto">
			<h3 class="text-xl font-semibold text-white mb-4">Export Inventory Data</h3>
			
			<textarea
				readonly
				value={exportedData}
				class="w-full h-64 bg-slate-700 border border-slate-600 rounded p-3 text-white font-mono text-sm"
				placeholder="Exported data will appear here..."
			></textarea>
			
			<div class="flex gap-3 mt-4">
				<button
					onclick={copyToClipboard}
					class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
				>
					Copy to Clipboard
				</button>
				<button
					onclick={closeModal}
					class="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded transition-colors"
				>
					Close
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Import Modal -->
{#if showImportModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
		<div class="bg-slate-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-auto">
			<h3 class="text-xl font-semibold text-white mb-4">Import Inventory Data</h3>
			
			<textarea
				bind:value={importData}
				class="w-full h-64 bg-slate-700 border border-slate-600 rounded p-3 text-white font-mono text-sm"
				placeholder="Paste your JSON inventory data here..."
			></textarea>
			
			<div class="flex gap-3 mt-4">
				<button
					onclick={confirmImport}
					class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
					disabled={!importData.trim()}
				>
					Import Data
				</button>
				<button
					onclick={closeModal}
					class="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded transition-colors"
				>
					Cancel
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Clear Confirmation Modal -->
{#if showClearModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
		<div class="bg-slate-800 rounded-lg p-6 max-w-md w-full">
			<h3 class="text-xl font-semibold text-white mb-4 text-center">⚠️ Confirm Clear All</h3>
			
			<p class="text-slate-300 text-center mb-6">
				Are you sure you want to clear all inventory quantities? This action cannot be undone.
			</p>
			
			<div class="flex gap-3 justify-center">
				<button
					onclick={confirmClear}
					class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
				>
					Yes, Clear All
				</button>
				<button
					onclick={closeModal}
					class="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded transition-colors"
				>
					Cancel
				</button>
			</div>
		</div>
	</div>
{/if}
