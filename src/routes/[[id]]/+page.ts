import { error } from '@sveltejs/kit';
import {
	fetchPokemonList,
	fetchPokemon,
	fetchPokemonSpecies,
	getPokemonIdFromUrl,
	type Pokemon,
	type PokemonSpecies
} from '$lib/api/pokeapi';
import type { PageLoad } from './$types';

/**
 * Fetch items in batches to avoid overwhelming the API
 */
async function fetchInBatches<T>(
	items: { id: number }[],
	fetchFn: (id: number) => Promise<T>,
	batchSize = 20
): Promise<T[]> {
	const results: T[] = [];

	for (let i = 0; i < items.length; i += batchSize) {
		const batch = items.slice(i, i + batchSize);
		const batchResults = await Promise.all(batch.map((item) => fetchFn(item.id)));
		results.push(...batchResults);
	}

	return results;
}

export const load: PageLoad = async ({ params, fetch }) => {
	try {
		// Fetch first 151 Pokemon (Gen 1)
		const pokemonList = await fetchPokemonList(151, 0, fetch);

		// Prepare items with IDs for batched fetching
		const itemsWithIds = pokemonList.map((item) => ({
			id: getPokemonIdFromUrl(item.url)
		}));

		// Fetch detailed data in batches to avoid rate limiting
		const pokemonData = await fetchInBatches<Pokemon>(itemsWithIds, (id) => fetchPokemon(id, fetch), 20);

		// Prefetch all species data to cache it for later use
		// This prevents hitting the API when navigating between Pokemon
		// Run in background - don't wait for it to complete
		fetchInBatches<PokemonSpecies>(itemsWithIds, (id) => fetchPokemonSpecies(id, fetch), 20)
			.then(() => {
				console.log('[Cache] Successfully cached all 151 Pokemon species data');
			})
			.catch((err) => {
				console.warn('[Cache] Failed to prefetch species data:', err);
			});

		// Parse the optional ID parameter
		const requestedId = params.id ? parseInt(params.id, 10) : null;

		// Find the index of the requested Pokemon (ID matches index + 1 for Gen 1)
		let initialIndex = 0;
		if (requestedId && requestedId >= 1 && requestedId <= 151) {
			initialIndex = requestedId - 1; // Convert ID to 0-based index
		}

		return {
			pokemon: pokemonData,
			initialIndex
		};
	} catch (err) {
		// Log the error for debugging
		console.error('Failed to load Pokemon data:', err);

		// Return a proper error response
		throw error(503, {
			message: 'Unable to load Pokemon data. Please try again in a moment.'
		});
	}
};
