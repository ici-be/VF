import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // Chemins relatifs : l'appli marche quel que soit le nom du dépôt GitHub Pages
  base: './',
  plugins: [
    preact(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Vocabulaire NL',
        short_name: 'Vocabulaire',
        description: 'Réviser le vocabulaire néerlandais et les cours d’immersion',
        lang: 'fr',
        theme_color: '#1f5fbf',
        background_color: '#f6f8fb',
        display: 'standalone',
        start_url: './',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // les voix (mp3) seront mises en cache au fur et à mesure qu'on les écoute
        runtimeCaching: [{
          urlPattern: /\/audio\/.*\.mp3$/,
          handler: 'CacheFirst',
          options: { cacheName: 'voix', expiration: { maxEntries: 5000 } },
        }],
      },
    }),
  ],
  test: { environment: 'node' },
})
