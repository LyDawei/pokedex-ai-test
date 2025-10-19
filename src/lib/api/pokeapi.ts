// PokeAPI service for fetching Pokemon data

const BASE_URL = 'https://pokeapi.co/api/v2';

export interface PokemonListItem {
	name: string;
	url: string;
}

export interface PokemonSprites {
	front_default: string;
	front_shiny: string;
	other: {
		'official-artwork': {
			front_default: string;
		};
	};
}

export interface PokemonStat {
	base_stat: number;
	stat: {
		name: string;
	};
}

export interface PokemonType {
	type: {
		name: string;
	};
}

export interface Pokemon {
	id: number;
	name: string;
	sprites: PokemonSprites;
	stats: PokemonStat[];
	types: PokemonType[];
	height: number;
	weight: number;
}

export interface LocationArea {
	location_area: {
		name: string;
		url: string;
	};
}

/**
 * Fetch a list of Pokemon with pagination
 */
export async function fetchPokemonList(limit = 151, offset = 0): Promise<PokemonListItem[]> {
	const response = await fetch(`${BASE_URL}/pokemon?limit=${limit}&offset=${offset}`);
	if (!response.ok) throw new Error('Failed to fetch Pokemon list');
	const data = await response.json();
	return data.results;
}

/**
 * Fetch detailed information about a specific Pokemon
 */
export async function fetchPokemon(nameOrId: string | number): Promise<Pokemon> {
	const response = await fetch(`${BASE_URL}/pokemon/${nameOrId}`);
	if (!response.ok) throw new Error(`Failed to fetch Pokemon: ${nameOrId}`);
	return response.json();
}

/**
 * Fetch location encounters for a specific Pokemon
 */
export async function fetchPokemonLocations(nameOrId: string | number): Promise<LocationArea[]> {
	const response = await fetch(`${BASE_URL}/pokemon/${nameOrId}/encounters`);
	if (!response.ok) throw new Error(`Failed to fetch locations for Pokemon: ${nameOrId}`);
	return response.json();
}

/**
 * Extract Pokemon ID from URL
 */
export function getPokemonIdFromUrl(url: string): number {
	const matches = url.match(/\/pokemon\/(\d+)\//);
	return matches ? parseInt(matches[1]) : 0;
}

/**
 * Format Pokemon name for display
 */
export function formatPokemonName(name: string): string {
	return name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * Get type color for styling
 */
export function getTypeColor(type: string): string {
	const colors: Record<string, string> = {
		normal: '#A8A878',
		fire: '#F08030',
		water: '#6890F0',
		electric: '#F8D030',
		grass: '#78C850',
		ice: '#98D8D8',
		fighting: '#C03028',
		poison: '#A040A0',
		ground: '#E0C068',
		flying: '#A890F0',
		psychic: '#F85888',
		bug: '#A8B820',
		rock: '#B8A038',
		ghost: '#705898',
		dragon: '#7038F8',
		dark: '#705848',
		steel: '#B8B8D0',
		fairy: '#EE99AC'
	};
	return colors[type] || '#777';
}
