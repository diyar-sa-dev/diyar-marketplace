import http from 'k6/http';
import { check, sleep } from 'k6';
import { apiParams, checkOk } from './common.js';

/**
 * Realistic mixed storefront workload (Phase 28.16).
 *
 * Env:
 *   BASE_URL — API root (default http://127.0.0.1:8000/api/v1)
 *   RPS_PROFILE — rps10 | rps25 | rps50 | rps75 | rps100 | soak15
 */
const baseUrl = __ENV.BASE_URL || 'http://127.0.0.1:8000/api/v1';
const profile = __ENV.RPS_PROFILE || 'rps25';

const profiles = {
  rps10: { rate: 10, duration: '2m', preAllocatedVUs: 10, maxVUs: 40 },
  rps25: { rate: 25, duration: '3m', preAllocatedVUs: 25, maxVUs: 80 },
  rps50: { rate: 50, duration: '3m', preAllocatedVUs: 50, maxVUs: 150 },
  rps75: { rate: 75, duration: '2m', preAllocatedVUs: 75, maxVUs: 200 },
  rps100: { rate: 100, duration: '2m', preAllocatedVUs: 100, maxVUs: 250 },
  rps150: { rate: 150, duration: '2m', preAllocatedVUs: 120, maxVUs: 300 },
  rps200: { rate: 200, duration: '2m', preAllocatedVUs: 160, maxVUs: 400 },
  rps278: { rate: 278, duration: '3m', preAllocatedVUs: 220, maxVUs: 500 },
  soak15: { rate: 10, duration: '15m', preAllocatedVUs: 15, maxVUs: 40 },
};

const selected = profiles[profile] || profiles.rps25;

export const options = {
  scenarios: {
    mixed_storefront: {
      executor: 'constant-arrival-rate',
      rate: selected.rate,
      timeUnit: '1s',
      duration: selected.duration,
      preAllocatedVUs: selected.preAllocatedVUs,
      maxVUs: selected.maxVUs,
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
  },
};

export default function mixedStorefront() {
  const params = apiParams(`mixed-${profile}`);
  const roll = __ITER % 100;

  if (roll < 30) {
    const res = http.get(`${baseUrl}/products?per_page=12`, params);
    check(res, { 'catalog products': (r) => checkOk(r) });
  } else if (roll < 45) {
    const res = http.get(
      `${baseUrl}/catalog/search?q=%D9%83%D9%86%D8%A8&type=products&per_page=12`,
      params,
    );
    check(res, { 'search': (r) => checkOk(r) });
  } else if (roll < 55) {
    const res = http.get(`${baseUrl}/categories?type=product`, params);
    check(res, { 'categories': (r) => checkOk(r) });
  } else if (roll < 65) {
    const res = http.get(`${baseUrl}/storefront/home`, params);
    check(res, { 'homepage aggregate': (r) => checkOk(r) });
  } else if (roll < 70) {
    const res = http.get(`${baseUrl}/vendors?per_page=6`, params);
    check(res, { 'vendors': (r) => checkOk(r) });
  } else if (roll < 75) {
    const res = http.get(`${baseUrl}/services?per_page=12`, params);
    check(res, { 'services': (r) => checkOk(r) });
  } else if (roll < 80) {
    const res = http.get(`${baseUrl}/products?per_page=12&page=2`, params);
    check(res, { 'products page 2': (r) => checkOk(r) });
  } else if (roll < 85) {
    const res = http.get(`${baseUrl}/health`, params);
    check(res, { 'health': (r) => checkOk(r) });
  } else if (roll < 90) {
    const res = http.get(`${baseUrl}/blog/articles?per_page=3`, params);
    check(res, { 'blog': (r) => checkOk(r) });
  } else {
    const res = http.get(`${baseUrl}/platform/theme`, params);
    check(res, { 'theme': (r) => checkOk(r) });
  }

  sleep(0.02);
}

export function handleSummary(data) {
  const summary = {
    profile,
    workload: 'mixed-storefront',
    timestamp_utc: new Date().toISOString(),
    rps_actual: data.metrics.http_reqs?.values?.rate ?? 0,
    p50_ms: data.metrics.http_req_duration?.values?.med ?? 0,
    p95_ms: data.metrics.http_req_duration?.values?.['p(95)'] ?? 0,
    p99_ms: data.metrics.http_req_duration?.values?.['p(99)'] ?? 0,
    error_rate: data.metrics.http_req_failed?.values?.rate ?? 0,
  };

  return {
    stdout: JSON.stringify(summary, null, 2),
    [`k6-mixed-${profile}.json`]: JSON.stringify(summary, null, 2),
  };
}
