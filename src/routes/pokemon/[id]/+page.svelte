<script lang="ts">
	import { formatPokemonName, getTypeColor } from '$lib/api/pokeapi';
	import { speakPokedexEntry } from '$lib/tts/elevenlabs';
	import type { PageData } from './$types';

	export let data: PageData;
	const { pokemon, locations, species } = data;

	let isPlaying = false;

	function formatLocationName(name: string): string {
		return name
			.split('-')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}

	// Get the first English Pokedex entry (preferably from Red/Blue for 90s nostalgia)
	function getPokedexEntry(): string {
		const englishEntries = species.flavor_text_entries.filter(
			(entry) => entry.language.name === 'en'
		);

		// Prefer entries from original games (red, blue, yellow)
		const classicEntry = englishEntries.find((entry) =>
			['red', 'blue', 'yellow'].includes(entry.version.name)
		);

		const entry = classicEntry || englishEntries[0];
		// Clean up the text (remove form feeds and extra whitespace)
		return entry?.flavor_text.replace(/\f/g, ' ').replace(/\n/g, ' ') || 'No entry available.';
	}

	async function handlePlayEntry() {
		if (isPlaying) return;

		isPlaying = true;
		try {
			const entry = getPokedexEntry();
			await speakPokedexEntry(entry);
		} catch (error) {
			console.error('Error playing audio:', error);
			alert('Failed to play audio. Please check your API key.');
		} finally {
			isPlaying = false;
		}
	}
</script>

