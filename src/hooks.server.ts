import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);

	// CORS headers for API endpoints
	// Since the API is served from the same domain, these are primarily for documentation
	// If you need to allow cross-origin requests, configure these headers appropriately
	if (event.url.pathname.startsWith('/api/')) {
		// Allow same-origin requests (current setup)
		response.headers.set('Access-Control-Allow-Origin', event.url.origin);
		response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
		response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
		response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
	}

	// Content Security Policy
	// Allows resources from self, PokeAPI, ElevenLabs, and Pokemon sprite CDN
	response.headers.set(
		'Content-Security-Policy',
		[
			"default-src 'self'",
			"script-src 'self' 'unsafe-inline'", // unsafe-inline needed for SvelteKit
			"style-src 'self' 'unsafe-inline'", // unsafe-inline needed for component styles
			"img-src 'self' data: raw.githubusercontent.com",
			"media-src 'self' blob:", // Allow audio playback from blob URLs
			"connect-src 'self' https://api.elevenlabs.io https://pokeapi.co",
			"font-src 'self'",
			"object-src 'none'",
			"base-uri 'self'",
			"form-action 'self'",
			"frame-ancestors 'none'",
			"upgrade-insecure-requests"
		].join('; ')
	);

	// Prevent MIME type sniffing
	response.headers.set('X-Content-Type-Options', 'nosniff');

	// Prevent clickjacking
	response.headers.set('X-Frame-Options', 'DENY');

	// Control referrer information
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

	// Permissions Policy (formerly Feature Policy)
	response.headers.set(
		'Permissions-Policy',
		'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
	);

	// Strict Transport Security (only in production)
	if (import.meta.env.PROD) {
		response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
	}

	return response;
};
