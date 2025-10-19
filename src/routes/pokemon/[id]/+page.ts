import { fetchPokemon, fetchPokemonLocations } from '$lib/api/pokeapi';
import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageLoad = async ({ params }) => {
	try {
		const pokemonId = parseInt(params.id);

		if (isNaN(pokemonId) || pokemonId < 1) {
			throw error(404, 'Pokemon not found');
		}

		const [pokemon, locations] = await Promise.all([
			fetchPokemon(pokemonId),
			fetchPokemonLocations(pokemonId)
		]);

		return {
			pokemon,
			locations
		};
	} catch (e) {
		throw error(404, 'Pokemon not found');
	}
};
