<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import PageLayout from '$lib/components/PageLayout.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import ActionBar from '$lib/components/ActionBar.svelte';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import FilterSection from '$lib/components/FilterSection.svelte';
	import DataTable from '$lib/components/DataTable.svelte';
	import Input from '$lib/components/Input.svelte';
	import Alert from '$lib/components/Alert.svelte';
	import Loading from '$lib/components/Loading.svelte';
	import type { PageData } from './$types';
	import type { MailData, MailImport } from '$lib/types';
	import { getPlanetInfo } from '$lib/types';

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

<PageLayout maxWidth="7xl">
	<PageHeader
		title="Mail Management"
		subtitle="Import and manage your mail data from the game"
		emoji="📧"
		centered={true}
	/>

	<ActionBar>
		<input
			bind:this={fileInput}
			type="file"
			accept=".json"
			class="hidden"
			on:change={handleMailImport}
		/>

		<Button onclick={() => fileInput.click()} disabled={uploading} variant="primary">
			{#if uploading}
				<Loading size="sm" />
				Importing...
			{:else}
				📤 Import Mails
			{/if}
		</Button>

		<Button onclick={extractSales} disabled={extractingSales} variant="success">
			{#if extractingSales}
				<Loading size="sm" />
				Extracting...
			{:else}
				🔍 Extract Sales
			{/if}
		</Button>
	</ActionBar>

	{#if data.error}
		<Alert variant="error" className="mb-4">
			{data.error}
		</Alert>
	{/if}

	<!-- Import History -->
	{#if data.imports.length > 0}
		<Card className="mb-6">
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
		</Card>
	{/if}

	<!-- Filters -->
	<FilterSection onApply={applyFilters} onClear={clearFilters}>
		<div>
			<Input
				id="sender"
				label="Sender"
				bind:value={senderFilter}
				placeholder="Filter by sender..."
			/>
		</div>

		<div>
			<Input
				id="subject"
				label="Subject"
				bind:value={subjectFilter}
				placeholder="Filter by subject..."
			/>
		</div>
	</FilterSection>

	<!-- Mails List -->
	<DataTable
		mode="table"
		title="Mails"
		total={data.total}
		items={data.mails}
		emptyMessage="No mails found"
		emptySubMessage={data.filters.sender || data.filters.subject
			? 'Try adjusting your filters or import some mail data.'
			: 'Import some mail data to get started.'}
		pagination={data.pagination}
		onPageChange={goToPage}
		columns={[
			{ key: 'sender', label: 'Sender' },
			{ key: 'subject', label: 'Subject' },
			{ key: 'body', label: 'Preview' },
			{ key: 'location', label: 'Location' },
			{ key: 'timestamp', label: 'Date' }
		]}
	>
		{#snippet renderCell(mail, column, i)}
			{#if column.key === 'sender'}
				<span class="text-base font-medium text-blue-400">{mail.sender}</span>
			{:else if column.key === 'subject'}
				<span class="text-base font-medium text-white">{mail.subject}</span>
			{:else if column.key === 'body'}
				<span class="text-sm text-slate-400">
					{mail.body.length > 100 ? mail.body.substring(0, 100) + '...' : mail.body}
				</span>
			{:else if column.key === 'location'}
				{#if mail.location}
					{@const planetInfo = getPlanetInfo(mail.location)}
					<span
						class="inline-flex h-6 w-6 items-center justify-center rounded-full font-mono text-xs font-bold {planetInfo.color} {planetInfo.bg} border border-current/20"
						title={planetInfo.name}
					>
						{planetInfo.letter}
					</span>
				{:else}
					<span class="text-base text-slate-500">-</span>
				{/if}
			{:else if column.key === 'timestamp'}
				<div class="text-right">
					<div class="text-sm text-slate-300">{formatDate(mail.timestamp)}</div>
					<div class="text-xs text-slate-500">{getTimeAgo(mail.timestamp)}</div>
				</div>
			{/if}
		{/snippet}
	</DataTable>
</PageLayout>
