<!--
 * Common Page Layout Component
 * 
 * Provides a consistent page structure with standardized padding,
 * spacing, and responsive design across all pages.
-->
<script lang="ts">
	let {
		children,
		className = '',
		maxWidth = '6xl',
		centered = true,
		padding = 'default'
	} = $props<{
		children: any;
		className?: string;
		maxWidth?: 'full' | '7xl' | '6xl' | '5xl' | '4xl' | '3xl' | '2xl' | 'xl' | 'lg' | 'md' | 'sm';
		centered?: boolean;
		padding?: 'none' | 'sm' | 'default' | 'lg';
	}>();

	// Determine padding classes with medium horizontal margins
	const paddingClasses = {
		none: '',
		sm: 'px-8 py-4',
		default: 'px-12 py-8',
		lg: 'px-16 py-12'
	};

	// Determine max width classes
	const maxWidthClasses = {
		full: 'w-full',
		'7xl': 'max-w-7xl',
		'6xl': 'max-w-6xl',
		'5xl': 'max-w-5xl',
		'4xl': 'max-w-4xl',
		'3xl': 'max-w-3xl',
		'2xl': 'max-w-2xl',
		xl: 'max-w-xl',
		lg: 'max-w-lg',
		md: 'max-w-md',
		sm: 'max-w-sm'
	};
</script>

<div class="h-full">
	<div
		class="{paddingClasses[padding]} {maxWidthClasses[maxWidth]} {centered
			? 'container mx-auto'
			: 'w-full'} {className}"
	>
		{@render children()}
	</div>
</div>
