<!--
 * Alert/Notification Component
 * 
 * Provides consistent alert styling for success, error, info, and warning messages
-->
<script lang="ts">
	type AlertVariant = 'success' | 'error' | 'info' | 'warning';

	let {
		variant = 'info',
		children,
		className = '',
		dismissible = false,
		onDismiss
	}: {
		variant?: AlertVariant;
		children: any;
		className?: string;
		dismissible?: boolean;
		onDismiss?: () => void;
	} = $props();

	const variantClasses: Record<AlertVariant, string> = {
		success: 'border-green-600 bg-green-800/20 text-green-300',
		error: 'border-red-600 bg-red-800/20 text-red-300',
		info: 'border-blue-600 bg-blue-800/20 text-blue-300',
		warning: 'border-yellow-600 bg-yellow-800/20 text-yellow-300'
	};
</script>

<div class="rounded border p-3 {variantClasses[variant]} {className}">
	<div class="flex items-start justify-between">
		<div class="flex-1">
			{@render children()}
		</div>
		{#if dismissible && onDismiss}
			<button
				onclick={onDismiss}
				class="ml-2 text-xl leading-none hover:opacity-75"
				aria-label="Dismiss"
			>
				×
			</button>
		{/if}
	</div>
</div>
