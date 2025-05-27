import { defineConfig } from "vite";
import reactRefresh from "@vitejs/plugin-react";
import svgrPlugin from "vite-plugin-svgr";

// https://vitejs.dev/config/
export default defineConfig({
  // This changes the out put dir from dist to build
  // comment this out if that isn't relevant for your project
  build: {
    outDir: "build",
  },
 server: {
    port: 3000, // Always serve at port 3000
  },
  resolve: {
    alias: {
      // Make sure browser's crypto is used, not Node.js crypto
      crypto: false, // This prevents any crypto polyfill from being used
      stream: false, // Often needed alongside crypto
      util: false, // Sometimes needed for Azure libraries
    },
  },
  plugins: [
    reactRefresh(),
    svgrPlugin({
      svgrOptions: {
        icon: true,
        // ...svgr options (https://react-svgr.com/docs/options/)
      },
    }),
  ],
});