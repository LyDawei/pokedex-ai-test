#!/usr/bin/env node

/**
 * Download script to fetch all 151 Gen 1 Pokemon data from PokeAPI
 * and save it as static JSON files for self-hosting
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const POKEAPI_BASE = 'https://pokeapi.co/api/v2';
const GEN1_POKEMON_COUNT = 151;
const BATCH_SIZE = 20;
const DELAY_MS = 100; // Small delay between requests to be respectful

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, '..', 'static', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Helper to add delay between requests
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Fetch with retry logic
async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Fetching: ${url}`);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Attempt ${i + 1} failed for ${url}: ${error.message}`);

      if (i === retries - 1) {
        throw error;
      }

      // Exponential backoff
      await delay(1000 * Math.pow(2, i));
    }
  }
}

// Fetch data in batches
async function fetchBatch(ids, fetchFn) {
  const results = [];

  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batch = ids.slice(i, i + BATCH_SIZE);
    console.log(`\nProcessing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(ids.length / BATCH_SIZE)}`);

    const batchResults = await Promise.all(
      batch.map(async (id) => {
        const data = await fetchFn(id);
        await delay(DELAY_MS);
        return data;
      })
    );

    results.push(...batchResults);
  }

  return results;
}

async function downloadPokemonList() {
  console.log('\n=== Downloading Pokemon List ===');
  const data = await fetchWithRetry(`${POKEAPI_BASE}/pokemon?limit=${GEN1_POKEMON_COUNT}&offset=0`);

  const filePath = path.join(dataDir, 'pokemon-list.json');
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`✓ Saved pokemon list to ${filePath}`);

  return data.results.map((_, index) => index + 1); // Return IDs 1-151
}

async function downloadPokemonDetails(ids) {
  console.log('\n=== Downloading Pokemon Details ===');

  const allPokemon = await fetchBatch(ids, async (id) => {
    return await fetchWithRetry(`${POKEAPI_BASE}/pokemon/${id}`);
  });

  // Save individual files
  allPokemon.forEach((pokemon) => {
    const filePath = path.join(dataDir, `pokemon-${pokemon.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(pokemon, null, 2));
  });

  console.log(`✓ Saved ${allPokemon.length} Pokemon detail files`);

  // Also save as a single combined file for convenience
  const combinedPath = path.join(dataDir, 'all-pokemon.json');
  fs.writeFileSync(combinedPath, JSON.stringify(allPokemon, null, 2));
  console.log(`✓ Saved combined file to ${combinedPath}`);
}

async function downloadSpeciesData(ids) {
  console.log('\n=== Downloading Pokemon Species Data ===');

  const allSpecies = [];
  const failedIds = [];

  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batch = ids.slice(i, i + BATCH_SIZE);
    console.log(`\nProcessing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(ids.length / BATCH_SIZE)}`);

    const batchResults = await Promise.allSettled(
      batch.map(async (id) => {
        try {
          const data = await fetchWithRetry(`${POKEAPI_BASE}/pokemon-species/${id}`);
          await delay(DELAY_MS);
          return { id, data };
        } catch (error) {
          console.warn(`⚠️  Failed to fetch species ${id}: ${error.message}`);
          return { id, data: null, error: error.message };
        }
      })
    );

    batchResults.forEach((result, idx) => {
      if (result.status === 'fulfilled' && result.value.data) {
        allSpecies.push(result.value.data);
      } else {
        failedIds.push(batch[idx]);
      }
    });
  }

  // Save individual files
  allSpecies.forEach((species) => {
    const filePath = path.join(dataDir, `species-${species.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(species, null, 2));
  });

  console.log(`✓ Saved ${allSpecies.length} species data files`);
  if (failedIds.length > 0) {
    console.warn(`⚠️  Failed to download species for IDs: ${failedIds.join(', ')}`);
  }

  // Also save as a single combined file
  const combinedPath = path.join(dataDir, 'all-species.json');
  fs.writeFileSync(combinedPath, JSON.stringify(allSpecies, null, 2));
  console.log(`✓ Saved combined file to ${combinedPath}`);
}

async function downloadLocationData(ids) {
  console.log('\n=== Downloading Pokemon Location Encounters ===');

  const combinedData = {};
  const failedIds = [];

  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batch = ids.slice(i, i + BATCH_SIZE);
    console.log(`\nProcessing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(ids.length / BATCH_SIZE)}`);

    const batchResults = await Promise.allSettled(
      batch.map(async (id) => {
        try {
          const data = await fetchWithRetry(`${POKEAPI_BASE}/pokemon/${id}/encounters`);
          await delay(DELAY_MS);
          return { id, data };
        } catch (error) {
          console.warn(`⚠️  Failed to fetch locations for ${id}: ${error.message}`);
          return { id, data: null, error: error.message };
        }
      })
    );

    batchResults.forEach((result) => {
      if (result.status === 'fulfilled' && result.value.data) {
        const id = result.value.id;
        const data = result.value.data;

        // Save individual file
        const filePath = path.join(dataDir, `locations-${id}.json`);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

        // Add to combined data
        combinedData[id] = data;
      } else if (result.status === 'fulfilled') {
        failedIds.push(result.value.id);
      }
    });
  }

  console.log(`✓ Saved ${Object.keys(combinedData).length} location encounter files`);
  if (failedIds.length > 0) {
    console.warn(`⚠️  Failed to download locations for IDs: ${failedIds.join(', ')}`);
  }

  // Save combined file
  const combinedPath = path.join(dataDir, 'all-locations.json');
  fs.writeFileSync(combinedPath, JSON.stringify(combinedData, null, 2));
  console.log(`✓ Saved combined file to ${combinedPath}`);
}

async function main() {
  console.log('🚀 Starting Pokemon data download...\n');
  console.log(`Target: ${GEN1_POKEMON_COUNT} Gen 1 Pokemon`);
  console.log(`Batch size: ${BATCH_SIZE}`);
  console.log(`Output directory: ${dataDir}\n`);

  try {
    let pokemonIds;

    // Check if we already have Pokemon list
    const listPath = path.join(dataDir, 'pokemon-list.json');
    if (fs.existsSync(listPath)) {
      console.log('✓ Pokemon list already exists, skipping download');
      pokemonIds = Array.from({ length: GEN1_POKEMON_COUNT }, (_, i) => i + 1);
    } else {
      // Download Pokemon list
      pokemonIds = await downloadPokemonList();
    }

    // Check if we already have Pokemon details
    const combinedPokemonPath = path.join(dataDir, 'all-pokemon.json');
    if (fs.existsSync(combinedPokemonPath)) {
      console.log('✓ Pokemon details already exist, skipping download');
    } else {
      // Download all Pokemon details
      await downloadPokemonDetails(pokemonIds);
    }

    // Download all species data (with error handling)
    await downloadSpeciesData(pokemonIds);

    // Download all location encounters (with error handling)
    await downloadLocationData(pokemonIds);

    console.log('\n✅ All data downloaded successfully!');
    console.log(`\nTotal files created: ${fs.readdirSync(dataDir).length}`);

    // Calculate total size
    const totalSize = fs.readdirSync(dataDir)
      .reduce((sum, file) => {
        const stats = fs.statSync(path.join(dataDir, file));
        return sum + stats.size;
      }, 0);

    console.log(`Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);

  } catch (error) {
    console.error('\n❌ Error downloading data:', error);
    console.error('\nPartial data may have been saved. Check the data directory.');
    process.exit(1);
  }
}

// Run the script
main();
