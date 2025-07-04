<!--
 * Filter Section Component
 * 
 * Provides a consistent filter interface for pages with search and filter capabilities
-->
<script lang="ts">
	import Card from './Card.svelte';
	import Button from './Button.svelte';
	import Input from './Input.svelte';

	let {
		title = 'Filters',
		children,
		onApply,
		onClear,
		applyText = 'Apply',
		clearText = 'Clear',
		loading = false
	} = $props<{
		title?: string;
		children: any;
		onApply?: () => void;
		onClear?: () => void;
		applyText?: string;
		clearText?: string;
		loading?: boolean;
	}>();
</script>

<Card className="mb-6">
	<h2 class="mb-4 text-lg font-semibold text-white">{title}</h2>
	<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
		{@render children()}

		{#if onApply || onClear}
			<div class="flex items-end gap-2">
				{#if onApply}
					<Button onclick={() => { console.log('Apply button clicked'); onApply(); }} variant="primary" disabled={loading} className="flex-1">
						{applyText}
					</Button>
				{/if}
				{#if onClear}
					<Button onclick={() => { console.log('Clear button clicked'); onClear(); }} variant="secondary" disabled={loading} className="flex-1">
						{clearText}
					</Button>
				{/if}
			</div>
		{/if}
	</div>
</Card>
