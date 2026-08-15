import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const frontendRoot = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(frontendRoot, '..');

export default defineConfig({
  root: frontendRoot,
  // Keep Vite cache inside frontend/ — never at monorepo root
  cacheDir: path.resolve(frontendRoot, 'node_modules/.vite'),
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    watch: {
      // Monorepo + OneDrive: do not watch Laravel backend or docs
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
  },
});
