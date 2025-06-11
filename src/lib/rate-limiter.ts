/**
 * Simple rate limiter for SOAP API calls
 * Prevents excessive API usage by implementing a sliding window approach
 */

interface RateLimitEntry {
	count: number;
	resetTime: number;
}

class RateLimiter {
	private limits: Map<string, RateLimitEntry> = new Map();
	private readonly maxRequests: number;
	private readonly windowMs: number;

	constructor(maxRequests: number = 60, windowMs: number = 60 * 1000) {
		this.maxRequests = maxRequests;
		this.windowMs = windowMs;
	}

	/**
	 * Check if a request is allowed for the given key
	 * @param key - Usually an IP address or user identifier
	 * @returns Object with allowed status and remaining requests
	 */
	checkLimit(key: string): { allowed: boolean; remaining: number; resetTime: number } {
		const now = Date.now();
		const entry = this.limits.get(key);

		if (!entry || now >= entry.resetTime) {
			// No existing entry or window has expired - allow request
			this.limits.set(key, {
				count: 1,
				resetTime: now + this.windowMs
			});

			return {
				allowed: true,
				remaining: this.maxRequests - 1,
				resetTime: now + this.windowMs
			};
		}

		if (entry.count >= this.maxRequests) {
			// Rate limit exceeded
			return {
				allowed: false,
				remaining: 0,
				resetTime: entry.resetTime
			};
		}

		// Increment count and allow request
		entry.count++;
		this.limits.set(key, entry);

		return {
			allowed: true,
			remaining: this.maxRequests - entry.count,
			resetTime: entry.resetTime
		};
	}

	/**
	 * Clean up expired entries to prevent memory leaks
	 */
	cleanup(): void {
		const now = Date.now();
		for (const [key, entry] of this.limits.entries()) {
			if (now >= entry.resetTime) {
				this.limits.delete(key);
			}
		}
	}

	/**
	 * Get current statistics
	 */
	getStats(): { totalKeys: number; maxRequests: number; windowMs: number } {
		return {
			totalKeys: this.limits.size,
			maxRequests: this.maxRequests,
			windowMs: this.windowMs
		};
	}
}

// Global rate limiter instance
// 60 requests per minute for SOAP API calls
export const soapRateLimiter = new RateLimiter(60, 60 * 1000);

// Cleanup expired entries every 5 minutes
setInterval(
	() => {
		soapRateLimiter.cleanup();
	},
	5 * 60 * 1000
);

export default RateLimiter;
