<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';

	let { children } = $props();
</script>

<div class="flex min-h-screen bg-slate-900 text-white">
	<!-- Sidebar Navigation -->
	<nav class="flex w-64 flex-col border-r border-slate-700 bg-slate-800">
		<div class="border-b border-slate-700 p-6">
			<h1 class="text-xl font-bold text-yellow-400">🚀 SWG Shipwright</h1>
			<p class="mt-1 text-sm text-slate-400">Restoration III Server</p>
		</div>

		<div class="flex-1 p-4">
			<ul class="space-y-2">
				<li>
					<a
						href="/inventory"
						class="flex items-center gap-3 rounded-lg px-4 py-3 transition-colors {$page.url
							.pathname === '/inventory'
							? 'bg-blue-600 text-white'
							: 'text-slate-300 hover:bg-slate-700 hover:text-white'}"
					>
						<span class="text-lg">📦</span>
						<span class="font-medium">Inventory</span>
					</a>
				</li>
				<li>
					<a
						href="/chat"
						class="flex items-center gap-3 rounded-lg px-4 py-3 transition-colors {$page.url
							.pathname === '/chat'
							? 'bg-blue-600 text-white'
							: 'text-slate-300 hover:bg-slate-700 hover:text-white'}"
					>
						<span class="text-lg">🤖</span>
						<span class="font-medium">AI Assistant</span>
					</a>
				</li>
			</ul>

			<!-- Separator -->
			<div class="my-4 border-t border-slate-600"></div>

			<ul class="space-y-2">
				<li>
					<a
						href="/settings"
						class="flex items-center gap-3 rounded-lg px-4 py-3 transition-colors {$page.url
							.pathname === '/settings'
							? 'bg-blue-600 text-white'
							: 'text-slate-300 hover:bg-slate-700 hover:text-white'}"
					>
						<span class="text-lg">⚙️</span>
						<span class="font-medium">Settings</span>
					</a>
				</li>
			</ul>
		</div>

		<div class="border-t border-slate-700 p-4">
			<p class="text-center text-xs text-slate-500">May the Force be with your business! 🌟</p>
		</div>
	</nav>

	<!-- Main Content -->
	<main class="flex-1">
		{@render children()}
	</main>
</div>
