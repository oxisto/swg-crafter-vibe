<!--
	@fileoverview InventoryItem component for the SWG Shipwright application.
	Displays and manages individual inventory item quantities with interactive controls.
	
	Features:
	- Color-coded background based on stock levels vs recommended thresholds
	- Increment/decrement buttons with hover reveal
	- Click-to-edit quantity with keyboard support
	- Visual feedback for stock status (critical, low, adequate, excess)
	
	@component
	@author SWG Crafter Team
	@since 1.0.0
-->

<!-- filepath: /Users/oxisto/Repositories/swg-crafter/src/lib/components/InventoryItem.svelte -->
<script lang="ts">
	import type { PartCategory, MarkLevel } from '$lib/types.js';
	import { incrementStock, decrementStock, setStock } from '$lib/stores.js';

	/**
	 * Component properties interface defining the required props.
	 */
	interface Props {
		/** The part category (Armor, Engine, etc.) */
		category: PartCategory;
		/** The mark level (I, II, III, IV, V) */
		markLevel: MarkLevel;
		/** Current quantity in inventory */
		quantity: number;
		/** Recommended stock level for color coding */
		recommendedStockLevel: number;
	}

	let { category, markLevel, quantity, recommendedStockLevel }: Props = $props();

	/** State for edit mode toggle */
	let editMode = $state(false);
	/** State for the edit input value */
	let editValue = $state(quantity);

	/**
	 * Computed background classes based on stock level vs recommended threshold.
	 * Provides visual feedback for inventory status:
	 * - Red: Zero stock (critical)
	 * - Yellow: Below recommended (warning)
	 * - Light green: At recommended level
	 * - Dark green: Above recommended (excess)
	 */
	let backgroundClasses = $derived.by(() => {
		if (quantity === 0) {
			// Red for zero stock (critical)
			return 'bg-red-900/40 border-red-700';
		} else if (quantity < recommendedStockLevel) {
			// Yellow for below threshold (warning)
			return 'bg-yellow-900/40 border-yellow-700';
		} else if (quantity === recommendedStockLevel) {
			// Light green for exactly at threshold
			return 'bg-green-800/40 border-green-600';
		} else {
			// Dark green for above threshold
			return 'bg-green-900/60 border-green-500';
		}
	});

	/**
	 * Handles incrementing the inventory quantity by 1.
	 * Calls the store function to update both local state and database.
	 */
	function handleIncrement() {
		incrementStock(category, markLevel);
	}

	/**
	 * Handles decrementing the inventory quantity by 1.
	 * Prevents going below zero through store function validation.
	 */
	function handleDecrement() {
		decrementStock(category, markLevel);
	}

	/**
	 * Enters edit mode for direct quantity input.
	 * Initializes edit value with current quantity.
	 */
	function handleEdit() {
		editValue = quantity;
		editMode = true;
	}

	/**
	 * Saves the edited quantity value if valid.
	 * Validates input is a non-negative integer before applying.
	 */
	function handleSave() {
		const newQuantity = parseInt(editValue.toString(), 10);
		if (!isNaN(newQuantity) && newQuantity >= 0) {
			setStock(category, markLevel, newQuantity);
		}
		editMode = false;
	}

	/**
	 * Cancels edit mode without saving changes.
	 * Resets edit value to original quantity.
	 */
	function handleCancel() {
		editValue = quantity;
		editMode = false;
	}

	/**
	 * Handles keyboard events during edit mode.
	 * Enter key saves changes, Escape key cancels.
	 *
	 * @param {KeyboardEvent} event - The keyboard event
	 */
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			handleSave();
		} else if (event.key === 'Escape') {
			handleCancel();
		}
	}
</script>

<div
	class="group flex min-h-[75px] flex-col justify-center rounded border p-3 transition-colors hover:border-slate-600 {backgroundClasses}"
>
	<div class="mb-1 text-center text-xs leading-tight text-slate-400">
		<span class="inline-block">{category}</span>
		<span class="inline-block"> - </span>
		<span class="inline-block">Mark {markLevel}</span>
	</div>

	<div class="flex items-center justify-center gap-2">
		{#if !editMode}
			<button
				onclick={handleDecrement}
				class="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white opacity-0 transition-all group-hover:opacity-100 hover:bg-red-700"
				disabled={quantity === 0}
			>
				−
			</button>
		{/if}

		{#if editMode}
			<input
				type="number"
				bind:value={editValue}
				onkeydown={handleKeydown}
				class="w-12 rounded border border-slate-600 bg-slate-700 px-1 py-0.5 text-center text-sm text-white"
				min="0"
			/>
			<div class="flex gap-0.5">
				<button
					onclick={handleSave}
					class="rounded bg-green-600 px-1.5 py-0.5 text-xs text-white transition-colors hover:bg-green-700"
				>
					✓
				</button>
				<button
					onclick={handleCancel}
					class="rounded bg-gray-600 px-1.5 py-0.5 text-xs text-white transition-colors hover:bg-gray-700"
				>
					✕
				</button>
			</div>
		{:else}
			<button
				onclick={handleEdit}
				class="min-w-12 cursor-pointer text-center font-bold text-blue-400 transition-colors hover:text-blue-300"
			>
				{quantity}
			</button>
		{/if}

		{#if !editMode}
			<button
				onclick={handleIncrement}
				class="flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-xs font-bold text-white opacity-0 transition-all group-hover:opacity-100 hover:bg-green-700"
			>
				+
			</button>
		{/if}
	</div>
</div>
