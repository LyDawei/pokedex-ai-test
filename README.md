# Pokédex AI

An interactive Pokédex application with AI-powered text-to-speech, built with SvelteKit.

## Quick Start

Make the setup script executable and run it:

```sh
chmod +x setup.sh
./setup.sh
```

Note: This setup script is designed for macOS.

This script will:
- Check Node.js version (requires v18+, recommended v22.x)
- Install all dependencies
- Set up environment variables (prompts for ElevenLabs API key)
- Run type checking
- Verify build configuration
- Optionally start the development server

## Manual Setup

If you prefer to set up manually:

### 1. Install dependencies

```sh
npm install
```

### 2. Configure environment variables

```sh
cp .env.example .env
```

Edit `.env` and add your ElevenLabs API key:
```
ELEVENLABS_API_KEY=your_api_key_here
```

Get your API key from: https://elevenlabs.io/app/settings/api-keys

### 3. Start development server

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

The app will be available at: http://localhost:5173/projects/pokedex

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
