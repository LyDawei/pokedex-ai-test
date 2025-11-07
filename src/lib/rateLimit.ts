// Simple in-memory rate limiter
// This works well for serverless environments like Vercel:
// - Each instance maintains its own state during its lifetime
// - Rate limits reset on cold starts (acceptable for hobby projects)
// - For distributed rate limiting, consider Vercel KV or Upstash Redis

interface RateLimitEntry {
	count: number;
	resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Clean up old entries every 5 minutes
// This runs while the serverless instance is warm
setInterval(() => {
	const now = Date.now();
	for (const [key, entry] of rateLimitMap.entries()) {
		if (entry.resetTime < now) {
			rateLimitMap.delete(key);
		}
	}
}, 5 * 60 * 1000);

/**
 * Lazy cleanup: Remove expired entries during rate limit checks
 * This ensures cleanup happens even if the interval hasn't run
 */
function cleanupExpiredEntries() {
	const now = Date.now();
	const keysToDelete: string[] = [];

	// Collect expired keys
	for (const [key, entry] of rateLimitMap.entries()) {
		if (entry.resetTime < now) {
			keysToDelete.push(key);
		}
	}

	// Delete expired entries
	keysToDelete.forEach(key => rateLimitMap.delete(key));

	// Prevent unlimited growth: if map gets too large, clear oldest entries
	if (rateLimitMap.size > 10000) {
		const entries = Array.from(rateLimitMap.entries());
		entries.sort((a, b) => a[1].resetTime - b[1].resetTime);
		const toRemove = entries.slice(0, 5000);
		toRemove.forEach(([key]) => rateLimitMap.delete(key));
	}
}

export interface RateLimitConfig {
	/** Maximum number of requests allowed within the interval */
	maxRequests: number;
	/** Time window in milliseconds */
	interval: number;
}

export interface RateLimitResult {
	success: boolean;
	limit: number;
	remaining: number;
	reset: number;
}

/**
 * Check if a request from the given identifier is within rate limits
 * @param identifier - Unique identifier (e.g., IP address, user ID)
 * @param config - Rate limit configuration
 * @returns Rate limit result with remaining requests and reset time
 */
export function checkRateLimit(
	identifier: string,
	config: RateLimitConfig
): RateLimitResult {
	// Periodically clean up expired entries (every ~100 requests)
	if (Math.random() < 0.01) {
		cleanupExpiredEntries();
	}

	const now = Date.now();
	const entry = rateLimitMap.get(identifier);

	// If no entry exists or the time window has passed, create a new entry
	if (!entry || entry.resetTime < now) {
		const newEntry: RateLimitEntry = {
			count: 1,
			resetTime: now + config.interval
		};
		rateLimitMap.set(identifier, newEntry);

		return {
			success: true,
			limit: config.maxRequests,
			remaining: config.maxRequests - 1,
			reset: newEntry.resetTime
		};
	}

	// Check if the request exceeds the limit
	if (entry.count >= config.maxRequests) {
		return {
			success: false,
			limit: config.maxRequests,
			remaining: 0,
			reset: entry.resetTime
		};
	}

	// Increment the count
	entry.count++;

	return {
		success: true,
		limit: config.maxRequests,
		remaining: config.maxRequests - entry.count,
		reset: entry.resetTime
	};
}
