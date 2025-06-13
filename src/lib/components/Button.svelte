<!--
 * Common Button Component
 * 
 * Provides consistent button styling with different variants
-->
<script lang="ts">
	type Variant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
	type Size = 'sm' | 'md' | 'lg';

	let {
		children,
		variant = 'primary',
		size = 'md',
		disabled = false,
		className = '',
		onclick,
		type = 'button',
		...props
	}: {
		children: any;
		variant?: Variant;
		size?: Size;
		disabled?: boolean;
		className?: string;
		onclick?: () => void;
		type?: 'button' | 'submit' | 'reset';
		[key: string]: any;
	} = $props();

	// Base button classes
	const baseClasses =
		'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed';

	// Variant classes
	const variantClasses: Record<Variant, string> = {
		primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
		secondary: 'bg-slate-600 text-white hover:bg-slate-700 focus:ring-slate-500',
		danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
		success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
		ghost: 'bg-transparent text-slate-300 hover:bg-slate-700 hover:text-white focus:ring-slate-500'
	};

	// Size classes
	const sizeClasses: Record<Size, string> = {
		sm: 'px-3 py-1.5 text-sm rounded-md',
		md: 'px-4 py-2 text-sm rounded-lg',
		lg: 'px-6 py-3 text-base rounded-lg'
	};

	const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
</script>

<button class={buttonClasses} {disabled} {type} {onclick} {...props}>
	{@render children()}
</button>
