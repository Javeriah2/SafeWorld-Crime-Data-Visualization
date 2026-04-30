#!/bin/bash
set -e

# Generate config.js from the GOOGLE_MAPS_API_KEY environment variable.
# This keeps the real key out of the repository while still making it
# available to the vanilla JS map at runtime.
printf 'export const GOOGLE_MAPS_API_KEY = "%s";\n' "$GOOGLE_MAPS_API_KEY" > config.js

# Build the React landing page with Vite (outputs to dist/)
npm run build

# Copy the vanilla JS map files into the same dist/ folder so Netlify
# serves everything from one place.
cp map.html dist/
cp -r js dist/
cp -r styles dist/
cp -r data dist/
cp config.js dist/
