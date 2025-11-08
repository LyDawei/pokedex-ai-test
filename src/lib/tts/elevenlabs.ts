// ElevenLabs Text-to-Speech integration (client-side)
import { base } from '$app/paths';

// Track current audio instance and URL for cleanup
let currentAudio: HTMLAudioElement | null = null;
let currentAudioUrl: string | null = null;

/**
 * Convert text to speech using our API endpoint
 */
export async function textToSpeech(text: string): Promise<ArrayBuffer> {
	const response = await fetch(`${base}/api/tts`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ text })
	});

	if (!response.ok) {
		const error = await response.json().catch(() => ({ error: 'Unknown error' }));
		throw new Error(error.error || `API error: ${response.statusText}`);
	}

	return response.arrayBuffer();
}

/**
 * Stop current audio playback and clean up resources
 */
export function stopAudio(): void {
	if (currentAudio) {
		// Clear event handlers to prevent them from firing after cleanup
		currentAudio.onended = null;
		currentAudio.onerror = null;
		currentAudio.pause();
		currentAudio.src = '';
		currentAudio = null;
	}
	if (currentAudioUrl) {
		URL.revokeObjectURL(currentAudioUrl);
		currentAudioUrl = null;
	}
}

/**
 * Play audio from ArrayBuffer
 */
export async function playAudio(audioBuffer: ArrayBuffer): Promise<void> {
	// Stop any currently playing audio
	stopAudio();

	const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
	const url = URL.createObjectURL(blob);
	const audio = new Audio(url);

	// Store references for potential cleanup
	currentAudio = audio;
	currentAudioUrl = url;

	return new Promise((resolve, reject) => {
		audio.onended = () => {
			URL.revokeObjectURL(url);
			currentAudio = null;
			currentAudioUrl = null;
			resolve();
		};
		audio.onerror = (error) => {
			URL.revokeObjectURL(url);
			currentAudio = null;
			currentAudioUrl = null;
			reject(error);
		};
		audio.play();
	});
}

/**
 * Speak Pokedex entry with Dexter-style voice
 */
export async function speakPokedexEntry(entry: string): Promise<void> {
	const audioBuffer = await textToSpeech(entry);
	await playAudio(audioBuffer);
}
