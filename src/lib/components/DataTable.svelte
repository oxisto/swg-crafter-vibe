<!--
 * Data Table Component
 * 
 * Provides a consistent data table with pagination for list views
 * Supports both card-based layout and HTML table layout
-->
<script lang="ts">
	import Card from './Card.svelte';
	import Button from './Button.svelte';

	type Column = {
		key: string;
		label: string;
		class?: string;
	};

	let {
		title,
		total = 0,
		items = [],
		emptyMessage = 'No items found',
		emptySubMessage = '',
		pagination,
		onPageChange,
		children,
		// Table mode props
		mode = 'card',
		columns = [],
		renderCell
	} = $props<{
		title: string;
		total?: number;
		items: any[];
		emptyMessage?: string;
		emptySubMessage?: string;
		pagination?: {
			page: number;
			limit: number;
			totalPages: number;
		};
		onPageChange?: (page: number) => void;
		children?: any;
		// Table mode props
		mode?: 'card' | 'table';
		columns?: Column[];
		renderCell?: any;
	}>();

	function generatePageNumbers() {
		if (!pagination) return [];
		const { page, totalPages } = pagination;
		const maxVisible = 5;
		const start = Math.max(1, page - Math.floor(maxVisible / 2));
		const end = Math.min(totalPages, start + maxVisible - 1);

		return Array.from({ length: end - start + 1 }, (_, i) => start + i);
	}
</script>

{#if mode === 'table'}
	<!-- Table Mode -->
	<div class="overflow-hidden rounded-lg border border-slate-700 bg-slate-800">
		<div class="border-b border-slate-700 bg-slate-900 px-6 py-4">
			<h3 class="text-lg font-semibold text-white">{title} ({total.toLocaleString()})</h3>
		</div>

		{#if items.length === 0}
			<div class="px-6 py-12 text-center">
				<div class="text-lg text-slate-400">{emptyMessage}</div>
				{#if emptySubMessage}
					<div class="mt-1 text-sm text-slate-500">{emptySubMessage}</div>
				{/if}
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead class="border-b border-slate-700 bg-slate-900/50">
						<tr>
							{#each columns as column}
								<th
									class="px-6 py-4 text-left text-base font-semibold text-slate-200 {column.class ||
										''}"
								>
									{column.label}
								</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each items as item, i}
							<tr
								class="border-b border-slate-700/50 hover:bg-slate-700/30 {i % 2 === 0
									? 'bg-slate-800/50'
									: 'bg-slate-800'}"
							>
								{#each columns as column}
									<td class="px-6 py-4 {column.class || ''}">
										{@render renderCell(item, column, i)}
									</td>
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}

		<!-- Pagination for table mode -->
		{#if pagination && pagination.totalPages > 1}
			<div class="flex items-center justify-between border-t border-slate-700 px-6 py-4">
				<div class="text-sm text-slate-400">
					Showing {(pagination.page - 1) * pagination.limit + 1} to
					{Math.min(pagination.page * pagination.limit, total)} of
					{total.toLocaleString()} results
				</div>

				<div class="flex gap-2">
					<Button
						onclick={() => onPageChange?.(pagination.page - 1)}
						disabled={pagination.page <= 1}
						variant="secondary"
						size="sm"
					>
						Previous
					</Button>

					{#each generatePageNumbers() as pageNum}
						<Button
							onclick={() => onPageChange?.(pageNum)}
							variant={pageNum === pagination.page ? 'primary' : 'secondary'}
							size="sm"
						>
							{pageNum}
						</Button>
					{/each}

					<Button
						onclick={() => onPageChange?.(pagination.page + 1)}
						disabled={pagination.page >= pagination.totalPages}
						variant="secondary"
						size="sm"
					>
						Next
					</Button>
				</div>
			</div>
		{/if}
	</div>
{:else}
	<!-- Card Mode (existing functionality) -->
	<Card>
		<div class="border-b border-slate-700 px-4 py-3">
			<h2 class="text-lg font-semibold text-white">
				{title} ({total.toLocaleString()})
			</h2>
		</div>

		{#if items.length === 0}
			<div class="p-8 text-center text-slate-400">
				<p class="text-lg">{emptyMessage}</p>
				{#if emptySubMessage}
					<p class="mt-1 text-sm">{emptySubMessage}</p>
				{/if}
			</div>
		{:else}
			<div class="divide-y divide-slate-700">
				{#each items as item, index}
					{@render children?.(item, index)}
				{/each}
			</div>

			<!-- Pagination for card mode -->
			{#if pagination && pagination.totalPages > 1}
				<div class="flex items-center justify-between border-t border-slate-700 px-4 py-3">
					<div class="text-sm text-slate-400">
						Showing {(pagination.page - 1) * pagination.limit + 1} to
						{Math.min(pagination.page * pagination.limit, total)} of
						{total.toLocaleString()} results
					</div>

					<div class="flex gap-2">
						<Button
							onclick={() => onPageChange?.(pagination.page - 1)}
							disabled={pagination.page <= 1}
							variant="secondary"
							size="sm"
						>
							Previous
						</Button>

						{#each generatePageNumbers() as pageNum}
							<Button
								onclick={() => onPageChange?.(pageNum)}
								variant={pageNum === pagination.page ? 'primary' : 'secondary'}
								size="sm"
							>
								{pageNum}
							</Button>
						{/each}

						<Button
							onclick={() => onPageChange?.(pagination.page + 1)}
							disabled={pagination.page >= pagination.totalPages}
							variant="secondary"
							size="sm"
						>
							Next
						</Button>
					</div>
				</div>
			{/if}
		{/if}
	</Card>
{/if}
