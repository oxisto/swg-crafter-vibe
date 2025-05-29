<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	
	let { children } = $props();
</script>

<div class="min-h-screen bg-slate-900 text-white flex">
	<!-- Sidebar Navigation -->
	<nav class="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
		<div class="p-6 border-b border-slate-700">
			<h1 class="text-xl font-bold text-yellow-400">
				🚀 SWG Shipwright
			</h1>
			<p class="text-sm text-slate-400 mt-1">
				Restoration III Server
			</p>
		</div>
		
		<div class="flex-1 p-4">
			<ul class="space-y-2">
				<li>
					<a
						href="/"
						class="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors {$page.url.pathname === '/' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}"
					>
						<span class="text-lg">📦</span>
						<span class="font-medium">Inventory</span>
					</a>
				</li>
				<li>
					<a
						href="/settings"
						class="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors {$page.url.pathname === '/settings' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}"
					>
						<span class="text-lg">⚙️</span>
						<span class="font-medium">Settings</span>
					</a>
				</li>
			</ul>
		</div>
		
		<div class="p-4 border-t border-slate-700">
			<p class="text-xs text-slate-500 text-center">
				May the Force be with your business! 🌟
			</p>
		</div>
	</nav>
	
	<!-- Main Content -->
	<main class="flex-1">
		{@render children()}
	</main>
</div>
