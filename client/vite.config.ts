import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import mkcert from 'vite-plugin-mkcert'
import path from "path";
import tailwindcss from '@tailwindcss/vite'
import fs from "fs";

export default defineConfig({
  plugins: [react(), wasm(), topLevelAwait(), mkcert(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
