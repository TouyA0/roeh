import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Tauri dev host for mobile/remote dev
const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // Prevent vite from obscuring Rust errors
  clearScreen: false,

  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? { protocol: "ws", host, port: 1421 }
      : undefined,
    watch: {
      // Don't watch the Rust source files
      ignored: ["**/src-tauri/**"],
    },
  },

  // Env vars exposed to the frontend
  envPrefix: ["VITE_", "TAURI_ENV_*"],

  build: {
    // Tauri on Windows supports Chromium ≥ 105
    target: process.env.TAURI_ENV_PLATFORM === "windows"
      ? "chrome105"
      : "safari13",
    minify: !process.env.TAURI_ENV_DEBUG ? "esbuild" : false,
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
  },
});
