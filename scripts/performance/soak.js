import http from 'k6/http';
import { check, sleep } from 'k6';
import { apiParams, checkOk } from './common.js';

/**
 * Stage 28.7 — Short soak test (default 10m @ 25 VUs). Adjust via SOAK_MINUTES env.
 */
const baseUrl = __ENV.BASE_URL || 'http://127.0.0.1:8000/api/v1';
const minutes = parseInt(__ENV.SOAK_MINUTES || '10', 10);
const vus = parseInt(__ENV.SOAK_VUS || '25', 10);

export const options = {
  stages: [
    { duration: '1m', target: vus },
    { duration: `${minutes}m`, target: vus },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.10'],
  },
};

export default function soak() {
  const params = apiParams('soak');

  const products = http.get(`${baseUrl}/products?per_page=12`, params);
  check(products, { 'products': (r) => checkOk(r) });

  if (__ITER % 5 === 0) {
    const search = http.get(
      `${baseUrl}/catalog/search?q=%D9%83%D9%86%D8%A8&type=products&per_page=12`,
      params,
    );
    check(search, { 'search': (r) => checkOk(r) });
  }

  sleep(0.5);
}

export function handleSummary(data) {
  return {
    stdout: JSON.stringify(
      {
        captured_at_utc: new Date().toISOString(),
        profile: `soak ${minutes}m @ ${vus} VUs`,
        p50_ms: data.metrics.http_req_duration?.values?.med ?? 0,
        p95_ms: data.metrics.http_req_duration?.values?.['p(95)'] ?? 0,
        p99_ms: data.metrics.http_req_duration?.values?.['p(99)'] ?? 0,
        rps: data.metrics.http_reqs?.values?.rate ?? 0,
        error_rate: data.metrics.http_req_failed?.values?.rate ?? 0,
      },
      null,
      2,
    ),
    'k6-soak-summary.json': JSON.stringify(
      {
        captured_at_utc: new Date().toISOString(),
        minutes,
        vus,
        metrics: data.metrics,
      },
      null,
      2,
    ),
  };
}
