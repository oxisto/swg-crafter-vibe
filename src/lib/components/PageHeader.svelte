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
		emoji = ''
	} = $props<{
		title: string;
		subtitle?: string;
		actions?: any;
		className?: string;
		centered?: boolean;
		emoji?: string;
	}>();
</script>

<div class="mb-8 {className}">
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
		{#if actions && !centered}
			<div class="flex items-center gap-4">
				{@render actions()}
			</div>
		{/if}
	</div>
	{#if actions && centered}
		<div class="mt-6 flex justify-center">
			<div class="flex items-center gap-4">
				{@render actions()}
			</div>
		</div>
	{/if}
</div>
