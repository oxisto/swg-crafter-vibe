<!--
 * Common Page Header Component
 * 
 * Provides a consistent page header with title and optional actions
-->
<script lang="ts">
	let {
		title,
		subtitle,
		actions,
		className = '',
		centered = false,
		emoji = '',
		backLink,
		backText = 'Back',
		children
	} = $props<{
		title: string;
		subtitle?: string;
		actions?: any;
		className?: string;
		centered?: boolean;
		emoji?: string;
		backLink?: string;
		backText?: string;
		children?: any;
	}>();
</script>

<div class="mb-8 {className}">
	{#if backLink}
		<div class="mb-4">
			<a href={backLink} class="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300">
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"
					></path>
				</svg>
				{backText}
			</a>
		</div>
	{/if}
	<div class="flex items-center justify-between">
		<div class={centered ? 'w-full text-center' : ''}>
			<h1 class="text-3xl font-bold {emoji ? 'text-yellow-400' : 'text-white'}">
				{#if emoji}{emoji}
				{/if}{title}
			</h1>
			{#if subtitle}
				<p class="mt-2 text-lg text-slate-400">{subtitle}</p>
			{/if}
		</div>
		{#if (actions || children) && !centered}
			<div class="flex items-center gap-4">
				{#if actions}
					{@render actions()}
				{/if}
				{#if children}
					{@render children()}
				{/if}
			</div>
		{/if}
	</div>
	{#if (actions || children) && centered}
		<div class="mt-6 flex justify-center">
			<div class="flex items-center gap-4">
				{#if actions}
					{@render actions()}
				{/if}
				{#if children}
					{@render children()}
				{/if}
			</div>
		</div>
	{/if}
</div>
