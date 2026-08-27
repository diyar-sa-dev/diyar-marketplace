import http from 'k6/http';
import { check, sleep } from 'k6';
import { apiParams, checkOk, safeJson } from './common.js';

/**
 * Stage 28.7 — Mixed workload using endpoints verified on Octane+MySQL8 stack.
 * Excludes GET /products (500: missing bcmath/bcadd in Docker image — env limit).
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
  },
  100: {
    stages: [
      { duration: '30s', target: 50 },
      { duration: '1m', target: 100 },
      { duration: '30s', target: 0 },
    ],
  },
};

const selected = profiles[profile] || profiles.baseline;

export const options = {
  stages: selected.stages,
  thresholds: {
    http_req_failed: ['rate<0.05'],
  },
};

export default function stage28Workload() {
  const params = apiParams('stage28');
  const roll = __ITER % 100;

  if (roll < 35) {
    const search = http.get(
      `${baseUrl}/catalog/search?q=sofa&type=products&per_page=12`,
      params,
    );
    check(search, {
      search: (r) => checkOk(r) && safeJson(r, 'success') === true,
    });
  } else if (roll < 50) {
    const cats = http.get(`${baseUrl}/categories`, params);
    check(cats, { categories: (r) => checkOk(r) });
  } else if (roll < 65) {
    const services = http.get(`${baseUrl}/services?per_page=12`, params);
    check(services, { services: (r) => checkOk(r) });
  } else if (roll < 75) {
    const vendors = http.get(`${baseUrl}/vendors`, params);
    check(vendors, { vendors: (r) => checkOk(r) });
  } else if (roll < 85) {
    const health = http.get(`${baseUrl}/health`, params);
    check(health, {
      health: (r) => checkOk(r) && safeJson(r, 'data.status') === 'ok',
    });
  } else {
    const search = http.get(
      `${baseUrl}/catalog/search?q=chair&type=products&per_page=12`,
      params,
    );
    check(search, { search2: (r) => checkOk(r) });
  }

  sleep(0.2);
}

export function handleSummary(data) {
  const summary = {
    captured_at_utc: new Date().toISOString(),
    profile: `stage28-workload/${profile}`,
    note: 'Excludes GET /products — bcadd missing in Octane Docker image (PERF env limit).',
    rps: data.metrics.http_reqs?.values?.rate ?? 0,
    p50_ms: data.metrics.http_req_duration?.values?.med ?? 0,
    p95_ms: data.metrics.http_req_duration?.values?.['p(95)'] ?? 0,
    p99_ms: data.metrics.http_req_duration?.values?.['p(99)'] ?? 0,
    error_rate: data.metrics.http_req_failed?.values?.rate ?? 0,
    iterations: data.metrics.iterations?.values?.count ?? 0,
  };

  return {
    stdout: JSON.stringify(summary, null, 2),
    'k6-stage28-summary.json': JSON.stringify(summary, null, 2),
  };
}
