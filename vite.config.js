import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({ disable: true })
  ],

  server: {
    host: true,
    port: 5173,
    allowedHosts: 'all'
  },

  preview: {
    host: true,
    port: 4173,
    allowedHosts: 'all'
  }
});