import { fetchPokemon, fetchPokemonLocations, fetchPokemonSpecies } from '$lib/api/pokeapi';
import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageLoad = async ({ params, fetch }) => {
	try {
		const pokemonId = parseInt(params.id);

		if (isNaN(pokemonId) || pokemonId < 1) {
			throw error(404, 'Pokemon not found');
		}

		const [pokemon, locations, species] = await Promise.all([
			fetchPokemon(pokemonId, fetch),
			fetchPokemonLocations(pokemonId, fetch),
			fetchPokemonSpecies(pokemonId, fetch)
		]);

		return {
			pokemon,
			locations,
			species
		};
	} catch (e) {
		throw error(404, 'Pokemon not found');
	}
};
