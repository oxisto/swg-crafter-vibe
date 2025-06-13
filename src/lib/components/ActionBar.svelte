<!--
 * Action Bar Component
 * 
 * Provides a consistent action bar for buttons and controls
-->
<script lang="ts">
	type JustifyOption = 'start' | 'end' | 'center' | 'between';

	let {
		children,
		className = '',
		justify = 'start'
	}: {
		children: any;
		className?: string;
		justify?: JustifyOption;
	} = $props();

	const justifyClasses: Record<JustifyOption, string> = {
		start: 'justify-start',
		end: 'justify-end',
		center: 'justify-center',
		between: 'justify-between'
	};
</script>

<div class="mb-6 flex items-center gap-3 {justifyClasses[justify]} {className}">
	{@render children()}
</div>
