import path from 'node:path';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

const frontendRoot = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(frontendRoot, '..');
const cdnBase = process.env.VITE_CDN_BASE_URL?.replace(/\/$/, '');
/** Local prod stack: scripts/local/start-frontend-prod-api.ps1 sets this to http://<LAN-IP>:8093 */
const apiProxyTarget = process.env.DIYAR_API_PROXY_TARGET?.replace(/\/$/, '') ?? 'http://localhost:8093';
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

function seoStaticFilesPlugin(): Plugin {
  const siteUrl = (process.env.VITE_SITE_URL ?? 'https://diyar.com').replace(/\/$/, '');
  const paths = ['/', '/category/all', '/services', '/blog', '/b2b', '/loyalty'];

  return {
    name: 'diyar-seo-static-files',
    closeBundle() {
      const outDir = path.resolve(frontendRoot, 'dist');
      writeFileSync(
        path.join(outDir, 'robots.txt'),
        ['User-agent: *', 'Allow: /', 'Disallow: /admin', 'Disallow: /dashboard', 'Disallow: /auth', '', `Sitemap: ${siteUrl}/sitemap.xml`, ''].join('\n'),
        'utf8',
      );
      const urls = paths.map((loc) => `  <url>\n    <loc>${siteUrl}${loc}</loc>\n  </url>`).join('\n');
      writeFileSync(
        path.join(outDir, 'sitemap.xml'),
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
        'utf8',
      );
    },
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
      const lcpPreload =
        '<link rel="preload" as="image" href="/hero_1.webp" type="image/webp" fetchpriority="high" imagesizes="100vw" />';

      return html
        .replace('<!-- diyar-preconnect -->', preconnect)
        .replace('<!-- diyar-lcp-preload -->', lcpPreload);
    },
  };
}

export default defineConfig({
  root: frontendRoot,
  base: cdnBase ? `${cdnBase}/` : '/',
  cacheDir: path.resolve(frontendRoot, 'node_modules/.vite'),
  plugins: [react(), tailwindcss(), deliveryPreconnectPlugin(), seoStaticFilesPlugin()],
  resolve: {
    dedupe: ['react', 'react-dom', 'react-router', 'react-router-dom'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/lib/i18n/locales/')) {
            return 'vendor-locale';
          }

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

          if (id.includes('motion') || id.includes('framer-motion')) {
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
    strictPort: true,
    proxy: {
      '/api': apiProxyOptions(),
      '/sanctum': apiProxyOptions(),
      '/broadcasting': apiProxyOptions(),
      '/app/': reverbProxyOptions(reverbProxyTarget),
      '/storage': apiProxyOptions(),
    },
  },
});
