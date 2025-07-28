<script lang="ts">
	import Modal from '$lib/components/Modal.svelte';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import Loading from '$lib/components/Loading.svelte';
	import { RESOURCE_INVENTORY_AMOUNTS } from '$lib/types/resource-inventory.js';
	import type { Resource, ResourceInventoryAmount } from '$lib/types';

	// Props
	export let open: boolean;
	export let resource: Resource | null;
	export let amount: ResourceInventoryAmount;
	export let notes: string;
	export let isUpdating: boolean = false;
	// Actions
	export let onSave: (amount: ResourceInventoryAmount, notes: string) => void;
	export let onRemove: () => void;
	export let onCancel: () => void;

	// Local state for binding
	let selectedAmount: ResourceInventoryAmount = amount;
	let inventoryNotes: string = notes;

	$: {
		// Always reset local state when resource, amount, or notes change
		selectedAmount = amount;
		inventoryNotes = notes;
	}

	function getStatValue(resource: Resource, stat: string): string {
		if (!resource?.attributes) return '-';
		const value = resource.attributes[stat as keyof typeof resource.attributes];
		return value ? value.toString() : '-';
	}
	function getStatColorClass(resource: Resource, stat: string): string {
		if (!resource?.attributes) return 'text-slate-400';
		const value = resource.attributes[stat as keyof typeof resource.attributes];
		if (!value) return 'text-slate-400';
		if (value < 500) return 'text-slate-400';
		if (value >= 900) return 'text-green-500 font-semibold';
		if (value >= 750) return 'text-emerald-500';
		if (value >= 600) return 'text-yellow-500';
		return 'text-yellow-400';
	}
</script>

<Modal bind:open title="Manage Inventory">
	{#if resource}
		<div class="space-y-6">
			<div>
				<h2 class="text-xl font-bold text-white">Manage Inventory: {resource.name}</h2>
				<p class="text-sm text-slate-400">{resource.className} • {resource.type}</p>
				{#if resource.attributes}
					<div class="mt-2 grid grid-cols-5 gap-2 text-xs text-slate-500">
						{#each ['oq', 'cr', 'cd', 'dr', 'fl', 'hr', 'ma', 'pe', 'sr', 'ut'] as stat}
							{@const value = getStatValue(resource, stat)}
							{#if value !== '-'}
								<div class="text-center">
									<div class="font-mono text-xs text-blue-300 uppercase">{stat}</div>
									<div class="font-mono font-semibold {getStatColorClass(resource, stat)}">
										{value}
									</div>
								</div>
							{/if}
						{/each}
					</div>
				{/if}
			</div>

			<div>
				<label for="amount" class="mb-2 block text-sm font-medium text-slate-300"> Amount </label>
				<select
					id="amount"
					bind:value={selectedAmount}
					class="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
				>
					{#each Object.values(RESOURCE_INVENTORY_AMOUNTS) as amountDef}
						<option value={amountDef.value}>{amountDef.label} ({amountDef.description})</option>
					{/each}
				</select>
			</div>

			<div>
				<Input
					id="notes"
					label="Notes (optional)"
					bind:value={inventoryNotes}
					placeholder="Add notes about this resource..."
				/>
			</div>

			<div class="flex gap-3">
				<Button
					onclick={() => onSave(selectedAmount, inventoryNotes)}
					disabled={isUpdating}
					variant="primary"
					class="flex-1"
				>
					{#if isUpdating}
						<Loading size="sm" /> Saving...
					{:else}
						Save Inventory
					{/if}
				</Button>

				{#if resource.inventory}
					<Button onclick={onRemove} disabled={isUpdating} variant="danger">
						{#if isUpdating}
							<Loading size="sm" />
						{:else}
							Remove
						{/if}
					</Button>
				{/if}

				<Button onclick={onCancel} disabled={isUpdating} variant="secondary">Cancel</Button>
			</div>
		</div>
	{/if}
</Modal>
