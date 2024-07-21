import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'
import preact from '@preact/preset-vite'
import { comlink } from 'vite-plugin-comlink'
import Unfonts from 'unplugin-fonts/vite'
import inspect from 'vite-plugin-inspect'

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
  ],
  worker: {
    format: 'es',
    plugins: () => [comlink()],
  },
  build: {
    target: 'esnext',
    // minify: 'esbuild',
    minify: false,
    cssMinify: 'lightningcss',
  },
  resolve: {
    alias: {
      'frappe-charts': 'frappe-charts/dist/frappe-charts.min.esm',
    },
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
