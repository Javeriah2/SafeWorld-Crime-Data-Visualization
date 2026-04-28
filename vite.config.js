import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Landing page lives at the project root as index.html
  // Map lives at map.html — Vite ignores it (not in the module graph)
  build: {
    outDir: 'dist-landing',
  },
});
