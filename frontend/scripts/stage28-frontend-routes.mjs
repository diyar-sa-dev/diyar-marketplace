#!/usr/bin/env node
/**
 * Stage 28.4 — Frontend route inventory from source.
 * Usage: node scripts/stage28-frontend-routes.mjs [--output=path.json]
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'src');

const routeFiles = [
  'marketplace/StorefrontRoutes.tsx',
  'marketplace/DashboardRoutes.tsx',
  'admin/AdminShell.tsx',
];

const pathRegex = /path=["'`]([^"'`]+)["'`]/g;
const routes = [];

for (const rel of routeFiles) {
  const content = readFileSync(join(src, rel), 'utf8');
  let m;
  while ((m = pathRegex.exec(content)) !== null) {
    routes.push({ file: rel, path: m[1] });
  }
}

const guardPatterns = [
  { name: 'ProtectedRoute', regex: /ProtectedRoute/g },
  { name: 'CustomerProfileRoute', regex: /CustomerProfileRoute/g },
  { name: 'GuestRoute', regex: /GuestRoute/g },
  { name: 'ProtectedAdminRoute', regex: /ProtectedAdminRoute/g },
  { name: 'AdminGuestRoute', regex: /AdminGuestRoute/g },
  { name: 'MarketplaceCommerceRoute', regex: /MarketplaceCommerceRoute/g },
  { name: 'AccountStatusRoute', regex: /AccountStatusRoute/g },
];

function classify(path) {
  if (path.startsWith('/admin')) return 'admin';
  if (path.startsWith('/dashboard')) return 'dashboard';
  if (path.includes('checkout') || path.includes('payment')) return 'checkout';
  if (path.includes('profile') || path.includes('wishlist') || path.includes('orders')) return 'user';
  if (path.includes('b2b')) return 'b2b';
  if (path.includes('blog') || path.includes('project')) return 'cms';
  if (path.includes('service') || path.includes('provider')) return 'services';
  if (path.includes('auth') || path.includes('account')) return 'auth';
  if (path === '/' || path.includes('product') || path.includes('category') || path.includes('search') || path.includes('store')) return 'public_catalog';
  return 'other';
}

const inventory = routes.map((r) => ({
  ...r,
  domain: classify(r.path),
}));

const byDomain = {};
for (const r of inventory) {
  byDomain[r.domain] = (byDomain[r.domain] || 0) + 1;
}

const result = {
  timestamp_utc: new Date().toISOString(),
  total_route_definitions: inventory.length,
  unique_paths: [...new Set(inventory.map((r) => r.path))].length,
  by_domain: byDomain,
  routes: inventory,
  guard_usage: guardPatterns.map((g) => ({
    guard: g.name,
    count: routeFiles.reduce((sum, f) => {
      const c = readFileSync(join(src, f), 'utf8');
      return sum + (c.match(g.regex)?.length || 0);
    }, 0),
  })),
};

const outArg = process.argv.find((a) => a.startsWith('--output='));
const json = JSON.stringify(result, null, 2);
if (outArg) {
  writeFileSync(outArg.slice(9), json);
  console.log(`Wrote ${result.total_route_definitions} route defs to ${outArg.slice(9)}`);
} else {
  console.log(json);
}
