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

	// Check if quantity is below recommended level
	let isLowStock = $derived(quantity < recommendedStockLevel);

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

<div class="rounded p-3 border group hover:border-slate-600 transition-colors min-h-[75px] flex flex-col justify-center {isLowStock ? 'bg-red-900/30 border-red-700' : 'bg-slate-800 border-slate-700'}">
	<div class="text-xs text-slate-400 mb-1 text-center leading-tight">
		<span class="inline-block">{category}</span>
		<span class="inline-block"> - </span>
		<span class="inline-block">Mark {markLevel}</span>
	</div>
	
	<div class="flex items-center justify-center gap-2">
		{#if !editMode}
			<button
				onclick={handleDecrement}
				class="w-5 h-5 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
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
				class="w-12 text-center bg-slate-700 border border-slate-600 rounded px-1 py-0.5 text-white text-sm"
				min="0"
			/>
			<div class="flex gap-0.5">
				<button
					onclick={handleSave}
					class="px-1.5 py-0.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
				>
					✓
				</button>
				<button
					onclick={handleCancel}
					class="px-1.5 py-0.5 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded transition-colors"
				>
					✕
				</button>
			</div>
		{:else}
			<button
				onclick={handleEdit}
				class="min-w-12 text-center font-bold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
			>
				{quantity}
			</button>
		{/if}
		
		{#if !editMode}
			<button
				onclick={handleIncrement}
				class="w-5 h-5 rounded-full bg-green-600 hover:bg-green-700 text-white font-bold text-xs flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
			>
				+
			</button>
		{/if}
	</div>
</div>
