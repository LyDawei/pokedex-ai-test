/**
 * Audio playback utility for Pokédex UI sounds
 */

import { base } from '$app/paths';

let dpadClickAudio: HTMLAudioElement | null = null;
let centerButtonAudio: HTMLAudioElement | null = null;

/**
 * Play the D-pad click sound
 */
export function playDpadClick(): void {
	if (typeof Audio === 'undefined') return;

	// Stop previous sound if still playing
	if (dpadClickAudio) {
		dpadClickAudio.pause();
		dpadClickAudio.currentTime = 0;
	}

	dpadClickAudio = new Audio(`${base}/assets/audio/pokedex_click.ogg`);
	dpadClickAudio.volume = 0.6;

	dpadClickAudio.play().catch((err) => {
		console.error('Error playing D-pad click sound:', err);
	});
}

/**
 * Play the center button scan/register sound
 */
export function playCenterButtonSound(): void {
	if (typeof Audio === 'undefined') return;

	// Stop previous sound if still playing
	if (centerButtonAudio) {
		centerButtonAudio.pause();
		centerButtonAudio.currentTime = 0;
	}

	centerButtonAudio = new Audio(`${base}/assets/audio/pokedex_scan_register_aspect.ogg`);
	centerButtonAudio.volume = 0.6;

	centerButtonAudio.play().catch((err) => {
		console.error('Error playing center button sound:', err);
	});
}

/**
 * Stop all UI sounds
 */
export function stopAllUISounds(): void {
	if (dpadClickAudio) {
		dpadClickAudio.pause();
		dpadClickAudio.src = '';
		dpadClickAudio = null;
	}

	if (centerButtonAudio) {
		centerButtonAudio.pause();
		centerButtonAudio.src = '';
		centerButtonAudio = null;
	}
}
