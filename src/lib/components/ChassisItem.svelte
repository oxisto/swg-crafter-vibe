<!-- ChassisItem.svelte -->
<script lang="ts">
	import type { ShipChassis } from '$lib/types.js';

	interface Props {
		chassis: ShipChassis;
	}

	let { chassis }: Props = $props();

	// Get display color based on stock level
	let stockColor = $derived(
		chassis.quantity === 0
			? 'text-red-400 bg-red-900/20 border-red-700'
			: chassis.quantity <= 2
				? 'text-yellow-400 bg-yellow-900/20 border-yellow-700'
				: 'text-green-400 bg-green-900/20 border-green-700'
	);

	// Format price for display
	let formattedPrice = $derived(chassis.price.toLocaleString());

	// Handle quantity updates
	async function updateQuantity(newQuantity: number) {
		if (newQuantity < 0) return;

		try {
			const response = await fetch('/api/chassis', {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					id: chassis.id,
					quantity: newQuantity
				})
			});

			if (response.ok) {
				chassis.quantity = newQuantity;
			} else {
				console.error('Failed to update chassis quantity');
			}
		} catch (error) {
			console.error('Error updating chassis quantity:', error);
		}
	}

	function incrementQuantity() {
		updateQuantity(chassis.quantity + 1);
	}

	function decrementQuantity() {
		updateQuantity(chassis.quantity - 1);
	}
</script>

<div class="group rounded-lg border {stockColor} p-4 transition-all duration-200 hover:shadow-lg">
	<div class="flex items-start justify-between">
		<div class="flex-1">
			<h4 class="mb-1 font-semibold text-slate-200">Chassis</h4>
			<div class="mb-2 text-sm text-slate-400">
				{chassis.name}
			</div>
			{#if chassis.description}
				<div class="mb-3 text-xs text-slate-500">
					{chassis.description}
				</div>
			{/if}
		</div>

		<div class="ml-4 flex flex-col items-end space-y-3">
			<div class="text-right">
				<div class="text-lg font-bold text-slate-100">
					{formattedPrice} cr
				</div>
				<div class="text-sm text-slate-400">per chassis</div>
			</div>

			<div class="flex flex-col items-center">
				<div class="flex items-center space-x-1">
					<button
						onclick={decrementQuantity}
						class="flex h-5 w-5 items-center justify-center rounded bg-slate-700 text-xs text-slate-300 opacity-0 transition-all group-hover:opacity-100 hover:bg-slate-600 hover:text-slate-100 disabled:hover:bg-slate-700 disabled:hover:text-slate-300"
						class:disabled={chassis.quantity <= 0}
						disabled={chassis.quantity <= 0}
					>
						−
					</button>

					<div class="px-1 text-lg font-semibold">
						{chassis.quantity}
					</div>

					<button
						onclick={incrementQuantity}
						class="flex h-5 w-5 items-center justify-center rounded bg-slate-700 text-xs text-slate-300 opacity-0 transition-all group-hover:opacity-100 hover:bg-slate-600 hover:text-slate-100"
					>
						+
					</button>
				</div>

				<div class="mt-1 text-xs text-slate-500">in stock</div>
			</div>
		</div>
	</div>
</div>
