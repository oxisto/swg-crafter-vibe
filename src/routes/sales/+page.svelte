<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import type { MailBatch, SalesAnalytics } from '$lib/types';

	let { data }: { data: PageData } = $props();

	let fileInput = $state<HTMLInputElement>();
	let uploading = $state(false);
	let uploadResult: string | null = $state(null);
	let uploadError: string | null = $state(null);

	// Reactive analytics data
	let recentAnalytics = $state(data.recentAnalytics);
	let allTimeAnalytics = $state(data.allTimeAnalytics);
	let imports = $state(data.imports);

	async function handleFileUpload() {
		const file = fileInput.files?.[0];
		if (!file) return;

		uploading = true;
		uploadResult = null;
		uploadError = null;

		try {
			// Read the file content
			const fileContent = await file.text();
			const mailBatch: MailBatch = JSON.parse(fileContent);

			// Upload to the API
			const response = await fetch('/api/sales/import', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(mailBatch)
			});

			const result = await response.json();

			if (response.ok) {
				uploadResult = result.message;
				// Refresh the data
				await refreshData();
			} else {
				uploadError = result.error || 'Upload failed';
			}
		} catch (error) {
			uploadError = `Failed to process file: ${error.message}`;
		} finally {
			uploading = false;
			// Clear the file input
			fileInput.value = '';
		}
	}

	async function refreshData() {
		try {
			// Refresh analytics
			const [recentResponse, allTimeResponse, importsResponse] = await Promise.all([
				fetch(
					'/api/sales?action=analytics&startDate=' +
						new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
				),
				fetch('/api/sales?action=analytics'),
				fetch('/api/sales?action=imports')
			]);

			if (recentResponse.ok) {
				const data = await recentResponse.json();
				recentAnalytics = data.analytics;
			}

			if (allTimeResponse.ok) {
				const data = await allTimeResponse.json();
				allTimeAnalytics = data.analytics;
			}

			if (importsResponse.ok) {
				const data = await importsResponse.json();
				imports = data.imports;
			}
		} catch (error) {
			console.error('Failed to refresh data:', error);
		}
	}

	function formatCredits(amount: number): string {
		return new Intl.NumberFormat().format(amount);
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString();
	}
</script>

<svelte:head>
	<title>SWG Shipwright - Sales Tracking</title>
</svelte:head>

