import { fetchPokemonList, fetchPokemon, getPokemonIdFromUrl } from '$lib/api/pokeapi';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	// Fetch first 151 Pokemon (Gen 1)
	const pokemonList = await fetchPokemonList(151, 0);

	// Fetch detailed data for each Pokemon to get sprites
	const pokemonData = await Promise.all(
		pokemonList.map(async (item) => {
			const id = getPokemonIdFromUrl(item.url);
			return fetchPokemon(id);
		})
	);

	return {
		pokemon: pokemonData
	};
};
