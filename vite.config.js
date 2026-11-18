import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' => relative asset paths, works on any GitHub Pages sub-path.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { outDir: 'dist', sourcemap: false },
});
