<!--
 * Simple Table Component
 * 
 * A lightweight, reusable table component for displaying structured data
 * Optimized for consistent styling and easy customization
-->
<script lang="ts">
	type Column = {
		key: string;
		label: string;
		class?: string;
	};

	let {
		columns,
		items,
		emptyMessage = 'No data available',
		renderCell,
		children,
		// Styling customization
		tableClass = 'min-w-full divide-y divide-slate-600',
		headerClass = 'bg-slate-700',
		bodyClass = 'divide-y divide-slate-600 bg-slate-800',
		rowClass = '',
		cellClass = 'px-6 py-4 text-sm',
		// Display options
		showBorder = true,
		alternatingRows = true
	} = $props<{
		columns: Column[];
		items: any[];
		emptyMessage?: string;
		renderCell?: any;
		children?: any;
		// Styling customization
		tableClass?: string;
		headerClass?: string;
		bodyClass?: string;
		rowClass?: string;
		cellClass?: string;
		// Display options
		showBorder?: boolean;
		alternatingRows?: boolean;
	}>();

	/**
	 * Get row-specific CSS classes
	 */
	function getRowClass(index: number): string {
		let classes = rowClass;

		if (alternatingRows) {
			classes += index % 2 === 0 ? ' bg-slate-800' : ' bg-slate-750';
		}

		return classes;
	}
</script>

{#if items.length === 0}
	<div class="py-8 text-center text-slate-400">
		<p>{emptyMessage}</p>
	</div>
{:else}
	<div class="overflow-hidden {showBorder ? 'rounded-lg border border-slate-600' : ''}">
		<table class={tableClass}>
			<thead class={headerClass}>
				<tr>
					{#each columns as column}
						<th
							class="px-6 py-3 text-left text-xs font-medium tracking-wider text-slate-300 uppercase {column.class ||
								''}"
						>
							{column.label}
						</th>
					{/each}
				</tr>
			</thead>
			<tbody class={bodyClass}>
				{#each items as item, i}
					<tr class={getRowClass(i)}>
						{#each columns as column}
							<td class="{cellClass} {column.class || ''}">
								{#if children?.renderCell}
									{@render children.renderCell(item, column, i)}
								{:else if renderCell}
									{@render renderCell(item, column, i)}
								{:else}
									{item[column.key] ?? ''}
								{/if}
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
