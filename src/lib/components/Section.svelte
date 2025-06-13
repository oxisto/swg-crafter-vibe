<!--
 * Common Section Component
 * 
 * Provides a consistent section layout with optional title and spacing
-->
<script lang="ts">
	let {
		children,
		title,
		icon,
		className = '',
		spacing = 'mb-8'
	} = $props<{
		children: any;
		title?: string;
		icon?: string;
		className?: string;
		spacing?: string;
	}>();
</script>

<section class="{spacing} {className}">
	{#if title}
		<h2 class="mb-4 flex items-center gap-2 text-xl font-semibold text-white">
			{#if icon}<span>{icon}</span>{/if}
			{title}
		</h2>
	{/if}
	{@render children()}
</section>
