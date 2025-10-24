import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: "0.0.0.0",
    port: 5173,
    watch: {
      usePolling: true,
      interval: 1000,
    },
  },
  build: {
    sourcemap: true,
  },
  esbuild: {
    drop: ["console", "debugger"],
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
