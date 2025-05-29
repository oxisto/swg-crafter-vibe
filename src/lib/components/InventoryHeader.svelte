<!-- InventoryHeader.svelte -->
<script lang="ts">
	interface Props {
		title?: string;
		subtitle?: string;
	}

	let {
		title = 'Inventory Overview',
		subtitle = 'Manage your shipwright part stock levels'
	}: Props = $props();
</script>

<header class="mb-8 text-center">
	<h1 class="mb-2 text-3xl font-bold text-yellow-400">{title}</h1>
	<p class="text-slate-400">{subtitle}</p>
</header>
