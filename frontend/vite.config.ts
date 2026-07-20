import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5002',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: true,
      }
    },
    // lucide-react icon library bundles at ~620KB (155KB gzipped) — this is expected
    chunkSizeWarningLimit: 700,
  }
});
