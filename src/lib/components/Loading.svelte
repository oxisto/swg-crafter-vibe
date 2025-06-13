<!--
 * Common Loading Component
 * 
 * Provides a consistent loading spinner and message
-->
<script lang="ts">
	let {
		message = 'Loading...',
		size = 'md',
		className = ''
	} = $props<{
		message?: string;
		size?: 'sm' | 'md' | 'lg';
		className?: string;
	}>();

	const spinnerSize = $derived(size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-12 w-12' : 'h-8 w-8');
	const textSize = $derived(size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base');
</script>

<div class="flex items-center justify-center space-x-3 {className}">
	<div
		class="animate-spin rounded-full border-2 border-blue-600 border-t-transparent {spinnerSize}"
	></div>
	<span class="text-slate-300 {textSize}">{message}</span>
</div>
