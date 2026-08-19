import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// This app is deployed as a GitHub Pages *project* site, so production
// builds need every asset URL prefixed with the repo name. The dev server
// stays at "/" so `npm run dev` keeps working normally.
const REPO_NAME = 'life-organizer-'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: command === 'build' ? `/${REPO_NAME}/` : '/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png'],
      manifest: {
        id: '/',
        name: 'Hub — Planner, Notebook & Journal',
        short_name: 'Hub',
        description:
          'A quick-capture daily planner, thought notebook, and journal in one place.',
        theme_color: '#4338ca',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,webmanifest}'],
        // Local-first app: once the shell is cached, it should load with
        // zero network at all. Data itself lives in IndexedDB, not fetched.
        navigateFallback: 'index.html',
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
}))
