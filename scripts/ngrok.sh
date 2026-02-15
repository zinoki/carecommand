#!/usr/bin/env bash
# Expose Care Command dev server via ngrok for sharing with teammates.
# Run this after: npm run docker:up && npm run dev
# Share the ngrok URL (e.g. https://abc123.ngrok-free.app) with teammates.

set -e
if ! command -v ngrok &>/dev/null; then
  echo "ngrok not found. Install with: brew install ngrok"
  echo "Or download from: https://ngrok.com/download"
  exit 1
fi
echo "Starting ngrok tunnel to http://localhost:5173 (frontend + API proxy)"
echo "Share the URL below with teammates."
ngrok http 5173
