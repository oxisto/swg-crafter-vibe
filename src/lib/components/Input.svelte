<!--
 * Common Input Component
 * 
 * Provides consistent input styling with dark theme
-->
<script lang="ts">
	import { generateId } from '../utils/id.js';

	let {
		value = $bindable(),
		label,
		placeholder,
		type = 'text',
		disabled = false,
		className = '',
		inputClassName = '',
		id = generateId(),
		...props
	} = $props<{
		value?: string | number;
		label?: string;
		placeholder?: string;
		type?: string;
		disabled?: boolean;
		className?: string;
		inputClassName?: string;
		id?: string;
		[key: string]: any;
	}>();

	const inputClasses = `w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed ${inputClassName}`;
</script>

<div class={className}>
	{#if label}
		<label for={id} class="mb-2 block text-sm font-medium text-slate-300">
			{label}
		</label>
	{/if}
	<input {id} bind:value class={inputClasses} {type} {placeholder} {disabled} {...props} />
</div>
