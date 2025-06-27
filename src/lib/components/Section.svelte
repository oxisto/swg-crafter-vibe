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
		class: classAlias = '',
		spacing = 'mb-8'
	} = $props<{
		children: any;
		title?: string;
		icon?: string;
		className?: string;
		class?: string;
		spacing?: string;
	}>();

	// Combine className and class prop for compatibility
	const finalClassName = `${className} ${classAlias}`.trim();
</script>

<section class="{spacing} {finalClassName}">
	{#if title}
		<h2 class="mb-4 flex items-center gap-2 text-xl font-semibold text-white">
			{#if icon}<span>{icon}</span>{/if}
			{title}
		</h2>
	{/if}
	{@render children()}
</section>
