import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },
  server: {
    port: 3000,
    open: true, // abre el navegador automáticamente con `npm run dev`
    // Las llamadas a /api van al servidor de AUDIT LAB (server/index.ts).
    proxy: { '/api': 'http://localhost:3001' },
  },
  preview: {
    port: 4173,
    open: true,
  },
  build: {
    rolldownOptions: {
      output: {
        // React, Motion e íconos van en un archivo aparte que el navegador cachea.
        codeSplitting: {
          groups: [{ name: 'vendor', test: /node_modules[\\/](react|react-dom|scheduler|motion|framer-motion|motion-dom|motion-utils|lucide-react)[\\/]/ }],
        },
      },
    },
  },
});
