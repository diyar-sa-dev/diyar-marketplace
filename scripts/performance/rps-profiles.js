import http from 'k6/http';
import { check, sleep } from 'k6';
import { apiParams, checkOk, safeJson } from './common.js';

/**
 * Sustained RPS profiles for capacity certification.
 * Uses constant-arrival-rate (requests/sec), not VU-only staging.
 *
 * Env:
 *   BASE_URL — API root (default http://127.0.0.1:8000/api/v1)
 *   RPS_PROFILE — rps25 | rps50 | rps100 | rps150 | rps200 | rps278 | soak100
 */
const baseUrl = __ENV.BASE_URL || 'http://127.0.0.1:8000/api/v1';
const profile = __ENV.RPS_PROFILE || 'rps50';

const profiles = {
  rps10: { rate: 10, duration: '1m', preAllocatedVUs: 10, maxVUs: 30 },
  rps25: { rate: 25, duration: '2m', preAllocatedVUs: 20, maxVUs: 60 },
  rps50: { rate: 50, duration: '3m', preAllocatedVUs: 40, maxVUs: 120 },
  rps100: { rate: 100, duration: '3m', preAllocatedVUs: 80, maxVUs: 200 },
  rps150: { rate: 150, duration: '2m', preAllocatedVUs: 120, maxVUs: 300 },
  rps200: { rate: 200, duration: '2m', preAllocatedVUs: 160, maxVUs: 400 },
  rps278: { rate: 278, duration: '5m', preAllocatedVUs: 220, maxVUs: 500 },
  soak100: { rate: 100, duration: '15m', preAllocatedVUs: 80, maxVUs: 200 },
};

const selected = profiles[profile] || profiles.rps50;

export const options = {
  scenarios: {
    catalog_rps: {
      executor: 'constant-arrival-rate',
      rate: selected.rate,
      timeUnit: '1s',
      duration: selected.duration,
      preAllocatedVUs: selected.preAllocatedVUs,
      maxVUs: selected.maxVUs,
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.10'],
    http_req_duration: ['p(95)<2500'],
  },
};

export default function mixedRead() {
  const params = apiParams(`rps-${profile}`);
  const roll = __ITER % 10;

  if (roll === 0) {
    const health = http.get(`${baseUrl}/health`, params);
    check(health, { 'health 200': (r) => checkOk(r) });
  } else if (roll <= 5) {
    const products = http.get(`${baseUrl}/products?per_page=12`, params);
    check(products, { 'products 200': (r) => checkOk(r) });
  } else if (roll <= 8) {
    const search = http.get(
      `${baseUrl}/catalog/search?q=%D9%83%D9%86%D8%A8&type=products&per_page=12`,
      params,
    );
    check(search, { 'search 200': (r) => checkOk(r) });
  } else {
    const categories = http.get(`${baseUrl}/categories`, params);
    check(categories, { 'categories 200': (r) => checkOk(r) });
  }

  sleep(0.05);
}

export function handleSummary(data) {
  const p50 = data.metrics.http_req_duration?.values?.med ?? 0;
  const p95 = data.metrics.http_req_duration?.values?.['p(95)'] ?? 0;
  const p99 = data.metrics.http_req_duration?.values?.['p(99)'] ?? 0;
  const rps = data.metrics.http_reqs?.values?.rate ?? 0;
  const failed = data.metrics.http_req_failed?.values?.rate ?? 0;

  const summary = {
    profile,
    timestamp_utc: new Date().toISOString(),
    rps_actual: rps,
    p50_ms: p50,
    p95_ms: p95,
    p99_ms: p99,
    error_rate: failed,
    server: 'Octane+Swoole (docker-compose.loadtest.yml)',
  };

  return {
    stdout: JSON.stringify(summary, null, 2),
    [`k6-rps-${profile}.json`]: JSON.stringify(summary, null, 2),
  };
}
