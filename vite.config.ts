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
        name: 'Woordjes',
        short_name: 'Woordjes',
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
        // l'image de partage (aperçu des liens) ne sert pas dans l'appli
        globIgnores: ['social.png', 'lecons/**'],
        // les leçons animées sont des pages à part (public/lecons/) : l'appli ne doit pas répondre à leur place
        navigateFallbackDenylist: [/\/lecons\//],
        runtimeCaching: [
          {
            // le nom de chaque mp3 change avec son texte : une fois en cache, il est bon pour toujours
            urlPattern: /\/audio\/[0-9a-f]{16}\.mp3$/,
            handler: 'CacheFirst',
            options: { cacheName: 'voix', expiration: { maxEntries: 5000 } },
          },
          {
            // les leçons gardent les mêmes noms de fichiers quand on les refait : toujours le réseau d'abord
            urlPattern: /\/lecons\//,
            handler: 'NetworkFirst',
            options: { cacheName: 'lecons', networkTimeoutSeconds: 4 },
          },
          {
            urlPattern: /\/audio\/index\.json$/,
            handler: 'NetworkFirst',
            options: { cacheName: 'voix-index', networkTimeoutSeconds: 4 },
          },
        ],
      },
    }),
  ],
  test: { environment: 'node' },
})
