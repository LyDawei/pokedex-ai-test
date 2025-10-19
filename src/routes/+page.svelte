<script lang="ts">
	import { formatPokemonName, getTypeColor } from '$lib/api/pokeapi';
	import type { PageData } from './$types';

	export let data: PageData;

	let currentIndex = 0;
	$: currentPokemon = data.pokemon[currentIndex];

	function nextPokemon() {
		currentIndex = (currentIndex + 1) % data.pokemon.length;
	}

	function previousPokemon() {
		currentIndex = (currentIndex - 1 + data.pokemon.length) % data.pokemon.length;
	}
</script>

<svelte:head>
	<title>Pokédex</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
	<link
		href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="pokedex-open">
	<!-- Left Panel -->
	<div class="left-panel">
		<!-- Top corner with light -->
		<div class="corner-light-section">
			<div class="big-light">
				<div class="light-shine"></div>
			</div>
			<div class="small-lights">
				<div class="small-light red"></div>
				<div class="small-light yellow"></div>
				<div class="small-light green"></div>
			</div>
		</div>

		<!-- Main Screen -->
		<div class="main-screen-section">
			<div class="screen-frame">
				<div class="screen">
					<div class="pokemon-display">
						<img
							src={currentPokemon.sprites.versions?.['generation-v']?.['black-white']?.animated
								?.front_default || currentPokemon.sprites.front_default}
							alt={currentPokemon.name}
							class="pokemon-sprite"
						/>
					</div>
				</div>
			</div>
		</div>

		<!-- Controls under screen -->
		<div class="left-controls">
			<div class="control-row">
				<div class="red-dot"></div>
				<div class="red-dot"></div>
			</div>
			<div class="green-screen"></div>
		</div>
	</div>

	<!-- Center Hinge -->
	<div class="hinge"></div>

	<!-- Right Panel -->
	<div class="right-panel">
		<!-- Info Screen at top -->
		<div class="info-screen-section">
			<div class="info-screen">
				<div class="pokemon-info">
					<div class="info-line">
						<span class="label">NO.</span>
						<span class="value">{currentPokemon.id.toString().padStart(3, '0')}</span>
					</div>
					<div class="info-line name-line">
						<span class="pokemon-name">{formatPokemonName(currentPokemon.name)}</span>
					</div>
					<div class="info-line">
						<span class="label">TYPE</span>
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
					<div class="info-line">
						<span class="label">HT</span>
						<span class="value">{(currentPokemon.height / 10).toFixed(1)}m</span>
					</div>
					<div class="info-line">
						<span class="label">WT</span>
						<span class="value">{(currentPokemon.weight / 10).toFixed(1)}kg</span>
					</div>
				</div>
			</div>
		</div>

		<!-- Blue Button Grid -->
		<div class="blue-grid-section">
			<div class="blue-button-grid">
				<div class="blue-btn"></div>
				<div class="blue-btn"></div>
				<div class="blue-btn"></div>
				<div class="blue-btn"></div>
				<div class="blue-btn"></div>
				<div class="blue-btn"></div>
				<div class="blue-btn"></div>
				<div class="blue-btn"></div>
				<div class="blue-btn"></div>
				<div class="blue-btn"></div>
			</div>
		</div>

		<!-- Bottom Controls -->
		<div class="right-controls">
			<!-- D-Pad and Buttons Row -->
			<div class="controls-row">
				<!-- Cross/D-pad -->
				<div class="cross-section">
					<div class="cross">
						<button class="cross-btn cross-up" on:click={previousPokemon}>▲</button>
						<button class="cross-btn cross-right">▶</button>
						<button class="cross-btn cross-down" on:click={nextPokemon}>▼</button>
						<button class="cross-btn cross-left">◀</button>
						<div class="cross-center"></div>
					</div>
				</div>

				<!-- White buttons -->
				<div class="white-buttons">
					<div class="white-btn"></div>
					<div class="white-btn"></div>
				</div>
			</div>

			<!-- Yellow Circle -->
			<div class="yellow-circle-section">
				<div class="yellow-circle"></div>
			</div>
		</div>
	</div>
</div>

