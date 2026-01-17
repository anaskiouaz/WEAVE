import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://weave-api:4000', // <-- REMPLACEZ localhost PAR weave-api
        changeOrigin: true
      },
      '/upload': {
        target: 'http://weave-api:4000', // <-- ICI AUSSI
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://weave-api:4000', // <-- ET ICI
        changeOrigin: true
      }
    }
  }
})