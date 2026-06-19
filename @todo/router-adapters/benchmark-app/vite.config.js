import { defineConfig } from "vite";

// Frontend dev server (5173) proxies /api → the Node backend (3001) that owns lowdb + the scan.
export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
});
