# Pokédex Audio Assets

This folder contains audio files for Pokédex UI interactions.

## Required Audio Files

Place the following `.ogg` audio files in this directory:

1. **pokedex_click.ogg** - Plays when users click D-pad buttons (up, down, left, right)
2. **pokedex_scan_register_aspect.ogg** - Plays when users click the center button

## Audio Specifications

- Format: `.ogg` (Ogg Vorbis)
- Volume: Automatically set to 60% (0.6) in code
- Playback: Stops previous instance before playing new sound

## Usage

Once you add the audio files to this folder, they will automatically work with:
- D-pad navigation (left/right arrows for Previous/Next Pokémon)
- D-pad toggles (up/down arrows for Shiny toggle)
- Center button (toggles between sprite view and Pokédex entry view)

## Implementation Details

Audio playback is managed by `/src/lib/audio/sounds.ts` and integrated into the main Pokédex component at `/src/routes/[[id]]/+page.svelte`.
