import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'
import preact from '@preact/preset-vite'
import { comlink } from 'vite-plugin-comlink'
import Unfonts from 'unplugin-fonts/vite'
import inspect from 'vite-plugin-inspect'
import { VitePWA } from 'vite-plugin-pwa'

function SQLiteDevPlugin(): Plugin {
  return {
    name: 'configure-response-headers',
    configureServer: (server) => {
      server.middlewares.use((_req, res, next) => {
        res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp')
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
        next()
      })
    },
  }
}

const config = defineConfig({
  plugins: [
    inspect(),
    comlink(),
    preact(),
    SQLiteDevPlugin(),
    Unfonts({
      google: {
        families: [
          {
            /**
             * Family name (required)
             */
            name: 'Inter',

            /**
             * Family styles
             */
            // styles: 'ital,wght@0,400;1,200',
          },
        ],
      },
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,json,svg,png,ico,wasm}'],
      },
      manifest: {
        name: 'Byoga',
        short_name: 'Byoga',
        description: 'IDFC Bank statement analyzer and visualizer',
        theme_color: '#14A670',
        background_color: '#14A670',
        icons: [
          // {
          //   src: 'pwa-64x64.png',
          //   sizes: '64x64',
          //   type: 'image/png',
          // },
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'pwa-maskable-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  worker: {
    format: 'es',
    plugins: () => [comlink()],
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    cssMinify: 'lightningcss',
  },
  resolve: {
    alias: [
      { find: 'frappe-charts', replacement: 'frappe-charts/dist/frappe-charts.min.esm' },
    ],
  },
  optimizeDeps: {
    exclude: ['sqlocal'],
  },
  test: {
    include: ['tests/**/*.spec.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
    },
  },
})

export default config
