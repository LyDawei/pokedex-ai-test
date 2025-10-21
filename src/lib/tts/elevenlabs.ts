// ElevenLabs Text-to-Speech integration
import { env } from '$env/dynamic/private';

const API_KEY = env.ELEVENLABS_API_KEY;
const API_URL = 'https://api.elevenlabs.io/v1';

// Voice ID for a nerdy/scientific voice (similar to Dexter)
// Using a higher-pitched, more youthful voice to match 90s Dexter
const DEXTER_VOICE_ID = 'ErXwobaYiN019PkySvjV'; // Antoni voice - younger, more energetic

export interface TTSOptions {
	text: string;
	voiceId?: string;
	stability?: number;
	similarityBoost?: number;
}

/**
 * Convert text to speech using ElevenLabs API
 */
export async function textToSpeech(options: TTSOptions): Promise<ArrayBuffer> {
	const {
		text,
		voiceId = DEXTER_VOICE_ID,
		stability = 0.3,  // Lower stability for more energetic/nerdy variation
		similarityBoost = 0.85  // Higher similarity for more consistent character
	} = options;

	const response = await fetch(`${API_URL}/text-to-speech/${voiceId}`, {
		method: 'POST',
		headers: {
			'Accept': 'audio/mpeg',
			'Content-Type': 'application/json',
			'xi-api-key': API_KEY
		},
		body: JSON.stringify({
			text,
			model_id: 'eleven_monolingual_v1',
			voice_settings: {
				stability,
				similarity_boost: similarityBoost
			}
		})
	});

	if (!response.ok) {
		throw new Error(`ElevenLabs API error: ${response.statusText}`);
	}

	return response.arrayBuffer();
}

/**
 * Play audio from ArrayBuffer
 */
export async function playAudio(audioBuffer: ArrayBuffer): Promise<void> {
	const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
	const url = URL.createObjectURL(blob);
	const audio = new Audio(url);

	return new Promise((resolve, reject) => {
		audio.onended = () => {
			URL.revokeObjectURL(url);
			resolve();
		};
		audio.onerror = reject;
		audio.play();
	});
}

/**
 * Speak Pokedex entry with Dexter-style voice
 */
export async function speakPokedexEntry(entry: string): Promise<void> {
	const audioBuffer = await textToSpeech({ text: entry });
	await playAudio(audioBuffer);
}
