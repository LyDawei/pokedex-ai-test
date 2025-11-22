// PokeAPI service for fetching Pokemon data
import { getFromCache, setInCache } from '$lib/cache';

const BASE_URL = 'https://pokeapi.co/api/v2';

/**
 * Retry a fetch operation with exponential backoff
 */
async function fetchWithRetry(
	url: string,
	options: RequestInit = {},
	maxRetries = 3,
	baseDelay = 1000
): Promise<Response> {
	let lastError: Error | null = null;

	for (let attempt = 0; attempt < maxRetries; attempt++) {
		try {
			const response = await fetch(url, options);

			// If rate limited, wait and retry (but only if we have retries left)
			if (response.status === 429 && attempt < maxRetries - 1) {
				const retryAfter = response.headers.get('Retry-After');
				// Handle numeric seconds format (ignore date format)
				const retrySeconds = retryAfter ? parseInt(retryAfter, 10) : NaN;
				const delay = !isNaN(retrySeconds)
					? retrySeconds * 1000
					: baseDelay * Math.pow(2, attempt);
				await new Promise((resolve) => setTimeout(resolve, delay));
				continue;
			}

			return response;
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error));

			// Don't retry on the last attempt
			if (attempt < maxRetries - 1) {
				const delay = baseDelay * Math.pow(2, attempt);
				await new Promise((resolve) => setTimeout(resolve, delay));
			}
		}
	}

	throw lastError || new Error('Failed after max retries');
}

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
	versions?: {
		'generation-v'?: {
			'black-white'?: {
				animated?: {
					front_default: string | null;
					front_shiny: string | null;
				};
			};
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

export interface PokemonCries {
	latest: string;
	legacy: string;
}

export interface Pokemon {
	id: number;
	name: string;
	sprites: PokemonSprites;
	stats: PokemonStat[];
	types: PokemonType[];
	height: number;
	weight: number;
	cries: PokemonCries;
}

export interface LocationArea {
	location_area: {
		name: string;
		url: string;
	};
}

export interface FlavorTextEntry {
	flavor_text: string;
	language: {
		name: string;
	};
	version: {
		name: string;
	};
}

export interface PokemonSpecies {
	id: number;
	name: string;
	flavor_text_entries: FlavorTextEntry[];
}

/**
 * Fetch a list of Pokemon with pagination
 */
export async function fetchPokemonList(limit = 151, offset = 0): Promise<PokemonListItem[]> {
	const cacheKey = `pokemon_list_${limit}_${offset}`;

	// Check cache first
	const cached = getFromCache<PokemonListItem[]>(cacheKey);
	if (cached) {
		if (import.meta.env.DEV) {
			console.log(`[Cache HIT] Pokemon list (${limit} items)`);
		}
		return cached;
	}

	// Fetch from API
	if (import.meta.env.DEV) {
		console.log(`[Cache MISS] Fetching Pokemon list from API (${limit} items)`);
	}
	const response = await fetchWithRetry(`${BASE_URL}/pokemon?limit=${limit}&offset=${offset}`);
	if (!response.ok) throw new Error('Failed to fetch Pokemon list');
	const data = await response.json();
	const results = data.results;

	// Store in cache
	setInCache(cacheKey, results);

	return results;
}

/**
 * Fetch detailed information about a specific Pokemon
 */
export async function fetchPokemon(nameOrId: string | number): Promise<Pokemon> {
	const cacheKey = `pokemon_${nameOrId}`;

	// Check cache first
	const cached = getFromCache<Pokemon>(cacheKey);
	if (cached) {
		return cached;
	}

	// Fetch from API
	const response = await fetchWithRetry(`${BASE_URL}/pokemon/${nameOrId}`);
	if (!response.ok) {
		// Log detailed error server-side only
		if (import.meta.env.DEV) {
			console.error(`Failed to fetch Pokemon: ${nameOrId} - ${response.status} ${response.statusText}`);
		}
		throw new Error('Failed to fetch Pokemon data');
	}
	const data = await response.json();

	// Store in cache
	setInCache(cacheKey, data);

	return data;
}

/**
 * Fetch location encounters for a specific Pokemon
 */
export async function fetchPokemonLocations(nameOrId: string | number): Promise<LocationArea[]> {
	const cacheKey = `locations_${nameOrId}`;

	// Check cache first
	const cached = getFromCache<LocationArea[]>(cacheKey);
	if (cached) {
		return cached;
	}

	// Fetch from API
	const response = await fetchWithRetry(`${BASE_URL}/pokemon/${nameOrId}/encounters`);
	if (!response.ok) {
		// Log detailed error server-side only
		if (import.meta.env.DEV) {
			console.error(`Failed to fetch locations for Pokemon: ${nameOrId} - ${response.status} ${response.statusText}`);
		}
		throw new Error('Failed to fetch Pokemon locations');
	}
	const data = await response.json();

	// Store in cache
	setInCache(cacheKey, data);

	return data;
}

/**
 * Fetch Pokemon species data including Pokedex entries
 */
export async function fetchPokemonSpecies(nameOrId: string | number): Promise<PokemonSpecies> {
	const cacheKey = `species_${nameOrId}`;

	// Check cache first
	const cached = getFromCache<PokemonSpecies>(cacheKey);
	if (cached) {
		if (import.meta.env.DEV) {
			console.log(`[Cache HIT] Species data for ${nameOrId}`);
		}
		return cached;
	}

	// Fetch from API
	if (import.meta.env.DEV) {
		console.log(`[Cache MISS] Fetching species data for ${nameOrId} from API`);
	}
	const response = await fetchWithRetry(`${BASE_URL}/pokemon-species/${nameOrId}`);
	if (!response.ok) {
		// Log detailed error server-side only
		if (import.meta.env.DEV) {
			console.error(`Failed to fetch species for Pokemon: ${nameOrId} - ${response.status} ${response.statusText}`);
		}
		throw new Error('Failed to fetch Pokemon species data');
	}
	const data = await response.json();

	// Store in cache
	setInCache(cacheKey, data);

	return data;
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
