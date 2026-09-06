import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

const frontendRoot = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(frontendRoot, '..');
const cdnBase = process.env.VITE_CDN_BASE_URL?.replace(/\/$/, '');
/** Local prod stack: scripts/local/start-frontend-prod-api.ps1 sets this to http://<LAN-IP>:8093 */
const apiProxyTarget = process.env.DIYAR_API_PROXY_TARGET?.replace(/\/$/, '') ?? 'http://localhost:8000';
const reverbProxyTarget =
  process.env.DIYAR_REVERB_PROXY_TARGET?.replace(/\/$/, '') ?? apiProxyTarget;

function apiProxyOptions() {
  return {
    target: apiProxyTarget,
    changeOrigin: true,
    secure: false,
  };
}

/** Reverb WebSocket lives at `/app/{key}` — proxy only that prefix, not `/app-mockup.png`. */
function reverbProxyOptions(target: string) {
  return {
    target,
    changeOrigin: true,
    secure: false,
    ws: true,
  };
}

function deliveryPreconnectPlugin(): Plugin {
  return {
    name: 'diyar-delivery-preconnect',
    transformIndexHtml(html) {
      const backendOrigin = process.env.VITE_BACKEND_URL?.replace(/\/$/, '') ?? '';
      const preconnect = backendOrigin
        ? `<link rel="preconnect" href="${backendOrigin}" crossorigin />\n    <link rel="dns-prefetch" href="${backendOrigin}" />`
        : '';

      return html.replace('<!-- diyar-preconnect -->', preconnect);
    },
  };
}

export default defineConfig({
  root: frontendRoot,
  base: cdnBase ? `${cdnBase}/` : '/',
  cacheDir: path.resolve(frontendRoot, 'node_modules/.vite'),
  plugins: [react(), tailwindcss(), deliveryPreconnectPlugin()],
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
      '/api': apiProxyOptions(),
      '/sanctum': apiProxyOptions(),
      '/broadcasting': apiProxyOptions(),
      '/app/': reverbProxyOptions(reverbProxyTarget),
      '/storage': apiProxyOptions(),
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
      '/api': apiProxyOptions(),
      '/sanctum': apiProxyOptions(),
      '/broadcasting': apiProxyOptions(),
      '/app/': reverbProxyOptions(reverbProxyTarget),
      '/storage': apiProxyOptions(),
    },
  },
});
