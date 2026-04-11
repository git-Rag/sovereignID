import { defineConfig } from 'vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    basicSsl(),
    react(),
    // PWA uses public/manifest.json + public/sw.js (registered in main.tsx). Disable generated SW so dist keeps /sw.js from public/.
    VitePWA({ disable: true })
  ],
  // HTTPS dev server: LAN IPs (e.g. https://192.168.x.x:5173) are a secure context so
  // getUserMedia + Web Crypto (encrypted storage) work on phones. Trust the self-signed cert once.
  server: {
    https: true,
    host: true,
    port: 5173,
    strictPort: false,
    allowedHosts: ['sitting-domain-galvanize.ngrok-free.dev']
  }
})
