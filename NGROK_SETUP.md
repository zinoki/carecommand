# Sharing Care Command with Teammates (ngrok)

Expose your local dev server so teammates can access the app.

## Prerequisites

- [ngrok](https://ngrok.com/download) installed (`brew install ngrok`)
- Optional: [ngrok account](https://dashboard.ngrok.com/signup) for a persistent URL (free tier available)

## Quick Start

1. **Start the app** (in one terminal):
   ```bash
   npm run docker:up
   npm run dev
   ```

2. **Start ngrok** (in another terminal):
   ```bash
   npm run ngrok
   ```

3. **Share the URL** – ngrok will print a URL like `https://abc123.ngrok-free.app`. Share this with teammates.

## How It Works

- The frontend (Vite) runs on port 5173 and proxies `/api` to the backend (port 3001).
- ngrok tunnels port 5173, so both the app and API requests go through the same URL.
- The API CORS is configured to allow ngrok origins automatically.

## Notes

- Free ngrok URLs change each time you restart ngrok. For a fixed URL, sign up at [ngrok.com](https://ngrok.com) and run `ngrok config add-authtoken <your-token>`.
- Teammates may see an ngrok interstitial page on first visit; they can click "Visit Site" to continue.