<style>
	:global(body) {
		background: linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 100%);
		min-height: 100vh;
		margin: 0;
		font-family: 'Press Start 2P', cursive;
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 2rem;
	}

	.pokedex-open {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		max-width: 900px;
		width: 100%;
		gap: 0;
		perspective: 1000px;
	}

	/* LEFT PANEL */
	.left-panel {
		background: linear-gradient(180deg, #dc0a2d 0%, #c40a2a 100%);
		border: 4px solid #8b0000;
		border-right: 2px solid #8b0000;
		border-radius: 20px 0 0 20px;
		padding: 2rem;
		box-shadow: -10px 0 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1);
		transform: rotateY(-2deg);
	}

	.corner-light-section {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.big-light {
		width: 70px;
		height: 70px;
		border-radius: 50%;
		background: radial-gradient(circle at 30% 30%, #5de8ff, #00bcd4, #0097a7);
		border: 5px solid white;
		position: relative;
		box-shadow: 0 0 30px rgba(93, 232, 255, 0.8), inset 0 3px 8px rgba(0, 0, 0, 0.3);
		animation: pulse 2s infinite;
	}

	.light-shine {
		position: absolute;
		top: 12px;
		left: 12px;
		width: 25px;
		height: 25px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.9);
	}

	@keyframes pulse {
		0%,
		100% {
			box-shadow: 0 0 30px rgba(93, 232, 255, 0.8), inset 0 3px 8px rgba(0, 0, 0, 0.3);
		}
		50% {
			box-shadow: 0 0 50px rgba(93, 232, 255, 1), inset 0 3px 8px rgba(0, 0, 0, 0.3);
		}
	}

	.small-lights {
		display: flex;
		gap: 0.6rem;
	}

	.small-light {
		width: 18px;
		height: 18px;
		border-radius: 50%;
		border: 3px solid white;
		box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.4);
	}

	.small-light.red {
		background: radial-gradient(circle at 30% 30%, #ff6b6b, #e53935);
	}

	.small-light.yellow {
		background: radial-gradient(circle at 30% 30%, #ffd54f, #fbc02d);
	}

	.small-light.green {
		background: radial-gradient(circle at 30% 30%, #66bb6a, #43a047);
	}

	.main-screen-section {
		margin-bottom: 1.5rem;
	}

	.screen-frame {
		background: #1a1a1a;
		padding: 1.2rem;
		border-radius: 12px;
		box-shadow: inset 0 6px 12px rgba(0, 0, 0, 0.7);
	}

	.screen {
		background: linear-gradient(180deg, #b8e6d5 0%, #95d5b2 100%);
		border: 4px solid #0a0a0a;
		border-radius: 6px;
		padding: 2rem;
		min-height: 250px;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: inset 0 0 30px rgba(0, 0, 0, 0.2);
	}

	.pokemon-display {
		width: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.pokemon-sprite {
		width: 160px;
		height: 160px;
		image-rendering: pixelated;
		filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
	}

	.left-controls {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.control-row {
		display: flex;
		gap: 0.8rem;
	}

	.red-dot {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: radial-gradient(circle at 30% 30%, #ff5252, #d32f2f);
		border: 3px solid #8b0000;
		box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
	}

	.green-screen {
		flex: 1;
		height: 50px;
		background: #2e7d32;
		border: 3px solid #1b5e20;
		border-radius: 8px;
		box-shadow: inset 0 3px 8px rgba(0, 0, 0, 0.5);
	}

	/* HINGE */
	.hinge {
		width: 20px;
		background: linear-gradient(180deg, #6d1e1e 0%, #4a0f0f 100%);
		border-top: 4px solid #8b0000;
		border-bottom: 4px solid #8b0000;
		box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.5);
		position: relative;
	}

	.hinge::before,
	.hinge::after {
		content: '';
		position: absolute;
		left: 50%;
		transform: translateX(-50%);
		width: 8px;
		height: 8px;
		background: #2d2d2d;
		border-radius: 50%;
		box-shadow: inset 0 2px 3px rgba(0, 0, 0, 0.8);
	}

	.hinge::before {
		top: 20%;
	}

	.hinge::after {
		bottom: 20%;
	}

	/* RIGHT PANEL */
	.right-panel {
		background: linear-gradient(180deg, #dc0a2d 0%, #c40a2a 100%);
		border: 4px solid #8b0000;
		border-left: 2px solid #8b0000;
		border-radius: 0 20px 20px 0;
		padding: 2rem;
		box-shadow: 10px 0 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1);
		transform: rotateY(2deg);
	}

	.info-screen-section {
		margin-bottom: 1.5rem;
	}

	.info-screen {
		background: #1a1a1a;
		padding: 1rem;
		border-radius: 8px;
		box-shadow: inset 0 4px 8px rgba(0, 0, 0, 0.6);
	}

	.pokemon-info {
		background: linear-gradient(180deg, #90caf9 0%, #64b5f6 100%);
		border: 3px solid #0a0a0a;
		border-radius: 4px;
		padding: 1.2rem;
		min-height: 150px;
	}

	.info-line {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.6rem;
		font-size: 0.6rem;
		color: #0a0a0a;
	}

	.name-line {
		margin: 0.8rem 0;
	}

	.pokemon-name {
		font-size: 1.1rem;
		font-weight: bold;
		letter-spacing: 0.05rem;
	}

	.label {
		font-weight: bold;
		min-width: 35px;
	}

	.value {
		letter-spacing: 0.05rem;
	}

	.types {
		display: flex;
		gap: 0.4rem;
		flex-wrap: wrap;
	}

	.type-badge {
		padding: 0.3rem 0.7rem;
		border-radius: 4px;
		font-size: 0.5rem;
		color: white;
		border: 2px solid rgba(0, 0, 0, 0.3);
	}

	.blue-grid-section {
		margin-bottom: 1.5rem;
	}

	.blue-button-grid {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 0.6rem;
	}

	.blue-btn {
		aspect-ratio: 1;
		background: linear-gradient(145deg, #42a5f5, #1e88e5);
		border: 3px solid #0d47a1;
		border-radius: 6px;
		box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.3), 0 3px 0 #0d47a1;
	}

	.right-controls {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.controls-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.cross-section {
		flex: 0 0 auto;
	}

	.cross {
		width: 100px;
		height: 100px;
		display: grid;
		grid-template-areas:
			'. up .'
			'left center right'
			'. down .';
		gap: 1px;
	}

	.cross-btn {
		background: linear-gradient(145deg, #2d2d2d, #1a1a1a);
		border: 2px solid #0a0a0a;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #666;
		font-size: 0.9rem;
		cursor: pointer;
		box-shadow: 0 2px 0 #000, inset 0 1px 2px rgba(255, 255, 255, 0.1);
		transition: all 0.1s;
	}

	.cross-btn:active {
		transform: translateY(1px);
		box-shadow: 0 1px 0 #000, inset 0 1px 2px rgba(255, 255, 255, 0.1);
	}

	.cross-up {
		grid-area: up;
		border-radius: 6px 6px 0 0;
	}

	.cross-right {
		grid-area: right;
		border-radius: 0 6px 6px 0;
	}

	.cross-down {
		grid-area: down;
		border-radius: 0 0 6px 6px;
	}

	.cross-left {
		grid-area: left;
		border-radius: 6px 0 0 6px;
	}

	.cross-center {
		grid-area: center;
		background: #0a0a0a;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.8);
	}

	.white-buttons {
		display: flex;
		flex-direction: column;
		gap: 0.8rem;
	}

	.white-btn {
		width: 50px;
		height: 20px;
		background: linear-gradient(145deg, #f5f5f5, #e0e0e0);
		border: 3px solid #9e9e9e;
		border-radius: 15px;
		box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.5), 0 2px 0 #757575;
	}

	.yellow-circle-section {
		display: flex;
		justify-content: center;
	}

	.yellow-circle {
		width: 60px;
		height: 60px;
		border-radius: 50%;
		background: radial-gradient(circle at 35% 35%, #fff59d, #fdd835);
		border: 4px solid #f57f17;
		box-shadow: inset 0 3px 6px rgba(0, 0, 0, 0.2), 0 4px 0 #f57f17;
		position: relative;
	}

	.yellow-circle::after {
		content: '';
		position: absolute;
		top: 10px;
		left: 10px;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.7);
	}

	@media (max-width: 900px) {
		.pokedex-open {
			grid-template-columns: 1fr;
			max-width: 500px;
		}

		.left-panel {
			border-radius: 20px 20px 0 0;
			border-right: 4px solid #8b0000;
			transform: none;
		}

		.hinge {
			display: none;
		}

		.right-panel {
			border-radius: 0 0 20px 20px;
			border-left: 4px solid #8b0000;
			border-top: 2px solid #8b0000;
			transform: none;
		}

		.pokemon-sprite {
			width: 120px;
			height: 120px;
		}
	}
</style>
