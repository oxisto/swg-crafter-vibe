<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	// Redirect to vendors page
	onMount(() => {
		goto('/vendors', { replaceState: true });
	});
</script>

<svelte:head>
	<title>SWG Shipwright - Redirecting...</title>
</svelte:head>

<div class="flex h-64 items-center justify-center">
	<div class="text-center text-slate-400">
		<p>Redirecting to Vendors page...</p>
	</div>
</div>
