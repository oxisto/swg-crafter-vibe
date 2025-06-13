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
		padding = 'p-6',
		background = 'bg-slate-800',
		border = 'border border-slate-700',
		maxWidth = 'full'
	} = $props<{
		children: any;
		className?: string;
		padding?: string;
		background?: string;
		border?: string;
		maxWidth?: 'full' | '7xl' | '6xl' | '5xl' | '4xl' | '3xl' | '2xl' | 'xl' | 'lg' | 'md' | 'sm';
	}>();

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

<div class="{maxWidthClasses[maxWidth]} rounded-lg {border} {background} {padding} {className}">
	{@render children()}
</div>
