import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const frontendRoot = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(frontendRoot, '..');

export default defineConfig({
  root: frontendRoot,
  cacheDir: path.resolve(frontendRoot, 'node_modules/.vite'),
  plugins: [react(), tailwindcss()],
  resolve: {
    dedupe: ['react', 'react-dom', 'react-router', 'react-router-dom'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined;
          }

          if (id.includes('react-dom') || id.includes('/react/')) {
            return 'vendor-react';
          }

          if (id.includes('@tanstack/react-query')) {
            return 'vendor-query';
          }

          if (id.includes('react-router')) {
            return 'vendor-router';
          }

          if (id.includes('lucide-react')) {
            return 'vendor-icons';
          }

          if (id.includes('laravel-echo') || id.includes('pusher-js')) {
            return 'vendor-realtime';
          }

          if (id.includes('recharts')) {
            return 'vendor-recharts';
          }

          if (id.includes('sweetalert2')) {
            return 'vendor-sweetalert2';
          }

          if (id.includes('framer-motion')) {
            return 'vendor-motion';
          }

          return undefined;
        },
      },
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/sanctum': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/broadcasting': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/app': {
        target: 'http://localhost:8090',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      '/storage': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
    watch: {
      ignored: [
        path.join(repoRoot, 'backend/**'),
        path.join(repoRoot, 'conception/**'),
        path.join(repoRoot, '.git/**'),
        '**/node_modules/**',
      ],
    },
  },
  preview: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/sanctum': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/broadcasting': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/app': {
        target: 'http://localhost:8090',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      '/storage': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
