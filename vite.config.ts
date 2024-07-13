import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'
import voby from 'voby-vite'
import { comlink } from 'vite-plugin-comlink'
import UnoCSS from 'unocss/vite'

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
    comlink(),
    voby({
      hmr: {
        // HMR-related options
        enabled: process.env.NODE_ENV !== 'production', // Whether HMR is enabled or not
        filter: /\.(jsx|tsx)$/, // Regex matching the files containing components to enable HMR for
      },
    }),
    SQLiteDevPlugin(),
    UnoCSS(),
  ],
  worker: {
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
