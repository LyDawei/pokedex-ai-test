# Deployment Guide

This Pokédex app is configured to run at `lydawei.com/projects/pokedex`.

## Prerequisites

The app uses `@sveltejs/adapter-vercel` and is configured with `paths.base: '/projects/pokedex'`.

## Setup Steps

### 1. Set Environment Variables

Copy `.env.example` to `.env` for local development:
```bash
cp .env.example .env
```

Then add your ElevenLabs API key to `.env`:
```
ELEVENLABS_API_KEY=your_actual_api_key
```

Get your API key from: https://elevenlabs.io/

### 2. Deploy the Pokédex to Vercel

**Option A: Using Vercel CLI**
```bash
npm install -g vercel
npm run build
vercel --prod
```

**Option B: Using Vercel Dashboard**
1. Push your code to GitHub
2. Go to vercel.com and import your repository
3. Vercel will auto-detect SvelteKit settings
4. Add environment variable in dashboard: `ELEVENLABS_API_KEY`
5. Deploy

**Important:** In Vercel's project settings, add:
- Environment Variable: `ELEVENLABS_API_KEY` = your ElevenLabs API key

### 3. Configure Reverse Proxy on lydawei.com

Since the app is configured with `base: '/projects/pokedex'`, you need to set up a proxy on your main site.

**Important:** The deployed Vercel app will be accessible at:
- `your-pokedex.vercel.app/projects/pokedex` (with the base path)

Your proxy should forward requests from `lydawei.com/projects/pokedex` to the Vercel deployment.

#### Option A: Vercel Rewrites (if lydawei.com is on Vercel)

Add to your main site's `vercel.json`:
```json
{
  "rewrites": [
    {
      "source": "/projects/pokedex/:path*",
      "destination": "https://your-pokedex.vercel.app/projects/pokedex/:path*"
    }
  ]
}
```

#### Option B: Next.js Rewrites (if lydawei.com uses Next.js)

Add to your main site's `next.config.js`:
```js
module.exports = {
  async rewrites() {
    return [
      {
        source: '/projects/pokedex/:path*',
        destination: 'https://your-pokedex.vercel.app/projects/pokedex/:path*'
      }
    ]
  }
}
```

#### Option C: Nginx

```nginx
location /projects/pokedex {
    proxy_pass https://your-pokedex.vercel.app/projects/pokedex;
    proxy_set_header Host your-pokedex.vercel.app;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### 4. Alternative: Deploy Without Proxy

If you don't want to set up a reverse proxy, you can:

1. Remove the `paths.base` configuration from `svelte.config.js`
2. Deploy to a subdomain like `pokedex.lydawei.com`
3. Add a CNAME record in your DNS pointing to your Vercel deployment

### 5. Test

After deployment and proxy setup:
- Visit `https://lydawei.com/projects/pokedex`
- Verify all assets load correctly (check browser console for 404s)
- Test navigation between home and detail pages
- Click the "HEAR ENTRY" button to verify the TTS API endpoint works

## Local Testing with Base Path

To test locally with the base path:
```bash
npm run build
npm run preview
```

Then visit: `http://localhost:4173/projects/pokedex`

## Troubleshooting

### Assets not loading (404 errors)
- Ensure the proxy preserves the full path including `/projects/pokedex`
- Check that Vercel deployment is accessible at the full path

### Navigation broken
- Verify `base` is imported and used in all navigation links
- Check browser console for errors

### TTS not working
- Verify `ELEVENLABS_API_KEY` is set in Vercel environment variables
- Check Vercel function logs for API errors
- Ensure the API endpoint is accessible at `/projects/pokedex/api/tts`

## Notes

- The app uses `@sveltejs/adapter-vercel` for optimal Vercel deployment
- Text-to-speech requests are limited to 5000 characters
- All environment variables must be set in Vercel's dashboard, not in code
