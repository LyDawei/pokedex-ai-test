// Cache utility for persistent storage of Pokémon data
// Reduces API calls to PokeAPI by caching responses in localStorage

const CACHE_PREFIX = 'pokedex_cache_';
const CACHE_VERSION = 'v1';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface CacheEntry<T> {
	data: T;
	timestamp: number;
	version: string;
}

/**
 * Check if we're in a browser environment
 */
function isBrowser(): boolean {
	return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

/**
 * Generate a cache key
 */
function getCacheKey(key: string): string {
	return `${CACHE_PREFIX}${key}`;
}

/**
 * Check if a cache entry is still valid
 */
function isValid<T>(entry: CacheEntry<T> | null): boolean {
	if (!entry) return false;
	if (entry.version !== CACHE_VERSION) return false;

	const age = Date.now() - entry.timestamp;
	return age < CACHE_TTL;
}

/**
 * Get an item from the cache
 */
export function getFromCache<T>(key: string): T | null {
	if (!isBrowser()) return null;

	try {
		const cached = localStorage.getItem(getCacheKey(key));
		if (!cached) return null;

		const entry: CacheEntry<T> = JSON.parse(cached);

		if (!isValid(entry)) {
			// Clean up expired entries
			localStorage.removeItem(getCacheKey(key));
			return null;
		}

		return entry.data;
	} catch (error) {
		console.error(`Cache read error for key ${key}:`, error);
		return null;
	}
}

/**
 * Set an item in the cache
 */
export function setInCache<T>(key: string, data: T): void {
	if (!isBrowser()) return;

	try {
		const entry: CacheEntry<T> = {
			data,
			timestamp: Date.now(),
			version: CACHE_VERSION
		};

		localStorage.setItem(getCacheKey(key), JSON.stringify(entry));
	} catch (error) {
		// Handle localStorage quota exceeded
		if (error instanceof Error && error.name === 'QuotaExceededError') {
			console.warn('localStorage quota exceeded, clearing old cache entries');
			clearCache();
			// Try one more time after clearing
			try {
				const entry: CacheEntry<T> = {
					data,
					timestamp: Date.now(),
					version: CACHE_VERSION
				};
				localStorage.setItem(getCacheKey(key), JSON.stringify(entry));
			} catch (retryError) {
				console.error('Failed to cache after clearing:', retryError);
			}
		} else {
			console.error(`Cache write error for key ${key}:`, error);
		}
	}
}

/**
 * Clear all cache entries
 */
export function clearCache(): void {
	if (!isBrowser()) return;

	try {
		const keys = Object.keys(localStorage);
		keys.forEach(key => {
			if (key.startsWith(CACHE_PREFIX)) {
				localStorage.removeItem(key);
			}
		});
	} catch (error) {
		console.error('Cache clear error:', error);
	}
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { count: number; size: number } {
	if (!isBrowser()) return { count: 0, size: 0 };

	try {
		const keys = Object.keys(localStorage).filter(key => key.startsWith(CACHE_PREFIX));
		const size = keys.reduce((total, key) => {
			const item = localStorage.getItem(key);
			return total + (item ? item.length : 0);
		}, 0);

		return {
			count: keys.length,
			size: size
		};
	} catch (error) {
		console.error('Cache stats error:', error);
		return { count: 0, size: 0 };
	}
}

/**
 * Check if cache is available and working
 */
export function isCacheAvailable(): boolean {
	if (!isBrowser()) return false;

	try {
		const testKey = `${CACHE_PREFIX}test`;
		localStorage.setItem(testKey, 'test');
		localStorage.removeItem(testKey);
		return true;
	} catch {
		return false;
	}
}

/**
 * Get cache age in hours for a specific key
 */
export function getCacheAge(key: string): number | null {
	if (!isBrowser()) return null;

	try {
		const cached = localStorage.getItem(getCacheKey(key));
		if (!cached) return null;

		const entry = JSON.parse(cached);
		const age = Date.now() - entry.timestamp;
		return age / (1000 * 60 * 60); // Convert to hours
	} catch {
		return null;
	}
}

/**
 * Check if species data is fully cached for all 151 Gen 1 Pokemon
 */
export function isSpeciesCacheWarmed(): boolean {
	if (!isBrowser()) return false;

	try {
		// Check if at least 151 species entries exist and are valid
		let validCount = 0;
		for (let i = 1; i <= 151; i++) {
			const cached = getFromCache(`species_${i}`);
			if (cached) validCount++;
		}
		return validCount === 151;
	} catch {
		return false;
	}
}
