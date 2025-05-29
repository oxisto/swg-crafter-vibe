import { OPENAI_API_KEY } from '$env/static/private';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async () => {
  // Check if OpenAI API key is configured
  const hasApiKey = !!OPENAI_API_KEY;
  
  return {
    hasApiKey,
  };
};
