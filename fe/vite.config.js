import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
// Le proxy cible par défaut localhost:4000 (développement local).
// Si vous exécutez l'ensemble dans Docker, définissez l'env `API_PROXY_TARGET`
// (ex: weave-api:4000) avant de démarrer Vite pour utiliser le nom de service Docker.
const proxyTarget = process.env.API_PROXY_TARGET || 'http://weave-api:4000';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: proxyTarget,
        changeOrigin: true
      },
      '/upload': {
        target: proxyTarget,
        changeOrigin: true
      },
      '/uploads': {
        target: proxyTarget,
        changeOrigin: true
      }
    }
  }
})