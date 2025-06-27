<!--
 * Common Card Component
 * 
 * Provides a consistent card design with dark theme styling
 * used across the inventory and mail management pages.
-->
<script lang="ts">
	let {
		children,
		className = '',
		class: classAlias = '',
		padding = 'p-6',
		background = 'bg-slate-800',
		border = 'border border-slate-700',
		maxWidth = 'full',
		title,
		icon
	} = $props<{
		children: any;
		className?: string;
		class?: string;
		padding?: string;
		background?: string;
		border?: string;
		maxWidth?: 'full' | '7xl' | '6xl' | '5xl' | '4xl' | '3xl' | '2xl' | 'xl' | 'lg' | 'md' | 'sm';
		title?: string;
		icon?: string;
	}>();

	// Combine className and class prop for compatibility
	const finalClassName = `${className} ${classAlias}`.trim();

	// Determine max width classes
	const maxWidthClasses = {
		full: 'w-full',
		'7xl': 'w-full max-w-7xl',
		'6xl': 'w-full max-w-6xl',
		'5xl': 'w-full max-w-5xl',
		'4xl': 'w-full max-w-4xl',
		'3xl': 'w-full max-w-3xl',
		'2xl': 'w-full max-w-2xl',
		xl: 'w-full max-w-xl',
		lg: 'w-full max-w-lg',
		md: 'w-full max-w-md',
		sm: 'w-full max-w-sm'
	};
</script>

<div
	class="{maxWidthClasses[
		maxWidth as keyof typeof maxWidthClasses
	]} rounded-lg {border} {background} {padding} {finalClassName}"
>
	{#if title}
		<div class="mb-4 flex items-center gap-2">
			{#if icon}
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={icon}></path>
				</svg>
			{/if}
			<h2 class="text-lg font-semibold text-white">{title}</h2>
		</div>
	{/if}
	{@render children()}
</div>
