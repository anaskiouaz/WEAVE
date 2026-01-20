import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // Permet d'écouter sur 0.0.0.0 (nécessaire pour Docker)
    proxy: {
      '/api': {
        // CI-DESSOUS : On remplace 'localhost' par le nom du service/conteneur Docker 'weave-api'
        target: 'http://weave-api:4000', 
        changeOrigin: true
      },
      '/upload': {
        target: 'http://weave-api:4000',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://weave-api:4000',
        changeOrigin: true
      },
      // Ajout pour Socket.io si nécessaire
      '/socket.io': {
        target: 'http://weave-api:4000',
        ws: true
      }
    }
  }
})