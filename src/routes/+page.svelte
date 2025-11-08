<script lang="ts">
	import { formatPokemonName, getTypeColor, fetchPokemonSpecies } from '$lib/api/pokeapi';
	import { speakPokedexEntry } from '$lib/tts/elevenlabs';
	import type { PageData } from './$types';
	import type { PokemonSpecies } from '$lib/api/pokeapi';

	export let data: PageData;

	let currentIndex = 0;
	let isPlaying = false;
	let showEntry = false;
	let showShiny = false;
	let speciesCache: Map<number, PokemonSpecies> = new Map();
	let currentSpecies: PokemonSpecies | null = null;

	$: currentPokemon = data.pokemon[currentIndex];
	const gridSquares = Array.from({ length: 10 });

	// Play Pokemon cry sound (browser only)
	function playCry(cryUrl: string) {
		if (typeof Audio !== 'undefined') {
			const audio = new Audio(cryUrl);
			audio.volume = 0.5;
			audio.play().catch(err => console.error('Error playing cry:', err));
		}
	}

	// Watch for Pokemon changes and play cry + preload species data
	$: if (currentPokemon && typeof window !== 'undefined') {
		playCry(currentPokemon.cries.legacy); // Using legacy for classic 90s sound
		loadSpeciesData(); // Preload species data in background
	}

	function nextPokemon() {
		currentIndex = (currentIndex + 1) % data.pokemon.length;
		showEntry = false; // Reset to sprite view when navigating
		showShiny = false; // Reset to normal sprite
	}

	function previousPokemon() {
		currentIndex = (currentIndex - 1 + data.pokemon.length) % data.pokemon.length;
		showEntry = false; // Reset to sprite view when navigating
		showShiny = false; // Reset to normal sprite
	}

	function toggleShiny() {
		if (!showEntry) {
			showShiny = !showShiny;
		}
	}

	// Fetch species data when needed
	async function loadSpeciesData() {
		if (!speciesCache.has(currentPokemon.id)) {
			try {
				const species = await fetchPokemonSpecies(currentPokemon.id);
				speciesCache.set(currentPokemon.id, species);
				speciesCache = speciesCache; // Trigger reactivity
			} catch (error) {
				console.error('Error fetching species data:', error);
			}
		}
		currentSpecies = speciesCache.get(currentPokemon.id) || null;
	}

	async function toggleEntryView() {
		showEntry = !showEntry;

		// Autoplay when entering entry view
		if (showEntry && !isPlaying) {
			await loadSpeciesData();
			if (currentSpecies) {
				isPlaying = true;
				try {
					const entry = getPokedexEntry();
					await speakPokedexEntry(entry);
				} catch (error) {
					console.error('Error playing audio:', error);
				} finally {
					isPlaying = false;
				}
			}
		}
	}

	// Get the first English Pokedex entry (preferably from Red/Blue for 90s nostalgia)
	function getPokedexEntry(): string {
		if (!currentSpecies) return 'Loading...';

		const englishEntries = currentSpecies.flavor_text_entries.filter(
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
</script>

<svelte:head>
	<title>Pokédex</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
	<link
		href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="pokedex">
	<section class="panel left-panel">
		<div class="left-top">
			<div class="lens">
				<div class="lens-core">
					<div class="lens-highlight"></div>
				</div>
			</div>
			<div class="indicator-strip">
				<span class="indicator red"></span>
				<span class="indicator yellow"></span>
				<span class="indicator green"></span>
			</div>
		</div>

		<div class="screen-housing">
			<div class="screen-frame">
				<div class="screen-bezel">
					<div class="screen-display">
						{#if showEntry}
							<div class="entry-view">
								<div class="entry-view-text">{getPokedexEntry()}</div>
							</div>
						{:else}
							<img
								src={showShiny
									? (currentPokemon.sprites.versions?.['generation-v']?.['black-white']?.animated?.front_shiny || currentPokemon.sprites.front_shiny)
									: (currentPokemon.sprites.versions?.['generation-v']?.['black-white']?.animated?.front_default || currentPokemon.sprites.front_default)}
								alt={currentPokemon.name}
							/>
						{/if}
					</div>
				</div>
			</div>
			<div class="screen-status">
				<span class="status-light red"></span>
				<span class="status-light teal"></span>
				<span class="status-bar"></span>
			</div>
		</div>

		<div class="left-controls">
			<div class="control-stack">
				<div class="speaker-slot"></div>
				<div class="green-pad"></div>
			</div>

			<div class="dpad" role="group" aria-label="Pokédex navigation">
				<button
					class="direction direction-up"
					aria-label="Toggle shiny"
					on:click={toggleShiny}
				></button>
				<button
					class="direction direction-right"
					aria-label="Next Pokémon"
					on:click={nextPokemon}
				></button>
				<button
					class="direction direction-down"
					aria-label="Toggle shiny"
					on:click={toggleShiny}
				></button>
				<button
					class="direction direction-left"
					aria-label="Previous Pokémon"
					on:click={previousPokemon}
				></button>
				<button class="direction-center" aria-label="Toggle entry" on:click={toggleEntryView}></button>
			</div>
		</div>
	</section>

	<div class="hinge"></div>

	<section class="panel right-panel">
		<div class="upper-display">
			<div class="upper-frame">
				<div class="upper-screen">
					<div class="info-stack">
						<div class="info-row">
							<span class="info-label">NO.</span>
							<span class="info-value">{currentPokemon.id.toString().padStart(3, '0')}</span>
						</div>
						<div class="info-row name">
							<span class="pokemon-name">{formatPokemonName(currentPokemon.name)}</span>
						</div>
						<div class="info-row">
							<span class="info-label">TYPE</span>
							<div class="types">
								{#each currentPokemon.types as typeInfo}
									<span
										class="type-badge"
										style="background-color: {getTypeColor(typeInfo.type.name)}"
									>
										{typeInfo.type.name.toUpperCase()}
									</span>
								{/each}
							</div>
						</div>
						<div class="info-row stats">
							<span class="info-label">HT</span>
							<span class="info-value">{(currentPokemon.height / 10).toFixed(1)}m</span>
							<span class="info-label">WT</span>
							<span class="info-value">{(currentPokemon.weight / 10).toFixed(1)}kg</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="keypad" aria-hidden="true">
			{#each gridSquares as _}
				<span class="keypad-cell"></span>
			{/each}
		</div>

		<div class="right-control-cluster">
			<div class="white-pills" aria-hidden="true">
				<span class="white-pill"></span>
				<span class="white-pill"></span>
			</div>
			<div class="lower-controls" aria-hidden="true">
				<span class="red-slot"></span>
				<span class="red-slot"></span>
			</div>
		</div>
	</section>
</div>

<style>
	:global(body) {
		background: linear-gradient(135deg, #0e0d17 0%, #1c1b2d 100%);
		min-height: 100vh;
		margin: 0;
		font-family: 'Orbitron', sans-serif;
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 2rem;
		color: #f5f5f5;
	}

	button {
		font-family: inherit;
	}

	.pokedex {
		display: grid;
		grid-template-columns: 450px 28px 450px;
		align-items: stretch;
		max-width: 960px;
		width: 100%;
		gap: 0.5rem;
		height: 660px;
	}

	.panel {
		background: linear-gradient(180deg, #e01025 0%, #bf001b 100%);
		border: 4px solid #7a0612;
		box-shadow: inset 0 2px 6px rgba(255, 255, 255, 0.15), 0 20px 40px rgba(0, 0, 0, 0.4);
		padding: 2.5rem 2.25rem;
		position: relative;
		display: flex;
		flex-direction: column;
		height: 100%;
		width: 450px;
		min-width: 450px;
		max-width: 450px;
	}

	.left-panel {
		border-radius: 28px 0 0 28px;
		padding-top: 3.2rem;
		gap: 2rem;
	}

	.left-panel::before {
		content: '';
		position: absolute;
		top: 0.7rem;
		left: 50%;
		width: 36%;
		height: 1.2rem;
		background: linear-gradient(180deg, #f4283c 0%, #d0162c 100%);
		border: 4px solid #7a0612;
		border-left: none;
		border-radius: 0 18px 18px 0;
		transform: translateX(-60%);
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.25);
	}

	.left-top {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		margin-bottom: 2.2rem;
	}

	.lens {
		width: 86px;
		height: 86px;
		border-radius: 50%;
		background: linear-gradient(180deg, #ff3c4d 0%, #cc1a2b 100%);
		border: 5px solid #7a0612;
		display: grid;
		place-items: center;
		position: relative;
	}

	.lens-core {
		width: 70px;
		height: 70px;
		border-radius: 50%;
		background: radial-gradient(circle at 30% 30%, #7ceaff, #1a9ed9 55%, #015d8c);
		border: 6px solid #f1f7ff;
		position: relative;
		box-shadow: inset 0 6px 14px rgba(0, 0, 0, 0.4), 0 0 28px rgba(124, 234, 255, 0.5);
	}

	.lens-highlight {
		position: absolute;
		top: 12px;
		left: 14px;
		width: 22px;
		height: 22px;
		background: rgba(255, 255, 255, 0.8);
		border-radius: 50%;
	}

	.indicator-strip {
		display: flex;
		gap: 0.75rem;
		padding: 0.35rem 1.1rem;
		background: linear-gradient(180deg, #f4283c 0%, #d0162c 100%);
		border: 4px solid #7a0612;
		border-radius: 999px;
		box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.25);
	}

	.indicator {
		width: 18px;
		height: 18px;
		border-radius: 50%;
		border: 3px solid rgba(255, 255, 255, 0.65);
		box-shadow: inset 0 3px 5px rgba(0, 0, 0, 0.45);
	}

	.indicator.red {
		background: radial-gradient(circle at 35% 35%, #ff7b7b, #c91822 70%, #63060c);
	}

	.indicator.yellow {
		background: radial-gradient(circle at 35% 35%, #ffe27a, #efb214 75%, #7f4e00);
	}

	.indicator.green {
		background: radial-gradient(circle at 35% 35%, #8cf7a7, #2e983d 70%, #0c4216);
	}

	.screen-housing {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		flex: 1;
		justify-content: space-between;
	}

	.screen-frame {
		background: linear-gradient(180deg, #f03a4d 0%, #be1a2d 100%);
		border-radius: 18px;
		padding: 1.4rem;
		border: 4px solid #65030e;
		box-shadow: inset 0 4px 8px rgba(255, 255, 255, 0.2), inset 0 -3px 6px rgba(0, 0, 0, 0.4);
		display: flex;
		flex: 1;
	}

	.screen-bezel {
		background: #ffffff;
		border-radius: 14px;
		padding: 1.2rem;
		border: 4px solid #c7c7c7;
		box-shadow: inset 0 3px 4px rgba(0, 0, 0, 0.25);
		display: flex;
		flex: 1;
		align-items: center;
		justify-content: center;
	}

	.screen-display {
		background: radial-gradient(circle at 50% 45%, #2e2e33 0%, #0b0c0d 70%);
		border: 5px solid #161616;
		border-radius: 10px;
		min-height: 220px;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		max-width: 100%;
	}

	.screen-display img {
		width: 180px;
		height: 180px;
		image-rendering: pixelated;
		filter: drop-shadow(0 8px 12px rgba(0, 0, 0, 0.45));
	}

	.screen-status {
		display: flex;
		align-items: center;
		gap: 0.9rem;
		padding: 0 0.5rem;
	}

	.status-light {
		width: 18px;
		height: 18px;
		border-radius: 50%;
		border: 3px solid #272727;
		box-shadow: inset 0 3px 5px rgba(0, 0, 0, 0.5);
	}

	.status-light.red {
		background: radial-gradient(circle at 35% 35%, #ff8585, #c0161c 75%, #520306);
	}

	.status-light.teal {
		background: radial-gradient(circle at 35% 35%, #7bf1ff, #1c7997 75%, #052c3c);
	}

	.status-bar {
		flex: 1;
		height: 8px;
		background: #231116;
		border-radius: 999px;
		box-shadow: inset 0 3px 4px rgba(0, 0, 0, 0.6);
	}

	.left-controls {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 2.4rem;
		margin-top: auto;
	}

	.control-stack {
		display: flex;
		flex-direction: column;
		gap: 1.2rem;
	}

	.speaker-slot {
		width: 110px;
		height: 10px;
		background: #111;
		border-radius: 8px;
		box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.6);
	}

	.green-pad {
		width: 120px;
		height: 70px;
		background: linear-gradient(180deg, #89dd4b 0%, #38a21c 90%);
		border-radius: 12px;
		border: 4px solid #1f5c16;
		box-shadow: inset 0 3px 6px rgba(255, 255, 255, 0.3), 0 6px 0 #1f4510;
	}

	.dpad {
		position: relative;
		display: grid;
		grid-template-areas:
			'. up .'
			'left center right'
			'. down .';
		gap: 3px;
		width: 126px;
		height: 126px;
		padding: 6px;
		background: linear-gradient(180deg, #1a3824 0%, #0f1f14 100%);
		border-radius: 16px;
		border: 4px solid #06110a;
		box-shadow: inset 0 4px 8px rgba(0, 0, 0, 0.6);
	}

	.direction {
		background: linear-gradient(180deg, #0f5a3d 0%, #073826 90%);
		border: 3px solid #031d12;
		border-radius: 14px;
		cursor: pointer;
		box-shadow: inset 0 3px 6px rgba(255, 255, 255, 0.1), 0 4px 0 #020f0a;
		transition: transform 0.08s ease, box-shadow 0.08s ease;
	}

	.direction:active {
		transform: translateY(2px);
		box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.6);
	}

	.direction-up {
		grid-area: up;
		border-radius: 12px 12px 4px 4px;
	}

	.direction-right {
		grid-area: right;
		border-radius: 4px 12px 12px 4px;
	}

	.direction-down {
		grid-area: down;
		border-radius: 4px 4px 12px 12px;
	}

	.direction-left {
		grid-area: left;
		border-radius: 12px 4px 4px 12px;
	}

	.direction-center {
		grid-area: center;
		border-radius: 50%;
		background: radial-gradient(circle at 30% 30%, #5ad4a0, #0f3b2b 70%);
		border: 4px solid #031d12;
		box-shadow: inset 0 4px 6px rgba(0, 0, 0, 0.6);
		cursor: pointer;
		transition: transform 0.08s ease, box-shadow 0.08s ease;
	}

	.direction-center:active {
		transform: scale(0.95);
		box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.8);
	}

	.entry-view {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
	}

	.entry-view-text {
		color: #00ff00;
		font-size: 0.6rem;
		line-height: 1.8;
		letter-spacing: 0.05rem;
		text-shadow: 0 0 8px rgba(0, 255, 0, 0.6);
		text-align: center;
		font-weight: 500;
	}

	.hinge {
		width: 28px;
		border-radius: 18px;
		background: linear-gradient(180deg, #7b1a1e 0%, #4d0a0f 100%);
		border: 4px solid #42050a;
		box-shadow: inset 0 2px 6px rgba(255, 255, 255, 0.2), inset 0 -3px 6px rgba(0, 0, 0, 0.5);
		position: relative;
		height: 100%;
	}

	.hinge::before,
	.hinge::after {
		content: '';
		position: absolute;
		left: 50%;
		transform: translateX(-50%);
		width: 10px;
		height: 10px;
		background: #29252c;
		border-radius: 50%;
		box-shadow: inset 0 2px 3px rgba(0, 0, 0, 0.8);
	}

	.hinge::before {
		top: 20%;
	}

	.hinge::after {
		bottom: 20%;
	}

	.right-panel {
		border-radius: 0 28px 28px 0;
		display: flex;
		flex-direction: column;
		gap: 2.2rem;
		padding-top: 3rem;
		justify-content: space-between;
	}

	.upper-display {
		background: linear-gradient(180deg, #ed2336 0%, #c80f26 100%);
		border-radius: 20px;
		border: 4px solid #65030e;
		box-shadow: inset 0 4px 6px rgba(255, 255, 255, 0.25), inset 0 -3px 6px rgba(0, 0, 0, 0.38);
		padding: 1.4rem;
		display: flex;
		flex-direction: column;
		flex: 1;
	}

	.upper-frame {
		background: #201820;
		border-radius: 16px;
		padding: 1.2rem;
		border: 4px solid #3b0d14;
		box-shadow: inset 0 4px 8px rgba(0, 0, 0, 0.6);
		flex: 1;
		display: flex;
	}

	.upper-screen {
		background: linear-gradient(180deg, #1a1a1f 0%, #050506 100%);
		border-radius: 12px;
		border: 4px solid #030303;
		min-height: 200px;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.2rem;
		color: #8ce7ff;
		text-shadow: 0 0 6px rgba(140, 231, 255, 0.4);
		flex: 1;
	}

	.info-stack {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		width: 100%;
	}

	.info-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.7rem;
		letter-spacing: 0.05rem;
	}

	.info-row.name {
		justify-content: center;
	}

	.info-row.stats {
		gap: 0.5rem;
		flex-wrap: nowrap;
		justify-content: space-between;
		width: 100%;
		margin: 0;
	}

	.info-row.stats span {
		white-space: nowrap;
	}

	.info-row.stats .info-value {
		display: inline-block;
		text-align: left;
	}

	.info-row.stats .info-label {
		display: inline-block;
	}

	.pokemon-name {
		font-size: 1.1rem;
		font-weight: 800;
	}

	.info-label {
		text-transform: uppercase;
		font-weight: 600;
	}

	.types {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.type-badge {
		padding: 0.25rem 0.7rem;
		border-radius: 999px;
		font-size: 0.6rem;
		color: #fff;
		border: 2px solid rgba(0, 0, 0, 0.35);
		box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.25);
		font-weight: 700;
	}

	.keypad {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 0;
		align-self: center;
		width: 100%;
		max-width: 100%;
		margin-top: auto;
	}

	.keypad-cell {
		aspect-ratio: 1;
		background: linear-gradient(180deg, #63bfff 0%, #1c5fbf 95%);
		border: 3px solid #0f2c6d;
		border-radius: 0;
		box-shadow: inset 0 3px 5px rgba(255, 255, 255, 0.25), 0 4px 0 #0c2050;
	}

	.right-control-cluster {
		display: flex;
		flex-direction: column;
		gap: 1.6rem;
		align-items: center;
		margin-top: auto;
	}

	.white-pills {
		display: flex;
		gap: 0;
		align-self: flex-start;
	}

	.white-pill {
		width: 70px;
		height: 32px;
		background: linear-gradient(180deg, #f7f7f7 0%, #d9d9d9 95%);
		border-radius: 0;
		border: 3px solid #9f9f9f;
		box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.5), 0 4px 0 #6f6f6f;
	}

	.lower-controls {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
	}

	.green-bar {
		display: block;
		background: linear-gradient(180deg, #2e8b57 0%, #0d4a2f 95%);
		border: 3px solid #042517;
		border-radius: 12px;
		box-shadow: inset 0 3px 4px rgba(255, 255, 255, 0.25), 0 4px 0 #02160e;
	}

	.green-bar.large {
		width: 110px;
		height: 32px;
	}

	.green-bar.small {
		width: 70px;
		height: 22px;
	}

	.red-slot {
		display: block;
		width: 160px;
		height: 32px;
		background: linear-gradient(180deg, #7f0a10 0%, #3d0406 100%);
		border-radius: 12px;
		border: 3px solid #300003;
		box-shadow: inset 0 3px 4px rgba(0, 0, 0, 0.6);
	}

	@media (max-width: 1024px) {
		.pokedex {
			max-width: 880px;
			gap: 0.25rem;
			grid-template-columns: 400px 28px 400px;
		}

		.panel {
			padding: 2.2rem 2rem;
			width: 400px;
			min-width: 400px;
			max-width: 400px;
		}

		.left-controls {
			gap: 1.6rem;
		}

		.keypad {
			max-width: 320px;
		}
	}

	@media (max-width: 860px) {
		.pokedex {
			grid-template-columns: 1fr;
			max-width: 540px;
			height: auto;
		}

		.panel {
			height: auto;
		}

		.left-panel {
			border-radius: 28px 28px 0 0;
		}

		.right-panel {
			border-radius: 0 0 28px 28px;
		}

		.hinge {
			display: none;
		}

		.panel {
			padding: 2.4rem 2.1rem;
		}

		.info-row {
			justify-content: center;
		}
	}

	@media (max-width: 560px) {
		:global(body) {
			padding: 1.2rem;
		}

		.panel {
			padding: 2rem 1.6rem;
		}

		.left-controls {
			flex-direction: column;
			align-items: center;
		}

		.control-stack {
			align-items: center;
		}

		.info-row.stats {
			flex-wrap: wrap;
			gap: 1rem;
			width: 100%;
		}

		.info-row.stats span {
			white-space: normal;
		}

		.info-row.stats .info-value {
			min-width: 0;
			text-align: center;
		}

		.upper-screen {
			padding: 1.2rem;
		}

		.keypad {
			grid-template-columns: repeat(4, 1fr);
		}
	}
</style>
