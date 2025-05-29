<script lang="ts">
	import type { PartCategory, MarkLevel } from '$lib/types.js';
	import { incrementStock, decrementStock, setStock } from '$lib/stores.js';

	interface Props {
		category: PartCategory;
		markLevel: MarkLevel;
		quantity: number;
		recommendedStockLevel: number;
	}

	let { category, markLevel, quantity, recommendedStockLevel }: Props = $props();

	let editMode = $state(false);
	let editValue = $state(quantity);

	// Get background classes based on stock level vs recommended threshold
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

	function handleIncrement() {
		incrementStock(category, markLevel);
	}

	function handleDecrement() {
		decrementStock(category, markLevel);
	}

	function handleEdit() {
		editValue = quantity;
		editMode = true;
	}

	function handleSave() {
		const newQuantity = parseInt(editValue.toString(), 10);
		if (!isNaN(newQuantity) && newQuantity >= 0) {
			setStock(category, markLevel, newQuantity);
		}
		editMode = false;
	}

	function handleCancel() {
		editValue = quantity;
		editMode = false;
	}

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
