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
	<div class="container mx-auto max-w-4xl px-6 py-8">
		<header class="mb-8 text-center">
			<h1 class="mb-2 text-3xl font-bold text-yellow-400">Settings</h1>
			<p class="text-slate-400">Manage your inventory data and application preferences</p>
		</header>

		<div class="space-y-8">
			<!-- Inventory Settings Section -->
			<section class="rounded-lg border border-slate-700 bg-slate-800 p-6">
				<h2 class="mb-4 flex items-center gap-2 text-xl font-semibold text-white">
					<span>📊</span>
					Inventory Settings
				</h2>

				<div class="space-y-4">
					<div class="flex items-center justify-between rounded-lg bg-slate-700 p-4">
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
									class="w-20 rounded border border-slate-500 bg-slate-600 px-3 py-1 text-center text-white"
									min="0"
									step="1"
								/>
								<button
									onclick={saveRecommendedLevel}
									class="rounded bg-green-600 px-3 py-1 text-sm text-white transition-colors hover:bg-green-700"
								>
									✓
								</button>
								<button
									onclick={cancelEditRecommendedLevel}
									class="rounded bg-gray-600 px-3 py-1 text-sm text-white transition-colors hover:bg-gray-700"
								>
									✕
								</button>
							{:else}
								<span class="text-xl font-bold text-blue-400">
									{currentSettings.recommendedStockLevel}
								</span>
								<button
									onclick={editRecommendedLevel}
									class="rounded bg-blue-600 px-3 py-1 text-sm text-white transition-colors hover:bg-blue-700"
								>
									Edit
								</button>
							{/if}
						</div>
					</div>
				</div>
			</section>

			<!-- Data Management Section -->
			<section class="rounded-lg border border-slate-700 bg-slate-800 p-6">
				<h2 class="mb-4 flex items-center gap-2 text-xl font-semibold text-white">
					<span>💾</span>
					Data Management
				</h2>

				<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
					<button
						onclick={exportInventory}
						class="flex flex-col items-center gap-2 rounded-lg bg-blue-600 p-4 transition-colors hover:bg-blue-700"
					>
						<span class="text-2xl">📤</span>
						<span class="font-medium">Export Data</span>
						<span class="text-center text-sm text-blue-100">
							Export your inventory to JSON format
						</span>
					</button>

					<button
						onclick={importInventory}
						class="flex flex-col items-center gap-2 rounded-lg bg-green-600 p-4 transition-colors hover:bg-green-700"
					>
						<span class="text-2xl">📥</span>
						<span class="font-medium">Import Data</span>
						<span class="text-center text-sm text-green-100">
							Import inventory from JSON format
						</span>
					</button>

					<button
						onclick={clearAllInventory}
						class="flex flex-col items-center gap-2 rounded-lg bg-red-600 p-4 transition-colors hover:bg-red-700"
					>
						<span class="text-2xl">🗑️</span>
						<span class="font-medium">Clear All</span>
						<span class="text-center text-sm text-red-100">
							Reset all inventory quantities to zero
						</span>
					</button>
				</div>
			</section>

			<!-- Application Info Section -->
			<section class="rounded-lg border border-slate-700 bg-slate-800 p-6">
				<h2 class="mb-4 flex items-center gap-2 text-xl font-semibold text-white">
					<span>ℹ️</span>
					Application Information
				</h2>

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
			</section>
		</div>
	</div>
</div>

<!-- Export Modal -->
{#if showExportModal}
	<div class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
		<div class="max-h-[80vh] w-full max-w-2xl overflow-auto rounded-lg bg-slate-800 p-6">
			<h3 class="mb-4 text-xl font-semibold text-white">Export Inventory Data</h3>

			<textarea
				readonly
				value={exportedData}
				class="h-64 w-full rounded border border-slate-600 bg-slate-700 p-3 font-mono text-sm text-white"
				placeholder="Exported data will appear here..."
			></textarea>

			<div class="mt-4 flex gap-3">
				<button
					onclick={copyToClipboard}
					class="rounded bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
				>
					Copy to Clipboard
				</button>
				<button
					onclick={closeModal}
					class="rounded bg-slate-600 px-4 py-2 text-white transition-colors hover:bg-slate-700"
				>
					Close
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Import Modal -->
{#if showImportModal}
	<div class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
		<div class="max-h-[80vh] w-full max-w-2xl overflow-auto rounded-lg bg-slate-800 p-6">
			<h3 class="mb-4 text-xl font-semibold text-white">Import Inventory Data</h3>

			<textarea
				bind:value={importData}
				class="h-64 w-full rounded border border-slate-600 bg-slate-700 p-3 font-mono text-sm text-white"
				placeholder="Paste your JSON inventory data here..."
			></textarea>

			<div class="mt-4 flex gap-3">
				<button
					onclick={confirmImport}
					class="rounded bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
					disabled={!importData.trim()}
				>
					Import Data
				</button>
				<button
					onclick={closeModal}
					class="rounded bg-slate-600 px-4 py-2 text-white transition-colors hover:bg-slate-700"
				>
					Cancel
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Clear Confirmation Modal -->
{#if showClearModal}
	<div class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
		<div class="w-full max-w-md rounded-lg bg-slate-800 p-6">
			<h3 class="mb-4 text-center text-xl font-semibold text-white">⚠️ Confirm Clear All</h3>

			<p class="mb-6 text-center text-slate-300">
				Are you sure you want to clear all inventory quantities? This action cannot be undone.
			</p>

			<div class="flex justify-center gap-3">
				<button
					onclick={confirmClear}
					class="rounded bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
				>
					Yes, Clear All
				</button>
				<button
					onclick={closeModal}
					class="rounded bg-slate-600 px-4 py-2 text-white transition-colors hover:bg-slate-700"
				>
					Cancel
				</button>
			</div>
		</div>
	</div>
{/if}
