import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import history from 'connect-history-api-fallback';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    middlewareMode: false, // important to allow fallback to work
    fs: {
      allow: ["."],
    },
    // Use configureServer for SPA fallback
    configureServer(server) {
      server.middlewares.use(history());
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // 👇 Tell Vite to fallback to index.html for client-side routes
  // This will solve your reload / direct access issues
  build: {
    rollupOptions: {
      input: "./index.html",
    },
  },
  // Only needed if you're using Vite with a custom backend
  preview: {
    middlewareMode: true,
    configureServer(server) {
      server.middlewares.use(history());
    },
  },
}));