<div class="h-full">
	<div class="container mx-auto max-w-7xl px-6 py-8">
		<header class="mb-8 text-center">
			<h1 class="mb-2 text-3xl font-bold text-yellow-400">💰 Sales Tracking</h1>
			<p class="text-slate-400">Analyze your sales history and business performance</p>
		</header>

		<!-- Mail Import Section -->
		<section class="mb-8">
			<h2 class="mb-4 text-2xl font-semibold text-white">Import Mail Data</h2>
			<div class="rounded-lg border border-slate-700 bg-slate-800 p-6">
				<p class="mb-4 text-slate-400">
					Upload JSON files from the mail analyzer tool to track your sales history.
				</p>

				<div class="mb-4 flex items-center gap-4">
					<input
						bind:this={fileInput}
						type="file"
						accept=".json"
						class="file:mr-4 file:rounded-full file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-700"
						disabled={uploading}
					/>
					<button
						onclick={handleFileUpload}
						disabled={uploading || !fileInput?.files?.length}
						class="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{uploading ? 'Uploading...' : 'Import Mail Data'}
					</button>
				</div>

				{#if uploadResult}
					<div class="rounded border border-green-600 bg-green-800/20 p-3 text-green-300">
						{uploadResult}
					</div>
				{/if}

				{#if uploadError}
					<div class="rounded border border-red-600 bg-red-800/20 p-3 text-red-300">
						{uploadError}
					</div>
				{/if}
			</div>
		</section>

		<!-- Analytics Dashboards -->
		<div class="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
			<!-- Recent Sales (30 days) -->
			<section>
				<h2 class="mb-4 text-2xl font-semibold text-white">Recent Sales (30 Days)</h2>
				{#if recentAnalytics}
					<div class="rounded-lg border border-slate-700 bg-slate-800 p-6">
						<div class="mb-6 grid grid-cols-2 gap-4">
							<div class="text-center">
								<div class="text-3xl font-bold text-blue-400">{recentAnalytics.total_sales}</div>
								<div class="text-slate-400">Total Sales</div>
							</div>
							<div class="text-center">
								<div class="text-3xl font-bold text-green-400">
									{formatCredits(recentAnalytics.total_credits)}
								</div>
								<div class="text-slate-400">Credits Earned</div>
							</div>
						</div>

						{#if recentAnalytics.total_sales > 0}
							<div class="mb-4 text-center">
								<div class="text-xl font-semibold text-white">
									Average: {formatCredits(recentAnalytics.average_sale)} credits
								</div>
							</div>

							<!-- Top Categories -->
							{#if Object.keys(recentAnalytics.category_stats).length > 0}
								<div class="mb-4">
									<h4 class="mb-2 font-semibold text-white">Top Categories</h4>
									<div class="space-y-2">
										{#each Object.entries(recentAnalytics.category_stats)
											.sort(([, a], [, b]) => b.count - a.count)
											.slice(0, 3) as [category, stats]}
											<div class="flex items-center justify-between">
												<span class="font-medium text-white">{category}</span>
												<span class="text-sm text-slate-400"
													>{stats.count} sales, {formatCredits(stats.total_credits)} credits</span
												>
											</div>
										{/each}
									</div>
								</div>
							{/if}
						{:else}
							<div class="py-8 text-center text-slate-400">No sales data for the last 30 days</div>
						{/if}
					</div>
				{:else}
					<div class="rounded-lg border border-slate-700 bg-slate-800 p-6">
						<div class="py-8 text-center text-slate-400">No recent sales data available</div>
					</div>
				{/if}
			</section>

			<!-- All-Time Sales -->
			<section>
				<h2 class="mb-4 text-2xl font-semibold text-white">All-Time Sales</h2>
				{#if allTimeAnalytics}
					<div class="rounded-lg border border-slate-700 bg-slate-800 p-6">
						<div class="mb-6 grid grid-cols-2 gap-4">
							<div class="text-center">
								<div class="text-3xl font-bold text-blue-400">{allTimeAnalytics.total_sales}</div>
								<div class="text-slate-400">Total Sales</div>
							</div>
							<div class="text-center">
								<div class="text-3xl font-bold text-green-400">
									{formatCredits(allTimeAnalytics.total_credits)}
								</div>
								<div class="text-slate-400">Credits Earned</div>
							</div>
						</div>

						{#if allTimeAnalytics.total_sales > 0}
							<div class="mb-4 text-center">
								<div class="text-xl font-semibold text-white">
									Average: {formatCredits(allTimeAnalytics.average_sale)} credits
								</div>
							</div>

							<!-- Mark Level Distribution -->
							{#if Object.keys(allTimeAnalytics.mark_level_stats).length > 0}
								<div class="mb-4">
									<h4 class="mb-2 font-semibold text-white">By Mark Level</h4>
									<div class="space-y-2">
										{#each Object.entries(allTimeAnalytics.mark_level_stats).sort( ([a], [b]) => a.localeCompare(b) ) as [markLevel, stats]}
											<div class="flex items-center justify-between">
												<span class="font-medium text-white">Mark {markLevel}</span>
												<span class="text-sm text-slate-400"
													>{stats.count} sales, avg {formatCredits(stats.avg_credits)}</span
												>
											</div>
										{/each}
									</div>
								</div>
							{/if}
						{:else}
							<div class="py-8 text-center text-slate-400">No sales data available</div>
						{/if}
					</div>
				{:else}
					<div class="rounded-lg border border-slate-700 bg-slate-800 p-6">
						<div class="py-8 text-center text-slate-400">No sales data available</div>
					</div>
				{/if}
			</section>
		</div>

		<!-- Top Items -->
		{#if allTimeAnalytics?.top_items?.length > 0}
			<section class="mb-8">
				<h2 class="mb-4 text-2xl font-semibold text-white">Top Selling Items</h2>
				<div class="overflow-hidden rounded-lg border border-slate-700 bg-slate-800">
					<table class="w-full">
						<thead class="bg-slate-700">
							<tr>
								<th
									class="px-6 py-3 text-left text-xs font-medium tracking-wider text-slate-300 uppercase"
									>Item</th
								>
								<th
									class="px-6 py-3 text-left text-xs font-medium tracking-wider text-slate-300 uppercase"
									>Sales</th
								>
								<th
									class="px-6 py-3 text-left text-xs font-medium tracking-wider text-slate-300 uppercase"
									>Total Credits</th
								>
								<th
									class="px-6 py-3 text-left text-xs font-medium tracking-wider text-slate-300 uppercase"
									>Avg Price</th
								>
							</tr>
						</thead>
						<tbody class="divide-y divide-slate-700 bg-slate-800">
							{#each allTimeAnalytics.top_items.slice(0, 10) as item}
								<tr>
									<td class="px-6 py-4 text-sm font-medium whitespace-nowrap text-white">
										{item.item_name}
									</td>
									<td class="px-6 py-4 text-sm whitespace-nowrap text-slate-400">
										{item.count}
									</td>
									<td class="px-6 py-4 text-sm whitespace-nowrap text-slate-400">
										{formatCredits(item.total_credits)}
									</td>
									<td class="px-6 py-4 text-sm whitespace-nowrap text-slate-400">
										{formatCredits(item.avg_credits)}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</section>
		{/if}

		<!-- Import History -->
		{#if imports?.length > 0}
			<section>
				<h2 class="mb-4 text-2xl font-semibold text-white">Import History</h2>
				<div class="overflow-hidden rounded-lg border border-slate-700 bg-slate-800">
					<table class="w-full">
						<thead class="bg-slate-700">
							<tr>
								<th
									class="px-6 py-3 text-left text-xs font-medium tracking-wider text-slate-300 uppercase"
									>Date</th
								>
								<th
									class="px-6 py-3 text-left text-xs font-medium tracking-wider text-slate-300 uppercase"
									>Mails Processed</th
								>
								<th
									class="px-6 py-3 text-left text-xs font-medium tracking-wider text-slate-300 uppercase"
									>Sales Imported</th
								>
								<th
									class="px-6 py-3 text-left text-xs font-medium tracking-wider text-slate-300 uppercase"
									>Date Range</th
								>
							</tr>
						</thead>
						<tbody class="divide-y divide-slate-700 bg-slate-800">
							{#each imports.slice(0, 10) as importRecord}
								<tr>
									<td class="px-6 py-4 text-sm whitespace-nowrap text-white">
										{formatDate(importRecord.imported_at)}
									</td>
									<td class="px-6 py-4 text-sm whitespace-nowrap text-slate-400">
										{importRecord.total_mails}
									</td>
									<td class="px-6 py-4 text-sm whitespace-nowrap text-slate-400">
										{importRecord.imported_sales}
									</td>
									<td class="px-6 py-4 text-sm whitespace-nowrap text-slate-400">
										{#if importRecord.start_date && importRecord.end_date}
											{formatDate(importRecord.start_date)} - {formatDate(importRecord.end_date)}
										{:else}
											-
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</section>
		{/if}
	</div>
</div>