<svelte:head>
	<title>{formatPokemonName(pokemon.name)} - Pokédex</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
	<link
		href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="pokedex-device">
	<div class="device-top">
		<div class="light-indicator">
			<div class="light blue"></div>
			<div class="light-row">
				<div class="light red"></div>
				<div class="light yellow"></div>
				<div class="light green"></div>
			</div>
		</div>
	</div>

	<div class="device-body">
		<div class="screen-container">
			<div class="screen-bezel">
				<div class="screen">
					<a href="/" class="back-link">◄ BACK</a>

					<div class="entry-header">
						<div class="entry-number">NO. {pokemon.id.toString().padStart(3, '0')}</div>
						<h1 class="entry-title">{formatPokemonName(pokemon.name).toUpperCase()}</h1>
					</div>

					<div class="pokedex-entry">
						<div class="entry-text">{getPokedexEntry()}</div>
						<button class="voice-button" on:click={handlePlayEntry} disabled={isPlaying}>
							{isPlaying ? '🔊 PLAYING...' : '🔊 HEAR ENTRY'}
						</button>
					</div>

					<div class="main-display">
						<div class="sprite-display">
							<img
								src={pokemon.sprites.versions?.['generation-v']?.['black-white']?.animated?.front_default || pokemon.sprites.front_default}
								alt={pokemon.name}
								class="main-sprite"
							/>
						</div>

						<div class="info-panel">
							<div class="info-section">
								<div class="info-label">TYPE:</div>
								<div class="type-list">
									{#each pokemon.types as typeInfo}
										<span
											class="type-chip"
											style="background-color: {getTypeColor(typeInfo.type.name)}"
										>
											{typeInfo.type.name.toUpperCase()}
										</span>
									{/each}
								</div>
							</div>

							<div class="info-section">
								<div class="info-label">HT: {(pokemon.height / 10).toFixed(1)}m</div>
								<div class="info-label">WT: {(pokemon.weight / 10).toFixed(1)}kg</div>
							</div>
						</div>
					</div>

					<div class="stats-display">
						<div class="section-title">BASE STATS</div>
						<div class="stats-grid">
							{#each pokemon.stats as statInfo}
								<div class="stat-row">
									<div class="stat-label">
										{statInfo.stat.name.replace('-', ' ').toUpperCase().substring(0, 10)}
									</div>
									<div class="stat-bar-bg">
										<div
											class="stat-bar"
											style="width: {Math.min((statInfo.base_stat / 255) * 100, 100)}%"
										></div>
									</div>
									<div class="stat-value">{statInfo.base_stat}</div>
								</div>
							{/each}
						</div>
					</div>

					{#if locations.length > 0}
						<div class="locations-display">
							<div class="section-title">HABITAT</div>
							<div class="location-grid">
								{#each locations.slice(0, 6) as location}
									<div class="location-chip">
										{formatLocationName(location.location_area.name).toUpperCase()}
									</div>
								{/each}
							</div>
						</div>
					{/if}

					<div class="sprites-display">
						<div class="section-title">FORMS</div>
						<div class="sprite-grid">
							<div class="sprite-box">
								<img
									src={pokemon.sprites.versions?.['generation-v']?.['black-white']?.animated
										?.front_default || pokemon.sprites.front_default}
									alt="Front"
								/>
								<div class="sprite-label">FRONT</div>
							</div>
							<div class="sprite-box">
								<img
									src={pokemon.sprites.versions?.['generation-v']?.['black-white']?.animated
										?.front_shiny || pokemon.sprites.front_shiny}
									alt="Shiny"
								/>
								<div class="sprite-label">SHINY</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	:global(body) {
		background: #1a1a2e;
		min-height: 100vh;
		margin: 0;
		font-family: 'Press Start 2P', cursive;
		display: flex;
		justify-content: center;
		align-items: flex-start;
		padding: 2rem;
	}

	.pokedex-device {
		max-width: 900px;
		width: 100%;
		background: #cc0000;
		border-radius: 20px 20px 0 0;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
		border: 8px solid #8b0000;
	}

	.device-top {
		padding: 1.5rem 2rem;
		background: linear-gradient(180deg, #cc0000 0%, #aa0000 100%);
		border-radius: 12px 12px 0 0;
		border-bottom: 4px solid #8b0000;
	}

	.light-indicator {
		display: flex;
		align-items: center;
		gap: 1.5rem;
	}

	.light {
		width: 50px;
		height: 50px;
		border-radius: 50%;
		border: 4px solid rgba(0, 0, 0, 0.3);
		box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3), 0 0 20px rgba(255, 255, 255, 0.2);
	}

	.light.blue {
		background: radial-gradient(circle at 30% 30%, #4dd0e1, #0277bd);
		animation: pulse-blue 2s infinite;
	}

	.light.red {
		background: radial-gradient(circle at 30% 30%, #ff5252, #c62828);
		width: 20px;
		height: 20px;
	}

	.light.yellow {
		background: radial-gradient(circle at 30% 30%, #ffeb3b, #f9a825);
		width: 20px;
		height: 20px;
	}

	.light.green {
		background: radial-gradient(circle at 30% 30%, #66bb6a, #2e7d32);
		width: 20px;
		height: 20px;
	}

	.light-row {
		display: flex;
		gap: 0.5rem;
	}

	@keyframes pulse-blue {
		0%,
		100% {
			box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3), 0 0 20px rgba(77, 208, 225, 0.5);
		}
		50% {
			box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3), 0 0 30px rgba(77, 208, 225, 0.8);
		}
	}

	.device-body {
		background: #cc0000;
		padding: 2rem;
		border-radius: 0 0 20px 20px;
	}

	.screen-container {
		background: #2d2d2d;
		padding: 1.5rem;
		border-radius: 12px;
		box-shadow: inset 0 4px 12px rgba(0, 0, 0, 0.6);
	}

	.screen-bezel {
		background: linear-gradient(145deg, #3a3a3a, #1a1a1a);
		padding: 1rem;
		border-radius: 8px;
		border: 3px solid #0a0a0a;
	}

	.screen {
		background: linear-gradient(180deg, #9fdfcd 0%, #7ac5b3 100%);
		padding: 2rem;
		border-radius: 4px;
		min-height: 70vh;
		box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.2);
	}

	.back-link {
		display: inline-block;
		font-size: 0.6rem;
		color: #1a1a1a;
		text-decoration: none;
		margin-bottom: 1.5rem;
		padding: 0.5rem 1rem;
		background: rgba(0, 0, 0, 0.15);
		border: 2px solid rgba(0, 0, 0, 0.3);
		border-radius: 4px;
		transition: all 0.2s;
	}

	.back-link:hover {
		background: rgba(255, 255, 255, 0.3);
	}

	.entry-header {
		text-align: center;
		margin-bottom: 2rem;
		padding-bottom: 1rem;
		border-bottom: 3px solid rgba(0, 0, 0, 0.3);
	}

	.entry-number {
		font-size: 0.7rem;
		color: #2d2d2d;
		margin-bottom: 0.8rem;
		letter-spacing: 0.2rem;
	}

	.entry-title {
		font-size: 1.5rem;
		color: #1a1a1a;
		margin: 0;
		text-shadow: 2px 2px 0 rgba(255, 255, 255, 0.3);
		letter-spacing: 0.1rem;
	}

	.pokedex-entry {
		background: rgba(0, 0, 0, 0.15);
		border: 3px solid rgba(0, 0, 0, 0.3);
		border-radius: 8px;
		padding: 1.5rem;
		margin-bottom: 2rem;
	}

	.entry-text {
		font-size: 0.55rem;
		color: #1a1a1a;
		line-height: 1.8;
		margin-bottom: 1rem;
		letter-spacing: 0.05rem;
	}

	.voice-button {
		width: 100%;
		background: linear-gradient(180deg, #1a1a1a 0%, #2d2d2d 100%);
		color: #9fdfcd;
		border: 3px solid rgba(0, 0, 0, 0.5);
		border-radius: 8px;
		padding: 1rem;
		font-family: 'Press Start 2P', cursive;
		font-size: 0.6rem;
		cursor: pointer;
		letter-spacing: 0.1rem;
		transition: all 0.2s;
	}

	.voice-button:hover:not(:disabled) {
		background: linear-gradient(180deg, #2d2d2d 0%, #1a1a1a 100%);
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
	}

	.voice-button:active:not(:disabled) {
		transform: translateY(0);
	}

	.voice-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.main-display {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
		margin-bottom: 2rem;
	}

	.sprite-display {
		background: rgba(0, 0, 0, 0.15);
		border: 3px solid rgba(0, 0, 0, 0.3);
		border-radius: 8px;
		padding: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.main-sprite {
		width: 160px;
		height: 160px;
		image-rendering: pixelated;
	}

	.info-panel {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.info-section {
		background: rgba(0, 0, 0, 0.15);
		border: 3px solid rgba(0, 0, 0, 0.3);
		border-radius: 8px;
		padding: 1rem;
	}

	.info-label {
		font-size: 0.6rem;
		color: #1a1a1a;
		margin-bottom: 0.5rem;
		letter-spacing: 0.1rem;
	}

	.type-list {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.type-chip {
		padding: 0.4rem 0.8rem;
		border-radius: 4px;
		font-size: 0.5rem;
		color: white;
		letter-spacing: 0.05rem;
		border: 2px solid rgba(0, 0, 0, 0.3);
	}

	.section-title {
		font-size: 0.8rem;
		color: #1a1a1a;
		margin-bottom: 1rem;
		letter-spacing: 0.1rem;
		padding: 0.8rem;
		background: rgba(0, 0, 0, 0.15);
		border: 3px solid rgba(0, 0, 0, 0.3);
		border-radius: 4px;
	}

	.stats-display {
		margin-bottom: 2rem;
	}

	.stats-grid {
		display: flex;
		flex-direction: column;
		gap: 0.8rem;
	}

	.stat-row {
		display: grid;
		grid-template-columns: 120px 1fr 60px;
		align-items: center;
		gap: 1rem;
		background: rgba(0, 0, 0, 0.15);
		padding: 0.6rem;
		border: 2px solid rgba(0, 0, 0, 0.3);
		border-radius: 4px;
	}

	.stat-label {
		font-size: 0.5rem;
		color: #1a1a1a;
		letter-spacing: 0.05rem;
	}

	.stat-bar-bg {
		background: rgba(0, 0, 0, 0.3);
		height: 16px;
		border-radius: 3px;
		overflow: hidden;
		border: 2px solid rgba(0, 0, 0, 0.2);
	}

	.stat-bar {
		height: 100%;
		background: linear-gradient(90deg, #1a1a1a 0%, #2d2d2d 100%);
		transition: width 0.3s ease;
	}

	.stat-value {
		font-size: 0.6rem;
		color: #1a1a1a;
		text-align: right;
		letter-spacing: 0.1rem;
	}

	.locations-display {
		margin-bottom: 2rem;
	}

	.location-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 0.8rem;
	}

	.location-chip {
		background: rgba(0, 0, 0, 0.15);
		border: 2px solid rgba(0, 0, 0, 0.3);
		border-radius: 4px;
		padding: 0.6rem;
		font-size: 0.45rem;
		color: #1a1a1a;
		text-align: center;
		letter-spacing: 0.05rem;
		line-height: 1.4;
	}

	.sprites-display {
		margin-bottom: 1rem;
	}

	.sprite-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
	}

	.sprite-box {
		background: rgba(0, 0, 0, 0.15);
		border: 3px solid rgba(0, 0, 0, 0.3);
		border-radius: 8px;
		padding: 1rem;
		text-align: center;
	}

	.sprite-box img {
		width: 96px;
		height: 96px;
		image-rendering: pixelated;
	}

	.sprite-label {
		font-size: 0.5rem;
		color: #2d2d2d;
		margin-top: 0.5rem;
		letter-spacing: 0.1rem;
	}

	@media (max-width: 768px) {
		.entry-title {
			font-size: 1rem;
		}

		.main-display {
			grid-template-columns: 1fr;
		}

		.main-sprite {
			width: 120px;
			height: 120px;
		}

		.stat-row {
			grid-template-columns: 80px 1fr 50px;
			gap: 0.5rem;
		}

		.location-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
