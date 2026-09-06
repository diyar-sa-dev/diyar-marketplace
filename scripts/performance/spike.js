import http from 'k6/http';
import { check, sleep } from 'k6';
import { apiParams, checkOk, safeJson } from './common.js';

/**
 * Stage 28.7 — Controlled spike: 10 → 50 → 100 VUs on catalog paths.
 */
const baseUrl = __ENV.BASE_URL || 'http://127.0.0.1:8000/api/v1';
const peak = parseInt(__ENV.SPIKE_PEAK || '100', 10);

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 10 },
    { duration: '15s', target: 50 },
    { duration: '45s', target: 50 },
    { duration: '15s', target: peak },
    { duration: '45s', target: peak },
    { duration: '30s', target: 10 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.20'],
  },
};

export default function spike() {
  const params = apiParams('spike');
  const roll = __ITER % 100;

  if (roll < 40) {
    const search = http.get(
      `${baseUrl}/catalog/search?q=%D9%83%D9%86%D8%A8&type=products&per_page=12`,
      params,
    );
    check(search, { 'search': (r) => checkOk(r) });
  } else if (roll < 55) {
    const products = http.get(`${baseUrl}/products?per_page=12`, params);
    check(products, { 'products': (r) => checkOk(r) });
  } else if (roll < 65) {
    const cats = http.get(`${baseUrl}/categories`, params);
    check(cats, { 'categories': (r) => checkOk(r) });
  } else if (roll < 75) {
    const services = http.get(`${baseUrl}/services?per_page=12`, params);
    check(services, { 'services': (r) => checkOk(r) });
  } else if (roll < 85) {
    const health = http.get(`${baseUrl}/health`, params);
    check(health, { 'health': (r) => checkOk(r) });
  } else {
    const vendors = http.get(`${baseUrl}/vendors`, params);
    check(vendors, { 'vendors': (r) => checkOk(r) });
  }

  sleep(0.2);
}

export function handleSummary(data) {
  const summary = {
    captured_at_utc: new Date().toISOString(),
    profile: `spike 10→50→${peak}→10`,
    p50_ms: data.metrics.http_req_duration?.values?.med ?? 0,
    p95_ms: data.metrics.http_req_duration?.values?.['p(95)'] ?? 0,
    p99_ms: data.metrics.http_req_duration?.values?.['p(99)'] ?? 0,
    rps: data.metrics.http_reqs?.values?.rate ?? 0,
    error_rate: data.metrics.http_req_failed?.values?.rate ?? 0,
  };

  return {
    stdout: JSON.stringify(summary, null, 2),
    'k6-spike-summary.json': JSON.stringify(summary, null, 2),
  };
}
