import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { checkRateLimit } from '$lib/rateLimit';

const API_KEY = env.ELEVENLABS_API_KEY;
const API_URL = 'https://api.elevenlabs.io/v1';
const VOICE_ID = env.ELEVENLABS_VOICE_ID || 'duIivFCQWvNj2G0O7aV2'; // Custom voice

// Rate limit: 10 requests per minute per IP
const RATE_LIMIT_CONFIG = {
	maxRequests: 10,
	interval: 60 * 1000 // 1 minute
};

// Handle CORS preflight requests
export const OPTIONS: RequestHandler = async () => {
	return new Response(null, {
		status: 204,
		headers: {
			'Access-Control-Allow-Methods': 'POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
			'Access-Control-Max-Age': '86400'
		}
	});
};

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	// Apply rate limiting
	// Note: We apply rate limiting BEFORE validation to prevent abuse
	// through invalid requests and enumeration attacks
	const clientIp = getClientAddress();
	const rateLimitResult = checkRateLimit(clientIp, RATE_LIMIT_CONFIG);

	if (!rateLimitResult.success) {
		return json(
			{ error: 'Too many requests. Please try again later.' },
			{
				status: 429,
				headers: {
					'X-RateLimit-Limit': rateLimitResult.limit.toString(),
					'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
					'X-RateLimit-Reset': rateLimitResult.reset.toString(),
					'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString()
				}
			}
		);
	}
	if (!API_KEY) {
		return json({ error: 'ElevenLabs API key not configured' }, { status: 500 });
	}

	const { text } = await request.json();

	if (!text || typeof text !== 'string') {
		return json({ error: 'Text is required' }, { status: 400 });
	}

	// Validate text length (max 5000 characters)
	if (text.length > 5000) {
		return json({ error: 'Text too long. Maximum 5000 characters allowed.' }, { status: 400 });
	}

	try {
		const response = await fetch(`${API_URL}/text-to-speech/${VOICE_ID}`, {
			method: 'POST',
			headers: {
				'Accept': 'audio/mpeg',
				'Content-Type': 'application/json',
				'xi-api-key': API_KEY
			},
			body: JSON.stringify({
				text,
				model_id: 'eleven_turbo_v2_5',
				voice_settings: {
					stability: 0.5,
					similarity_boost: 0.75
				}
			})
		});

		if (!response.ok) {
			const errorText = await response.text();

			// Log detailed error server-side only
			if (import.meta.env.DEV) {
				console.error('ElevenLabs API error:', response.status, errorText);
			}

			// Return sanitized error message to client
			return json({ error: 'Failed to generate speech' }, { status: 500 });
		}

		const audioBuffer = await response.arrayBuffer();

		return new Response(audioBuffer, {
			headers: {
				'Content-Type': 'audio/mpeg',
				'Content-Length': audioBuffer.byteLength.toString(),
				'X-RateLimit-Limit': rateLimitResult.limit.toString(),
				'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
				'X-RateLimit-Reset': rateLimitResult.reset.toString()
			}
		});
	} catch (error) {
		// Log detailed error server-side only
		if (import.meta.env.DEV) {
			console.error('TTS error:', error);
		}
		return json({ error: 'Failed to generate speech' }, { status: 500 });
	}
};
