import { fetchPokemonList, fetchPokemon, getPokemonIdFromUrl } from '$lib/api/pokeapi';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
	// Fetch first 151 Pokemon (Gen 1)
	const pokemonList = await fetchPokemonList(151, 0);

	// Fetch detailed data for each Pokemon to get sprites
	const pokemonData = await Promise.all(
		pokemonList.map(async (item) => {
			const id = getPokemonIdFromUrl(item.url);
			return fetchPokemon(id);
		})
	);

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
};
