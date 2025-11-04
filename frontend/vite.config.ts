import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [{ find: "@", replacement: path.resolve(__dirname, "src") }],
  },
  server: {
    proxy: {
      "/api": {
        target: "http://0.0.0.0:8021",
        changeOrigin: true,
      },
      "/admin": {
        target: "http://0.0.0.0:8021",
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React ecosystem
          react: ['react', 'react-dom'],
          // Router
          router: ['react-router-dom'],
          // UI library
          mui: ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          // Form handling
          forms: ['react-hook-form', '@hookform/resolvers', 'yup'],
          // API & State
          query: ['@tanstack/react-query', 'axios'],
          // Utilities
          utils: ['lodash'],
        },
      },
    },
  },
});
