import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * Shared DIYAR catalog hot-path scenario for staged load profiles.
 * Env:
 *   BASE_URL — API root (default http://127.0.0.1:8000/api/v1)
 *   PROFILE  — baseline | 100 | 500 | 1000 | 5000 | 10000 | 25000
 */
const baseUrl = __ENV.BASE_URL || 'http://127.0.0.1:8000/api/v1';
const profile = __ENV.PROFILE || 'baseline';

const profiles = {
  baseline: {
    stages: [
      { duration: '15s', target: 10 },
      { duration: '30s', target: 10 },
      { duration: '10s', target: 0 },
    ],
    thresholds: {
      http_req_failed: ['rate<0.02'],
      http_req_duration: ['p(95)<800', 'p(99)<1500'],
    },
  },
  100: {
    stages: [
      { duration: '30s', target: 50 },
      { duration: '1m', target: 100 },
      { duration: '30s', target: 0 },
    ],
    thresholds: {
      http_req_failed: ['rate<0.03'],
      http_req_duration: ['p(95)<1200', 'p(99)<2500'],
    },
  },
  500: {
    stages: [
      { duration: '1m', target: 250 },
      { duration: '2m', target: 500 },
      { duration: '1m', target: 0 },
    ],
    thresholds: {
      http_req_failed: ['rate<0.05'],
      http_req_duration: ['p(95)<2000', 'p(99)<4000'],
    },
  },
  1000: {
    stages: [
      { duration: '2m', target: 500 },
      { duration: '3m', target: 1000 },
      { duration: '1m', target: 0 },
    ],
    thresholds: {
      http_req_failed: ['rate<0.08'],
      http_req_duration: ['p(95)<3000', 'p(99)<6000'],
    },
  },
  5000: {
    stages: [
      { duration: '3m', target: 2500 },
      { duration: '5m', target: 5000 },
      { duration: '2m', target: 0 },
    ],
    thresholds: {
      http_req_failed: ['rate<0.10'],
      http_req_duration: ['p(95)<5000', 'p(99)<10000'],
    },
  },
  10000: {
    stages: [
      { duration: '5m', target: 5000 },
      { duration: '5m', target: 10000 },
      { duration: '2m', target: 0 },
    ],
    thresholds: {
      http_req_failed: ['rate<0.12'],
      http_req_duration: ['p(95)<8000', 'p(99)<15000'],
    },
  },
  25000: {
    stages: [
      { duration: '5m', target: 10000 },
      { duration: '10m', target: 25000 },
      { duration: '3m', target: 0 },
    ],
    thresholds: {
      http_req_failed: ['rate<0.15'],
      http_req_duration: ['p(95)<12000', 'p(99)<25000'],
    },
  },
};

const selected = profiles[profile] || profiles.baseline;

export const options = {
  stages: selected.stages,
  thresholds: selected.thresholds,
};

export default function catalogHotPath() {
  const health = http.get(`${baseUrl}/health`);
  check(health, {
    'health 200': (r) => r.status === 200,
  });

  const search = http.get(
    `${baseUrl}/catalog/search?q=%D9%83%D9%86%D8%A8&type=products&per_page=12`,
  );
  check(search, {
    'search 200': (r) => r.status === 200,
    'search success': (r) => r.json('success') === true,
  });

  const products = http.get(`${baseUrl}/products?per_page=12`);
  check(products, {
    'products 200': (r) => r.status === 200,
  });

  sleep(0.3);
}

export function handleSummary(data) {
  const p50 = data.metrics.http_req_duration?.values?.med ?? 0;
  const p95 = data.metrics.http_req_duration?.values?.['p(95)'] ?? 0;
  const p99 = data.metrics.http_req_duration?.values?.['p(99)'] ?? 0;
  const rps = data.metrics.http_reqs?.values?.rate ?? 0;
  const failed = data.metrics.http_req_failed?.values?.rate ?? 0;

  const lines = [
    `DIYAR k6 profile: ${profile}`,
    `RPS: ${rps.toFixed(2)}`,
    `p50: ${p50.toFixed(2)}ms`,
    `p95: ${p95.toFixed(2)}ms`,
    `p99: ${p99.toFixed(2)}ms`,
    `error rate: ${(failed * 100).toFixed(2)}%`,
  ];

  if (profile === '25000') {
    lines.push('25K profile executed — verify infrastructure tier before claiming production capacity.');
  } else if (['5000', '10000'].includes(profile)) {
    lines.push('High-VU profile — requires staging-grade infrastructure.');
  }

  return { stdout: lines.join('\n') };
}
