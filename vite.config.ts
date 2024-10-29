import { resolve } from "path";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "./"),
    },
  },
  build: {
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, "rendering/main.ts"),
      name: "SvelteSSR",
      fileName: "svelte-ssr",
    },
    target: "node",
    rollupOptions: {
      external: ["fsevents"],
    },
  },
});
