import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['RicarLogo.png', 'favicon.ico'],
      manifest: {
        name: 'RICAREE! Legacy Wars',
        short_name: 'RICAREE!',
        description: '2D RTS Block Castle Battle',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'fullscreen',
        orientation: 'landscape',
        icons: [
          {
            src: '/RicarLogo.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/RicarLogo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ]
});
