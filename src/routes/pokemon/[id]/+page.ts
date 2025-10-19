import { fetchPokemon, fetchPokemonLocations, fetchPokemonSpecies } from '$lib/api/pokeapi';
import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageLoad = async ({ params }) => {
	try {
		const pokemonId = parseInt(params.id);

		if (isNaN(pokemonId) || pokemonId < 1) {
			throw error(404, 'Pokemon not found');
		}

		const [pokemon, locations, species] = await Promise.all([
			fetchPokemon(pokemonId),
			fetchPokemonLocations(pokemonId),
			fetchPokemonSpecies(pokemonId)
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
