<script lang="ts">
	import { onMount } from 'svelte';

	// TypeScript interfaces
	interface TutorialStep {
		title: string;
		description: string;
		icon: string;
		duration: number;
	}

	type TutorialMode = 'choice' | 'controls' | 'full' | 'dismissed';

	// State
	let showTutorial = $state<boolean>(false);
	let tutorialMode = $state<TutorialMode>('choice');
	let currentStep = $state<number>(0);
	let isAnimating = $state<boolean>(false);
	let timeoutIds = $state<number[]>([]);
	let overlayElement: HTMLDivElement | undefined;
	let previouslyFocusedElement: HTMLElement | null = null;

	/**
	 * Replays the tutorial from the beginning, resetting all state.
	 * Can be called from parent components via component binding.
	 *
	 * @example
	 * <Tutorial bind:this={tutorialComponent} />
	 * tutorialComponent?.replayTutorial()
	 */
	export function replayTutorial() {
		clearAllTimeouts();
		tutorialMode = 'choice';
		currentStep = 0;
		isAnimating = false;
		showTutorial = true;
	}

	const controlsSteps: TutorialStep[] = [
		{
			title: 'D-Pad Navigation',
			description: 'Use LEFT/RIGHT to browse Pokémon',
			icon: '←→',
			duration: 3000
		},
		{
			title: 'Shiny Toggle',
			description: 'Use UP/DOWN to toggle shiny variants',
			icon: '↑↓',
			duration: 3000
		},
		{
			title: 'Center Button',
			description: 'Press CENTER to view Pokédex entries',
			icon: '●',
			duration: 3000
		}
	];

	const fullSteps: TutorialStep[] = [
		{
			title: 'Welcome, Trainer!',
			description:
				'Ah, hello there! Welcome to the world of Pokémon! This device is a high-tech encyclopedia known as a Pokédex. Let me show you how it works!',
			icon: '👨‍🔬',
			duration: 5000
		},
		{
			title: 'D-Pad Navigation',
			description:
				'The directional buttons on the left panel allow you to navigate through all 151 Pokémon. Press LEFT or RIGHT to go to the previous or next Pokémon in the Pokédex.',
			icon: '←→',
			duration: 5000
		},
		{
			title: 'Shiny Variants',
			description:
				'Some Pokémon have rare alternate colorations called "shinies"! Press UP or DOWN on the D-pad to toggle between normal and shiny forms. Not all Pokémon have shiny sprites available.',
			icon: '✨',
			duration: 5000
		},
		{
			title: 'Viewing Modes',
			description:
				'Press the CENTER button on the D-pad to switch between sprite view and entry view. In entry view, you\'ll see detailed Pokédex descriptions with text-to-speech narration!',
			icon: '●',
			duration: 5000
		},
		{
			title: 'Information Display',
			description:
				'The right panel shows vital statistics: the Pokémon\'s number, name, type(s), height, and weight. This information updates automatically as you navigate.',
			icon: '📊',
			duration: 5000
		},
		{
			title: 'Audio Features',
			description:
				'Each Pokémon has a unique cry that plays when you navigate to it. In entry view, the Pokédex entry is read aloud using text-to-speech. Audio stops automatically when you navigate away.',
			icon: '🔊',
			duration: 5000
		},
		{
			title: 'Ready to Explore!',
			description:
				'Now you\'re ready to start your journey! Remember, there are 151 Pokémon waiting to be discovered. Good luck, and have fun exploring!',
			icon: '🎮',
			duration: 4000
		}
	];

	onMount(() => {
		try {
			const hasSeenTutorial = localStorage.getItem('pokedex-tutorial-seen');
			if (!hasSeenTutorial) {
				showTutorial = true;
			}
		} catch (error) {
			console.error('localStorage access failed:', error);
			// Show tutorial by default if localStorage is blocked
			showTutorial = true;
		}
	});

	function clearAllTimeouts() {
		timeoutIds.forEach((id) => clearTimeout(id));
		timeoutIds = [];
	}

	function selectMode(mode: 'controls' | 'full') {
		tutorialMode = mode;
		currentStep = 0;
		startAnimatedSteps();
	}

	function startAnimatedSteps() {
		clearAllTimeouts();
		isAnimating = true;
		const steps = tutorialMode === 'controls' ? controlsSteps : fullSteps;

		const showNextStep = (index: number) => {
			if (index >= steps.length) {
				// Tutorial complete
				const id = setTimeout(dismissTutorial, 1000) as unknown as number;
				timeoutIds = [...timeoutIds, id];
				return;
			}

			currentStep = index;
			const id = setTimeout(() => showNextStep(index + 1), steps[index].duration) as unknown as number;
			timeoutIds = [...timeoutIds, id];
		};

		showNextStep(0);
	}

	function goToNextStep() {
		clearAllTimeouts();
		const steps = tutorialMode === 'controls' ? controlsSteps : fullSteps;
		if (currentStep < steps.length - 1) {
			currentStep++;
			const id = setTimeout(() => goToNextStep(), steps[currentStep].duration) as unknown as number;
			timeoutIds = [...timeoutIds, id];
		} else {
			dismissTutorial();
		}
	}

	function dismissTutorial() {
		try {
			localStorage.setItem('pokedex-tutorial-seen', 'true');
		} catch (error) {
			console.error('localStorage write failed:', error);
		}
		clearAllTimeouts();
		showTutorial = false;
		tutorialMode = 'dismissed';
	}

	function skipTutorial() {
		dismissTutorial();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (!showTutorial) return;

		switch (event.key) {
			case 'Escape':
				dismissTutorial();
				break;
			case 'Enter':
			case ' ':
			case 'ArrowRight':
				if (isAnimating) {
					event.preventDefault();
					goToNextStep();
				}
				break;
		}
	}

	// Focus management
	$effect(() => {
		if (showTutorial && overlayElement) {
			// Store currently focused element
			previouslyFocusedElement = document.activeElement as HTMLElement;

			// Focus the overlay
			overlayElement.focus();

			// Find and focus first interactive element
			const focusableElements = overlayElement.querySelectorAll<HTMLElement>(
				'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
			);

			if (focusableElements.length > 0) {
				focusableElements[0].focus();
			}
		} else if (!showTutorial && previouslyFocusedElement) {
			// Restore focus when closing
			previouslyFocusedElement.focus();
			previouslyFocusedElement = null;
		}
	});

	// Body overflow management
	$effect(() => {
		if (showTutorial) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}
	});

	// Cleanup timeouts on component destroy
	$effect(() => {
		return () => {
			clearAllTimeouts();
		};
	});

	const activeSteps = $derived(tutorialMode === 'controls' ? controlsSteps : fullSteps);
