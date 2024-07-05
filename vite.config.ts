import { defineConfig } from 'vite'
import voby from 'voby-vite'
import { comlink } from 'vite-plugin-comlink'

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
  ],
  worker: {
    plugins: () => [comlink()],
  },
})

export default config
