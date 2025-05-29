<script lang="ts">
	import { onMount } from 'svelte';
	import { marked } from 'marked';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	interface Message {
		role: 'user' | 'assistant';
		content: string;
		timestamp: Date;
	}

	// Configure marked for better rendering
	marked.setOptions({
		breaks: true, // Enable line breaks
		gfm: true // GitHub Flavored Markdown
	});

	let messages = $state<Message[]>([]);
	let currentMessage = $state('');
	let isLoading = $state(false);
	let messagesContainer = $state<HTMLDivElement>();

	// Load messages from localStorage on mount
	function loadMessages() {
		if (typeof window !== 'undefined') {
			const saved = localStorage.getItem('swg-chat-messages');
			if (saved) {
				try {
					const parsed = JSON.parse(saved);
					// Convert timestamp strings back to Date objects
					messages = parsed.map((msg: any) => ({
						...msg,
						timestamp: new Date(msg.timestamp)
					}));
				} catch (error) {
					console.error('Failed to load chat messages:', error);
				}
			}
		}
	}

	// Save messages to localStorage
	function saveMessages() {
		if (typeof window !== 'undefined') {
			localStorage.setItem('swg-chat-messages', JSON.stringify(messages));
		}
	}

	// Save messages whenever they change
	$effect(() => {
		saveMessages();
	});

	// Scroll to bottom when new messages are added
	$effect(() => {
		if (messagesContainer && messages.length > 0) {
			setTimeout(() => {
				messagesContainer?.scrollTo({
					top: messagesContainer.scrollHeight,
					behavior: 'smooth'
				});
			}, 10);
		}
	});

	// Sample conversation starters focused on function calling capabilities
	const conversationStarters = [
		'Analyze my current stock levels in detail',
		'What armor parts am I running low on?',
		'Search for schematics related to engines',
		'Show me Mark V components only',
		'Find schematics containing "Advanced" in the name',
		'Which categories have zero stock?',
		'Compare my inventory to recommended levels',
		'What parts do I have the most of?'
	];

	async function sendMessage() {
		if (!currentMessage.trim() || isLoading) return;

		const userMessage: Message = {
			role: 'user',
			content: currentMessage.trim(),
			timestamp: new Date()
		};

		messages.push(userMessage);
		const messageToSend = currentMessage.trim();
		currentMessage = '';
		isLoading = true;

		try {
			// Build conversation history for context
			const conversation = messages
				.slice(0, -1) // Exclude the message we just added
				.map((msg) => ({
					role: msg.role,
					content: msg.content
				}));

			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					message: messageToSend,
					conversation
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to send message');
			}

			const data = await response.json();

			const aiMessage: Message = {
				role: 'assistant',
				content: data.message,
				timestamp: new Date()
			};

			messages.push(aiMessage);
		} catch (error) {
			console.error('Error sending message:', error);

			const errorMessage: Message = {
				role: 'assistant',
				content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
				timestamp: new Date()
			};

			messages.push(errorMessage);
		} finally {
			isLoading = false;
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			sendMessage();
		}
	}

	function startConversation(prompt: string) {
		currentMessage = prompt;
		sendMessage();
	}

	function clearChat() {
		messages = [];
		if (typeof window !== 'undefined') {
			localStorage.removeItem('swg-chat-messages');
		}
	}

	// Scroll to bottom when new messages are added
	$effect(() => {
		if (messagesContainer && messages.length > 0) {
			setTimeout(() => {
				if (messagesContainer) {
					messagesContainer.scrollTop = messagesContainer.scrollHeight;
				}
			}, 100);
		}
	});

	onMount(() => {
		// Load existing messages first
		loadMessages();

		// Add welcome message only if no messages exist
		if (data.hasApiKey && messages.length === 0) {
			messages.push({
				role: 'assistant',
				content: `Hello! I'm your SWG Shipwright AI assistant with advanced function calling capabilities. I can dynamically access your inventory data and the complete SWGAide schematics database.

I can help you with:
• Analyzing your current stock levels and identifying trends
• Recommending what to craft based on demand and profitability  
• Finding low stock items and suggesting restocking priorities
• Searching schematics by name, category, or requirements
• Explaining component relationships and crafting strategies
• Optimizing your shipwright business operations

Ask me anything about your inventory or Star Wars Galaxies shipwright business!`,
				timestamp: new Date()
			});
		}
	});
</script>

<svelte:head>
	<title>SWG Shipwright - AI Assistant</title>
</svelte:head>

