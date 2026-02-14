#!/bin/bash
# Deploy CareCommand to Render
# Set RENDER_SERVICE_ID and RENDER_API_KEY in env
set -e
npm run build
# Render will run: npm run db:migrate:prod && npm start
echo "Build complete. Push to trigger Render deploy."
