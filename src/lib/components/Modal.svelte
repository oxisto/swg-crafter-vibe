<!--
 * Common Modal Component
 * 
 * Provides a consistent modal design with backdrop and close functionality
-->
<script lang="ts">
	import Button from './Button.svelte';

	let {
		open = $bindable(),
		title,
		children,
		actions,
		maxWidth = 'max-w-lg',
		closeOnBackdrop = true
	} = $props<{
		open: boolean;
		title?: string;
		children: any;
		actions?: any;
		maxWidth?: string;
		closeOnBackdrop?: boolean;
	}>();

	function closeModal() {
		open = false;
	}

	function handleBackdropClick(event: MouseEvent) {
		if (closeOnBackdrop && event.target === event.currentTarget) {
			closeModal();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			closeModal();
		}
	}
</script>

{#if open}
	<!-- Backdrop -->
	<div
		class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4"
		onclick={handleBackdropClick}
		onkeydown={handleKeydown}
		role="dialog"
		aria-modal="true"
		aria-labelledby={title ? 'modal-title' : undefined}
		tabindex="-1"
	>
		<!-- Modal -->
		<div class="w-full {maxWidth} transform rounded-lg bg-slate-800 shadow-xl transition-all">
			{#if title}
				<!-- Header -->
				<div class="flex items-center justify-between border-b border-slate-700 px-6 py-4">
					<h3 id="modal-title" class="text-lg font-semibold text-white">{title}</h3>
					<Button variant="ghost" size="sm" onclick={closeModal}>
						<span class="sr-only">Close</span>
						<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width={2}
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</Button>
				</div>
			{/if}

			<!-- Content -->
			<div class="px-6 py-4">
				{@render children()}
			</div>

			{#if actions}
				<!-- Footer -->
				<div class="flex justify-end gap-3 border-t border-slate-700 px-6 py-4">
					{@render actions()}
				</div>
			{/if}
		</div>
	</div>
{/if}