<div class="flex h-full flex-col">
	<div class="w-full px-4 py-6">
		<header class="mb-6 text-center">
			<h1 class="mb-2 text-3xl font-bold text-yellow-400">AI Assistant</h1>
			<p class="text-slate-400">Enhanced with OpenAI Function Calling - dynamic data querying</p>
			<div
				class="mt-2 inline-flex items-center rounded-full bg-blue-900/40 px-3 py-1 text-xs text-blue-400"
			>
				⚡ Function Calling Enabled
			</div>
		</header>

		{#if !data.hasApiKey}
			<div class="mx-auto max-w-2xl">
				<div class="rounded-lg border border-red-700 bg-red-900/40 p-6 text-center">
					<h2 class="mb-2 text-xl font-bold text-red-400">API Key Required</h2>
					<p class="mb-4 text-slate-300">
						To use the AI assistant, you need to configure your OpenAI API key in the environment
						variables.
					</p>
					<div class="rounded bg-slate-800 p-4 text-left">
						<code class="text-green-400">OPENAI_API_KEY=your_api_key_here</code>
					</div>
				</div>
			</div>
		{:else}
			<div class="mx-auto flex h-full max-w-6xl flex-col px-6">
				<!-- Messages Container -->
				<div
					bind:this={messagesContainer}
					class="mb-4 max-h-[600px] min-h-[500px] flex-1 overflow-y-auto rounded-lg border border-slate-700 bg-slate-800/50 p-4"
				>
					{#if messages.length === 0}
						<div class="mt-8 text-center text-slate-400">
							<p class="mb-6">
								Start a conversation by typing a message or try one of these function calling
								prompts:
							</p>
							<div class="mx-auto grid max-w-2xl gap-2">
								{#each conversationStarters as starter}
									<button
										onclick={() => startConversation(starter)}
										class="rounded-lg bg-slate-700 p-3 text-left transition-colors hover:bg-slate-600"
									>
										{starter}
									</button>
								{/each}
							</div>
						</div>
					{:else}
						{#each messages as message}
							<div class="mb-4 {message.role === 'user' ? 'text-right' : 'text-left'}">
								<div
									class="inline-block max-w-[80%] {message.role === 'user'
										? 'bg-blue-600'
										: 'bg-slate-700'} rounded-lg p-3"
								>
									<div class="mb-1 text-xs text-slate-300">
										{message.role === 'user' ? 'You' : 'AI Assistant'}
										<span class="text-slate-400">• {message.timestamp.toLocaleTimeString()}</span>
									</div>
									{#if message.role === 'assistant'}
										<div class="prose-markdown text-white">
											{@html marked(message.content)}
										</div>
									{:else}
										<div class="whitespace-pre-wrap text-white">{message.content}</div>
									{/if}
								</div>
							</div>
						{/each}

						{#if isLoading}
							<div class="mb-4 text-left">
								<div class="inline-block rounded-lg bg-slate-700 p-3">
									<div class="mb-1 text-xs text-slate-300">AI Assistant</div>
									<div class="text-white">
										<span class="inline-flex items-center">
											<span class="animate-pulse">⚡</span>
											<span class="animation-delay-100 animate-pulse">🔧</span>
											<span class="animation-delay-200 animate-pulse">📊</span>
											<span class="ml-2">Calling functions...</span>
										</span>
									</div>
								</div>
							</div>
						{/if}
					{/if}
				</div>

				<!-- Input Area -->
				<div class="flex gap-2">
					<textarea
						bind:value={currentMessage}
						onkeydown={handleKeydown}
						placeholder="Ask about your inventory, get crafting suggestions, or request analysis..."
						class="flex-1 resize-none rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
						rows="3"
						disabled={isLoading}
					></textarea>
					<div class="flex flex-col gap-2">
						<button
							onclick={sendMessage}
							disabled={!currentMessage.trim() || isLoading}
							class="rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-600"
						>
							Send
						</button>
						<button
							onclick={clearChat}
							class="rounded-lg bg-slate-600 px-6 py-3 text-white transition-colors hover:bg-slate-500"
						>
							Clear
						</button>
					</div>
				</div>

				<div class="mt-2 text-center text-xs text-slate-500">
					Press Enter to send • Shift+Enter for new line • Functions will be called automatically
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.animation-delay-100 {
		animation-delay: 0.1s;
	}
	.animation-delay-200 {
		animation-delay: 0.2s;
	}

	/* Custom markdown styles for dark theme */
	:global(
		.prose-markdown h1,
		.prose-markdown h2,
		.prose-markdown h3,
		.prose-markdown h4,
		.prose-markdown h5,
		.prose-markdown h6
	) {
		color: #facc15;
		font-weight: bold;
		margin-top: 1rem;
		margin-bottom: 0.5rem;
	}

	:global(.prose-markdown h1) {
		font-size: 1.25rem;
	}
	:global(.prose-markdown h2) {
		font-size: 1.125rem;
	}
	:global(.prose-markdown h3) {
		font-size: 1rem;
	}

	:global(.prose-markdown p) {
		margin-bottom: 0.75rem;
		line-height: 1.625;
	}

	:global(.prose-markdown ul, .prose-markdown ol) {
		margin-bottom: 0.75rem;
		margin-left: 1rem;
	}

	:global(.prose-markdown li) {
		margin-bottom: 0.25rem;
	}

	:global(.prose-markdown ul li) {
		list-style-type: disc;
	}

	:global(.prose-markdown ol li) {
		list-style-type: decimal;
	}

	:global(.prose-markdown code) {
		background-color: #1e293b;
		color: #fde047;
		padding: 0.125rem 0.25rem;
		border-radius: 0.25rem;
		font-size: 0.875rem;
	}

	:global(.prose-markdown pre) {
		background-color: #1e293b;
		padding: 0.75rem;
		border-radius: 0.5rem;
		overflow-x: auto;
		margin-bottom: 0.75rem;
	}

	:global(.prose-markdown pre code) {
		background-color: transparent;
		padding: 0;
	}

	:global(.prose-markdown blockquote) {
		border-left: 4px solid #facc15;
		padding-left: 1rem;
		font-style: italic;
		color: #cbd5e1;
		margin-bottom: 0.75rem;
	}

	:global(.prose-markdown strong, .prose-markdown b) {
		font-weight: bold;
		color: #facc15;
	}

	:global(.prose-markdown em, .prose-markdown i) {
		font-style: italic;
		color: #93c5fd;
	}

	:global(.prose-markdown table) {
		width: 100%;
		border-collapse: collapse;
		border: 1px solid #475569;
		margin-bottom: 0.75rem;
	}

	:global(.prose-markdown th, .prose-markdown td) {
		border: 1px solid #475569;
		padding: 0.75rem;
	}

	:global(.prose-markdown th) {
		background-color: #334155;
		font-weight: bold;
		color: #facc15;
	}
</style>
