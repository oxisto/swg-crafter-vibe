/**
 * @fileoverview Chat page server loader for the SWG Shipwright application.
 * Checks OpenAI API key availability for the AI chat functionality.
 *
 * @author SWG Crafter Team
 * @since 1.0.0
 */

// filepath: /Users/oxisto/Repositories/swg-crafter/src/routes/chat/+page.server.ts
import { OPENAI_API_KEY } from '$env/static/private';
import type { PageServerLoad } from './$types.js';

/**
 * Page load function for the AI chat interface.
 * Validates that OpenAI API key is configured before enabling chat features.
 *
 * @returns {Promise<object>} Page data indicating API key availability
 */
export const load: PageServerLoad = async () => {
	// Check if OpenAI API key is configured
	const hasApiKey = !!OPENAI_API_KEY;

	return {
		hasApiKey
	};
};
