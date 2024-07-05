import { defineConfig } from "vite";
import voby from "voby-vite";

const config = defineConfig({
  plugins: [
    voby({
      hmr: {
        // HMR-related options
        enabled: process.env.NODE_ENV !== "production", // Whether HMR is enabled or not
        filter: /\.v\.(jsx|tsx)$/, // Regex matching the files containing components to enable HMR for
      },
    }),
  ],
});

export default config;
