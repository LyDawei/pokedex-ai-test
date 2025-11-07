import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const API_KEY = env.ELEVENLABS_API_KEY;
const API_URL = 'https://api.elevenlabs.io/v1';
const VOICE_ID = env.ELEVENLABS_VOICE_ID || 'duIivFCQWvNj2G0O7aV2'; // Custom voice

export const POST: RequestHandler = async ({ request }) => {
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
			console.error('ElevenLabs API error:', errorText);
			return json({ error: `ElevenLabs API error: ${response.statusText}` }, { status: response.status });
		}

		const audioBuffer = await response.arrayBuffer();

		return new Response(audioBuffer, {
			headers: {
				'Content-Type': 'audio/mpeg',
				'Content-Length': audioBuffer.byteLength.toString()
			}
		});
	} catch (error) {
		console.error('TTS error:', error);
		return json({ error: 'Failed to generate speech' }, { status: 500 });
	}
};
