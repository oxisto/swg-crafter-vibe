<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import type { MailData, MailImport } from '$lib/types';

	export let data: PageData;

	let uploading = false;
	let extractingSales = false;
	let fileInput: HTMLInputElement;

	// Filter controls - provide defaults if data properties don't exist
	let senderFilter = data.filters?.sender || '';
	let subjectFilter = data.filters?.subject || '';

	// Format date for display
	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleString();
	}

	// Format timestamp for better readability
	function getTimeAgo(dateString: string): string {
		const now = new Date();
		const date = new Date(dateString);
		const diffInMs = now.getTime() - date.getTime();
		const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

		if (diffInDays === 0) {
			const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
			if (diffInHours === 0) {
				const diffInMins = Math.floor(diffInMs / (1000 * 60));
				return `${diffInMins}m ago`;
			}
			return `${diffInHours}h ago`;
		} else if (diffInDays === 1) {
			return 'Yesterday';
		} else if (diffInDays < 7) {
			return `${diffInDays}d ago`;
		} else {
			return date.toLocaleDateString();
		}
	}

	// Apply filters
	function applyFilters() {
		const url = new URL($page.url);

		if (senderFilter) {
			url.searchParams.set('sender', senderFilter);
		} else {
			url.searchParams.delete('sender');
		}

		if (subjectFilter) {
			url.searchParams.set('subject', subjectFilter);
		} else {
			url.searchParams.delete('subject');
		}

		url.searchParams.delete('page'); // Reset to first page
		goto(url.toString());
	}

	// Clear filters
	function clearFilters() {
		senderFilter = '';
		subjectFilter = '';
		applyFilters();
	}

	// Pagination
	function goToPage(pageNum: number) {
		const url = new URL($page.url);
		url.searchParams.set('page', pageNum.toString());
		goto(url.toString());
	}

	// Handle file upload for mail import
	async function handleMailImport() {
		const file = fileInput.files?.[0];
		if (!file) return;

		uploading = true;
		try {
			const text = await file.text();
			const mailBatch = JSON.parse(text);

			const response = await fetch('/api/mails', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					action: 'import',
					mailBatch
				})
			});

			if (response.ok) {
				// Refresh the page to show new data
				window.location.reload();
			} else {
				const error = await response.json();
				alert(`Import failed: ${error.error}`);
			}
		} catch (error) {
			console.error('Import error:', error);
			alert('Failed to import mail data. Please check the file format.');
		} finally {
			uploading = false;
			fileInput.value = '';
		}
	}

	// Extract sales from existing mails
	async function extractSales() {
		extractingSales = true;
		try {
			const response = await fetch('/api/mails', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					action: 'extract-sales'
				})
			});

			if (response.ok) {
				const result = await response.json();
				alert(`Successfully extracted ${result.extractedCount} sales from mails.`);
			} else {
				const error = await response.json();
				alert(`Extraction failed: ${error.error}`);
			}
		} catch (error) {
			console.error('Extraction error:', error);
			alert('Failed to extract sales data.');
		} finally {
			extractingSales = false;
		}
	}
</script>

<svelte:head>
	<title>SWG Shipwright - Mail Management</title>
</svelte:head>

