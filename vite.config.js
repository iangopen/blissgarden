import { defineConfig } from 'vite';

// Served from https://<user>.github.io/blissgarden/, so every asset URL is under /blissgarden/ (dev and build).
export default defineConfig({
  base: '/blissgarden/',
  build: {
    outDir: 'dist',        // never docs/ — that holds AUDIT.md
    emptyOutDir: true,
  },
});
