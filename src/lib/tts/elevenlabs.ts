// ElevenLabs Text-to-Speech integration (client-side)
import { base } from '$app/paths';

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
	const audioBuffer = await textToSpeech(entry);
	await playAudio(audioBuffer);
}
