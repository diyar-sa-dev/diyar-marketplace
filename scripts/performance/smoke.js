import http from 'k6/http';
import { check, sleep } from 'k6';
import { apiParams, checkOk, safeJson } from './common.js';

/**
 * DIYAR load smoke — measures up to 100 VUs on catalog hot paths.
 * Run against Octane+Swoole (see docker-compose.loadtest.yml).
 */
const baseUrl = __ENV.BASE_URL || 'http://127.0.0.1:8000/api/v1';

export const options = {
  stages: [
    { duration: '20s', target: 10 },
    { duration: '30s', target: 50 },
    { duration: '30s', target: 100 },
    { duration: '20s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<1500', 'p(99)<3000'],
  },
};

export default function smoke() {
  const params = apiParams('smoke');

  if (__ITER % 10 === 0) {
    const health = http.get(`${baseUrl}/health`, params);
    check(health, {
      'health 200': (r) => checkOk(r),
      'health ok': (r) => safeJson(r, 'data.status') === 'ok',
    });
  }

  const search = http.get(
    `${baseUrl}/catalog/search?q=%D9%83%D9%86%D8%A8&type=products&per_page=12`,
    params,
  );
  check(search, {
    'search 200': (r) => checkOk(r),
    'search success': (r) => safeJson(r, 'success') === true,
  });

  const products = http.get(`${baseUrl}/products?per_page=12`, params);
  check(products, {
    'products 200': (r) => checkOk(r),
  });

  sleep(0.3);
}

export function handleSummary(data) {
  const p95 = data.metrics.http_req_duration?.values?.['p(95)'] ?? 0;
  const p99 = data.metrics.http_req_duration?.values?.['p(99)'] ?? 0;
  const rps = data.metrics.http_reqs?.values?.rate ?? 0;

  return {
    stdout: [
      'DIYAR k6 smoke summary',
      `RPS: ${rps.toFixed(2)}`,
      `p95: ${p95.toFixed(2)}ms`,
      `p99: ${p99.toFixed(2)}ms`,
      '25K VUs NOT VERIFIED — smoke profile only.',
    ].join('\n'),
  };
}
