import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.ico",
        "robots.txt",
        "images/app-icon.svg",
        "images/logo-full.png",
      ],
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
      manifest: {
        name: "Coesco",
        short_name: "Coesco",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#2563eb",
        icons: [
          {
            src: "/images/app-icon.svg",
            sizes: "any",
            type: "image/svg+xml",
          },
          {
            src: "/images/logo-full.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/images/logo-full.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/images/app-icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "maskable",
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
    }),
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
    sourcemap: "hidden",
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
