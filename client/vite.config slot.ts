import svgx from "@svgx/vite-plugin-react";
import react from "@vitejs/plugin-react";
import { dirname } from "path";
import { defineConfig } from "vite";
import topLevelAwait from "vite-plugin-top-level-await";
import wasm from "vite-plugin-wasm";
import fs from "fs";
import path from "path";

export default defineConfig({
    plugins: [react() , wasm(), topLevelAwait(), svgx()],
    build: {
      outDir: 'dist',
    },
    server: {
      https: {
        key: fs.readFileSync(path.resolve(__dirname, "localhost+1-key.pem")),
        cert: fs.readFileSync(path.resolve(__dirname, "localhost+1-cert.pem")),
      },
    },
});