</script>

<svelte:window onkeydown={handleKeydown} />

{#if showTutorial}
	<div
		bind:this={overlayElement}
		class="tutorial-overlay"
		role="dialog"
		aria-modal="true"
		aria-labelledby="tutorial-title"
		tabindex="-1"
	>
		<!-- Screen reader announcements -->
		<div class="sr-only" role="status" aria-live="polite" aria-atomic="true">
			{#if isAnimating}
				Step {currentStep + 1} of {activeSteps.length}: {activeSteps[currentStep].title}
			{/if}
		</div>

		<div class="tutorial-content">
			{#if tutorialMode === 'choice'}
				<!-- Initial choice screen -->
				<div class="choice-screen">
					<div class="professor-greeting">
						<div class="professor-icon" role="img" aria-label="Professor Oak">👨‍🔬</div>
						<h2 id="tutorial-title">Hello there! Welcome to the Pokédex!</h2>
						<p class="greeting-text">
							I'm Professor Oak. Would you like a quick overview of the controls, or shall I give
							you the full tour?
						</p>
					</div>

					<div class="choice-buttons">
						<button class="tutorial-button controls-btn" onclick={() => selectMode('controls')}>
							<span class="button-icon" role="img" aria-label="Quick">⚡</span>
							<span class="button-text">Quick Controls</span>
							<span class="button-subtext">~9 seconds</span>
						</button>

						<button class="tutorial-button full-btn" onclick={() => selectMode('full')}>
							<span class="button-icon" role="img" aria-label="Detailed">📚</span>
							<span class="button-text">Full Tour</span>
							<span class="button-subtext">~35 seconds</span>
						</button>
					</div>

					<button class="skip-button" onclick={skipTutorial}> Skip Tutorial </button>
				</div>
			{:else if isAnimating}
				<!-- Animated steps display -->
				<div class="steps-display">
					<div class="step-content" class:fade-in={isAnimating}>
						<div class="step-icon" role="img" aria-label={activeSteps[currentStep].title}>
							{activeSteps[currentStep].icon}
						</div>
						<h3 class="step-title">{activeSteps[currentStep].title}</h3>
						<p class="step-description">{activeSteps[currentStep].description}</p>
					</div>

					<div class="progress-indicators" role="progressbar" aria-label="Tutorial progress">
						{#each activeSteps as _, index}
							<div
								class="progress-dot"
								class:active={index === currentStep}
								aria-label="Step {index + 1}"
							></div>
						{/each}
					</div>

					<div class="tutorial-controls">
						<button class="control-button" onclick={dismissTutorial} aria-label="Skip tutorial">
							Skip
						</button>
						<button
							class="control-button primary"
							onclick={goToNextStep}
							aria-label="Next step"
						>
							Next
						</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	.tutorial-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(14, 13, 23, 0.98);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 9999;
		animation: fadeIn 0.3s ease-out;
	}

	@supports (backdrop-filter: blur(8px)) {
		.tutorial-overlay {
			background: rgba(14, 13, 23, 0.95);
			backdrop-filter: blur(8px);
		}
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.tutorial-content {
		max-width: 600px;
		width: 90%;
		padding: 2rem;
	}

	/* Choice Screen Styles */
	.choice-screen {
		text-align: center;
	}

	.professor-greeting {
		margin-bottom: 2rem;
	}

	.professor-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
		animation: bounce 2s ease-in-out infinite;
	}

	@keyframes bounce {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-10px);
		}
	}

	.professor-greeting h2 {
		font-family: 'Orbitron', sans-serif;
		font-size: 2rem;
		color: #00ff00;
		text-shadow:
			0 0 10px #00ff00,
			0 0 20px #00ff00;
		margin-bottom: 1rem;
		animation: glow 2s ease-in-out infinite alternate;
	}

	@keyframes glow {
		from {
			text-shadow:
				0 0 10px #00ff00,
				0 0 20px #00ff00;
		}
		to {
			text-shadow:
				0 0 20px #00ff00,
				0 0 30px #00ff00,
				0 0 40px #00ff00;
		}
	}

	.greeting-text {
		font-family: 'Orbitron', sans-serif;
		font-size: 1.1rem;
		color: #ffffff;
		line-height: 1.6;
		margin-bottom: 2rem;
	}

	.choice-buttons {
		display: flex;
		gap: 1.5rem;
		justify-content: center;
		margin-bottom: 2rem;
		flex-wrap: wrap;
	}

	.tutorial-button {
		background: linear-gradient(135deg, #e01025 0%, #bf001b 100%);
		border: 3px solid #ff4d4d;
		border-radius: 15px;
		padding: 1.5rem 2rem;
		cursor: pointer;
		transition: all 0.3s ease;
		font-family: 'Orbitron', sans-serif;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		min-width: 200px;
		min-height: 44px;
		box-shadow:
			0 4px 15px rgba(224, 16, 37, 0.4),
			inset 0 1px 0 rgba(255, 255, 255, 0.2);
	}

	.tutorial-button:hover {
		transform: translateY(-5px);
		box-shadow:
			0 6px 25px rgba(224, 16, 37, 0.6),
			inset 0 1px 0 rgba(255, 255, 255, 0.3);
		border-color: #00ff00;
	}

	.tutorial-button:active {
		transform: translateY(-2px);
	}

	.tutorial-button:focus-visible {
		outline: 3px solid #00ff00;
		outline-offset: 4px;
	}

	.button-icon {
		font-size: 2.5rem;
	}

	.button-text {
		font-size: 1.2rem;
		font-weight: 700;
		color: #ffffff;
		text-transform: uppercase;
	}

	.button-subtext {
		font-size: 0.85rem;
		color: #ffffff;
		font-weight: 400;
	}

	/* Steps Display Styles */
	.steps-display {
		text-align: center;
		position: relative;
	}

	.step-content {
		min-height: 300px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		background: rgba(0, 255, 0, 0.05);
		border: 2px solid #00ff00;
		border-radius: 20px;
		box-shadow:
			0 0 20px rgba(0, 255, 0, 0.3),
			inset 0 0 20px rgba(0, 255, 0, 0.1);
		animation: pulse 2s ease-in-out infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			box-shadow:
				0 0 20px rgba(0, 255, 0, 0.3),
				inset 0 0 20px rgba(0, 255, 0, 0.1);
		}
		50% {
			box-shadow:
				0 0 30px rgba(0, 255, 0, 0.5),
				inset 0 0 30px rgba(0, 255, 0, 0.15);
		}
	}

	.step-content.fade-in {
		animation:
			fadeInContent 0.5s ease-out,
			pulse 2s ease-in-out infinite;
	}

	@keyframes fadeInContent {
		from {
			opacity: 0;
			transform: scale(0.9);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	.step-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
		animation: iconFloat 3s ease-in-out infinite;
	}

	@keyframes iconFloat {
		0%,
		100% {
			transform: translateY(0) rotate(0deg);
		}
		25% {
			transform: translateY(-10px) rotate(-5deg);
		}
		75% {
			transform: translateY(-10px) rotate(5deg);
		}
	}

	.step-title {
		font-family: 'Orbitron', sans-serif;
		font-size: 1.8rem;
		color: #00ff00;
		text-shadow:
			0 0 10px #00ff00,
			0 0 20px #00ff00;
		margin-bottom: 1rem;
		text-transform: uppercase;
		letter-spacing: 2px;
	}

	.step-description {
		font-family: 'Orbitron', sans-serif;
		font-size: 1rem;
		color: #ffffff;
		line-height: 1.8;
		max-width: 500px;
	}

	.progress-indicators {
		display: flex;
		gap: 0.75rem;
		justify-content: center;
		margin-top: 2rem;
		margin-bottom: 1rem;
	}

	.progress-dot {
		width: 16px;
		height: 16px;
		padding: 14px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.3);
		transition: all 0.3s ease;
	}

	.progress-dot.active {
		background: #00ff00;
		box-shadow:
			0 0 10px #00ff00,
			0 0 20px #00ff00;
		transform: scale(1.3);
	}

	/* Tutorial Controls */
	.tutorial-controls {
		display: flex;
		gap: 1rem;
		justify-content: center;
		margin-top: 1rem;
	}

	.control-button {
		background: transparent;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-radius: 8px;
		padding: 0.75rem 1.5rem;
		min-height: 44px;
		min-width: 100px;
		color: rgba(255, 255, 255, 0.7);
		font-family: 'Orbitron', sans-serif;
		font-size: 0.9rem;
		cursor: pointer;
		transition: all 0.3s ease;
		text-transform: uppercase;
		letter-spacing: 1px;
	}

	.control-button:hover {
		background: rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 255, 255, 0.5);
		color: #ffffff;
	}

	.control-button:focus-visible {
		outline: 2px solid #00ff00;
		outline-offset: 2px;
	}

	.control-button.primary {
		background: linear-gradient(135deg, #00ff00 0%, #00cc00 100%);
		border-color: #00ff00;
		color: #000000;
		font-weight: 700;
	}

	.control-button.primary:hover {
		background: linear-gradient(135deg, #00ff00 0%, #00dd00 100%);
		box-shadow: 0 0 15px rgba(0, 255, 0, 0.5);
	}

	/* Skip Button (legacy - for choice screen) */
	.skip-button {
		background: transparent;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-radius: 8px;
		padding: 0.75rem 1.5rem;
		min-height: 44px;
		color: rgba(255, 255, 255, 0.7);
		font-family: 'Orbitron', sans-serif;
		font-size: 0.9rem;
		cursor: pointer;
		transition: all 0.3s ease;
		text-transform: uppercase;
		letter-spacing: 1px;
	}

	.skip-button:hover {
		background: rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 255, 255, 0.5);
		color: #ffffff;
	}

	.skip-button:focus-visible {
		outline: 2px solid #00ff00;
		outline-offset: 2px;
	}

	/* Reduced Motion */
	@media (prefers-reduced-motion: reduce) {
		.professor-icon,
		.step-icon,
		.professor-greeting h2,
		.step-content {
			animation: none !important;
		}

		.tutorial-overlay {
			animation: none;
		}

		.tutorial-button:hover,
		.tutorial-button:active {
			transform: none;
		}
	}

	/* Responsive Design */
	@media (max-width: 560px) {
		.tutorial-content {
			padding: 1rem;
		}

		.professor-greeting h2 {
			font-size: 1.5rem;
		}

		.greeting-text {
			font-size: 1rem;
		}

		.choice-buttons {
			flex-direction: column;
			gap: 1rem;
		}

		.tutorial-button {
			min-width: 100%;
		}

		.step-content {
			min-height: 250px;
			padding: 1.5rem;
		}

		.step-icon {
			font-size: 3rem;
		}

		.step-title {
			font-size: 1.4rem;
		}

		.step-description {
			font-size: 0.9rem;
		}

		.tutorial-controls {
			flex-direction: column;
		}

		.control-button {
			width: 100%;
		}
	}
</style>
