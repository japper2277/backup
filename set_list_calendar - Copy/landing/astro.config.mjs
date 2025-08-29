import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://micfinderapp.com',
  base: '/',
  build: {
    assets: 'assets'
  },
  server: {
    port: 3001,
    host: true
  }
});