import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // relative base so it works on GitHub Pages and Netlify out of the box
  server: {
    port: 5173,
    host: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true
  }
});
