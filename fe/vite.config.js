import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0', // Important pour Docker
    proxy: {
      '/api': {
        // Dans Docker, le service s'appelle 'api'
        target: 'http://api:4000', 
        changeOrigin: true
      },
      '/upload': {
        target: 'http://api:4000',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://api:4000',
        changeOrigin: true
      },
      // Ajout pour Socket.io si nécessaire
      '/socket.io': {
        target: 'http://api:4000',
        ws: true
      }
    }
  }
})