import http from 'k6/http';
import { check, sleep } from 'k6';
import { apiParams, checkOk, safeJson } from './common.js';

/**
 * Stage 28.7 — Stepped concurrency matrix (catalog hot path).
 * Env: BASE_URL, PEAK_VUS (default 50)
 */
const baseUrl = __ENV.BASE_URL || 'http://127.0.0.1:8000/api/v1';
const peak = parseInt(__ENV.PEAK_VUS || '50', 10);

const levels = [1, 5, 10, 25, Math.min(50, peak), Math.min(100, peak)].filter(
  (v, i, arr) => arr.indexOf(v) === i && v <= peak,
);

const stages = [];
for (const level of levels) {
  stages.push({ duration: '20s', target: level });
  stages.push({ duration: '30s', target: level });
}
stages.push({ duration: '15s', target: 0 });

export const options = {
  stages,
  thresholds: {
    http_req_failed: ['rate<0.15'],
  },
};

export default function concurrencyMatrix() {
  const params = apiParams('concurrency');

  const products = http.get(`${baseUrl}/products?per_page=12`, params);
  check(products, { 'products ok': (r) => checkOk(r) });

  if (__ITER % 3 === 0) {
    const search = http.get(
      `${baseUrl}/catalog/search?q=%D9%83%D9%86%D8%A8&type=products&per_page=12`,
      params,
    );
    check(search, { 'search ok': (r) => checkOk(r) && safeJson(r, 'success') === true });
  }

  sleep(0.25);
}

export function handleSummary(data) {
  const summary = {
    captured_at_utc: new Date().toISOString(),
    profile: `concurrency-matrix peak=${peak}`,
    metrics: {
      rps: data.metrics.http_reqs?.values?.rate ?? 0,
      p50_ms: data.metrics.http_req_duration?.values?.med ?? 0,
      p95_ms: data.metrics.http_req_duration?.values?.['p(95)'] ?? 0,
      p99_ms: data.metrics.http_req_duration?.values?.['p(99)'] ?? 0,
      error_rate: data.metrics.http_req_failed?.values?.rate ?? 0,
      iterations: data.metrics.iterations?.values?.count ?? 0,
    },
    concurrency_levels: levels,
    note: 'Stepped VU profile — compare p95 drift across stages in k6 JSON export.',
  };

  return {
    stdout: JSON.stringify(summary, null, 2),
    'k6-concurrency-summary.json': JSON.stringify(summary, null, 2),
  };
}
