<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
</svelte:head>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		box-sizing: border-box;
	}

	:global(*,
	*::before,
	*::after) {
		box-sizing: inherit;
	}
</style>

{@render children?.()}
