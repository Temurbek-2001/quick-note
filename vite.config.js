import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        
          "name": "Quick Notes",
          "short_name": "Notes",
          "start_url": "/",
          "scope": "/",
          "display": "standalone",
          "background_color": "#ffffff",
          "theme_color": "#3b82f6",
          "icons": [
            {
              "src": "/icon-192x192.png",
              "sizes": "192x192",
              "type": "image/png"
            },
            {
              "src": "/icon-512x512.png",
              "sizes": "512x512",
              "type": "image/png"
            }
          ]
        
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico}']
      }
    })
  ]
})