<div class="h-full">
	<div class="container mx-auto max-w-7xl px-6 py-8">
		<header class="mb-8 text-center">
			<h1 class="mb-2 text-3xl font-bold text-yellow-400">📧 Mail Management</h1>
			<p class="text-slate-400">Import and manage your mail data from the game</p>
		</header>

		<div class="mb-6 flex items-center justify-between">

		<div class="flex gap-3">
			<input
				bind:this={fileInput}
				type="file"
				accept=".json"
				class="hidden"
				on:change={handleMailImport}
			/>

			<button
				on:click={() => fileInput.click()}
				disabled={uploading}
				class="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-blue-400"
			>
				{#if uploading}
					<div
						class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
					></div>
					Importing...
				{:else}
					📤 Import Mails
				{/if}
			</button>

			<button
				on:click={extractSales}
				disabled={extractingSales}
				class="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:bg-green-400"
			>
				{#if extractingSales}
					<div
						class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
					></div>
					Extracting...
				{:else}
					🔍 Extract Sales
				{/if}
			</button>
		</div>
	</div>

	{#if data.error}
		<div class="mb-4 rounded border border-red-400 bg-red-800/20 px-4 py-3 text-red-300">
			{data.error}
		</div>
	{/if}

	<!-- Import History -->
	{#if data.imports.length > 0}
		<div class="mb-6 rounded-lg border border-slate-700 bg-slate-800 p-6">
			<h2 class="mb-3 text-lg font-semibold text-white">Recent Imports</h2>
			<div class="space-y-2">
				{#each data.imports.slice(0, 5) as importRecord}
					<div class="flex items-center justify-between text-sm">
						<span class="text-slate-400">
							{formatDate(importRecord.imported_at || '')}
						</span>
						<span class="font-medium text-white">
							{importRecord.imported_mails}/{importRecord.total_mails} mails imported
						</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Filters -->
	<div class="mb-6 rounded-lg border border-slate-700 bg-slate-800 p-6">
		<h2 class="mb-3 text-lg font-semibold text-white">Filters</h2>
		<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
			<div>
				<label for="sender" class="mb-1 block text-sm font-medium text-slate-300">Sender</label>
				<input
					id="sender"
					type="text"
					bind:value={senderFilter}
					placeholder="Filter by sender..."
					class="w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:ring-blue-500"
				/>
			</div>

			<div>
				<label for="subject" class="mb-1 block text-sm font-medium text-slate-300">Subject</label>
				<input
					id="subject"
					type="text"
					bind:value={subjectFilter}
					placeholder="Filter by subject..."
					class="w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:border-blue-500 focus:ring-blue-500"
				/>
			</div>

			<div class="flex items-end gap-2">
				<button
					on:click={applyFilters}
					class="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
				>
					Apply
				</button>
				<button
					on:click={clearFilters}
					class="rounded-md bg-slate-600 px-4 py-2 text-white hover:bg-slate-700"
				>
					Clear
				</button>
			</div>
		</div>
	</div>

	<!-- Mails List -->
	<div class="rounded-lg border border-slate-700 bg-slate-800 shadow-sm">
		<div class="border-b border-slate-700 px-4 py-3">
			<h2 class="text-lg font-semibold text-white">
				Mails ({data.total.toLocaleString()})
			</h2>
		</div>

		{#if data.mails.length === 0}
			<div class="p-8 text-center text-slate-400">
				<p class="text-lg">No mails found</p>
				<p class="mt-1 text-sm">
					{#if data.filters.sender || data.filters.subject}
						Try adjusting your filters or import some mail data.
					{:else}
						Import some mail data to get started.
					{/if}
				</p>
			</div>
		{:else}
			<div class="divide-y divide-slate-700">
				{#each data.mails as mail}
					<div class="p-4 hover:bg-slate-700/50">
						<div class="flex items-start justify-between">
							<div class="min-w-0 flex-1">
								<div class="mb-2 flex items-center gap-3">
									<span class="text-sm font-medium text-blue-400">
										{mail.sender}
									</span>
									<span class="text-xs text-slate-500">
										{getTimeAgo(mail.timestamp)}
									</span>
								</div>

								<h3 class="mb-1 text-sm font-medium text-white">
									{mail.subject}
								</h3>

								<p class="line-clamp-2 text-xs text-slate-400">
									{mail.body.length > 150 ? mail.body.substring(0, 150) + '...' : mail.body}
								</p>

								{#if mail.location}
									<div class="mt-2">
										<span
											class="inline-flex items-center rounded-full bg-slate-700 px-2 py-1 text-xs text-slate-300"
										>
											📍 {mail.location}
										</span>
									</div>
								{/if}
							</div>

							<div class="ml-4 text-xs text-slate-500">
								{formatDate(mail.timestamp)}
							</div>
						</div>
					</div>
				{/each}
			</div>

			<!-- Pagination -->
			{#if data.pagination.totalPages > 1}
				<div class="flex items-center justify-between border-t border-slate-700 px-4 py-3">
					<div class="text-sm text-slate-400">
						Showing {(data.pagination.page - 1) * data.pagination.limit + 1} to
						{Math.min(data.pagination.page * data.pagination.limit, data.total)} of
						{data.total.toLocaleString()} results
					</div>

					<div class="flex gap-2">
						<button
							on:click={() => goToPage(data.pagination.page - 1)}
							disabled={data.pagination.page <= 1}
							class="rounded border border-slate-600 bg-slate-700 px-3 py-1 text-sm text-white hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
						>
							Previous
						</button>

						{#each Array.from({ length: Math.min(5, data.pagination.totalPages) }, (_, i) => {
							const start = Math.max(1, data.pagination.page - 2);
							return start + i;
						}) as pageNum}
							{#if pageNum <= data.pagination.totalPages}
								<button
									on:click={() => goToPage(pageNum)}
									class="rounded border border-slate-600 bg-slate-700 px-3 py-1 text-sm text-white {pageNum ===
									data.pagination.page
										? 'border-blue-400 bg-blue-600'
										: 'hover:bg-slate-600'}"
								>
									{pageNum}
								</button>
							{/if}
						{/each}

						<button
							on:click={() => goToPage(data.pagination.page + 1)}
							disabled={data.pagination.page >= data.pagination.totalPages}
							class="rounded border border-slate-600 bg-slate-700 px-3 py-1 text-sm text-white hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
						>
							Next
						</button>
					</div>
				</div>
			{/if}
		{/if}
	</div>
</div>
</div>
