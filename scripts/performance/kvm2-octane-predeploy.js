import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { apiParams, checkOk, safeJson } from './common.js';

/**
 * KVM2 pre-deploy stress: Octane API in Docker + Vite (npm run dev) as the Vercel stand-in.
 *
 * PROFILE:
 *   vu10|vu100|vu1000|vu10000     concurrent users (constant-vus)
 *   burst10|burst100|burst1000|burst10000  same-time in-flight requests
 *   rps10|rps100|rps1000|rps10000  constant arrival-rate (RPS); RPM = RPS * 60
 *
 * Env: BASE_URL, FRONTEND_URL, FRONTEND_ORIGIN, PROFILE
 */
const baseUrl = (__ENV.BASE_URL || 'http://127.0.0.1:8093/api/v1').replace(/\/$/, '');
const frontendUrl = (__ENV.FRONTEND_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const frontendOrigin = __ENV.FRONTEND_ORIGIN || 'http://127.0.0.1:3000';
const profile = __ENV.PROFILE || 'vu10';

const searchDuration = new Trend('search_duration', true);
const frontendDuration = new Trend('frontend_duration', true);
const http429 = new Counter('http_429');
const http5xx = new Counter('http_5xx');
const searchOk = new Rate('search_ok');

const queries = [
  '%D8%B3%D8%B1%D9%8A%D8%B1',
  '%D8%AA%D8%B5%D9%85%D9%8A%D9%85',
  '%D9%83%D9%86%D8%A8',
  'bedroom',
];

function storefrontParams(tag) {
  const params = apiParams(tag);
  params.headers['Accept-Language'] = 'ar';
  params.headers.Origin = frontendOrigin;
  params.headers.Referer = `${frontendOrigin}/search`;

  return params;
}

function recordStatus(res) {
  if (!res) {
    http5xx.add(1);
    return;
  }
  if (res.status === 429) {
    http429.add(1);
  } else if (res.status >= 500) {
    http5xx.add(1);
  }
}

const profiles = {
  vu10: {
    scenarios: { users: { executor: 'constant-vus', vus: 10, duration: '40s' } },
    thresholds: {
      'http_req_failed{surface:octane}': ['rate<0.02'],
      'http_req_duration{surface:octane}': ['p(95)<800'],
    },
  },
  vu100: {
    scenarios: { users: { executor: 'constant-vus', vus: 100, duration: '45s' } },
    thresholds: {
      'http_req_failed{surface:octane}': ['rate<0.05'],
      'http_req_duration{surface:octane}': ['p(95)<2000'],
    },
  },
  vu1000: {
    scenarios: {
      users: {
        executor: 'ramping-vus',
        startVUs: 100,
        stages: [
          { duration: '20s', target: 500 },
          { duration: '30s', target: 1000 },
          { duration: '10s', target: 0 },
        ],
        gracefulRampDown: '5s',
      },
    },
    thresholds: {
      'http_req_failed{surface:octane}': [
        { threshold: 'rate<0.15', abortOnFail: true, delayAbortEval: '20s' },
      ],
      'http_req_duration{surface:octane}': ['p(95)<5000'],
    },
  },
  vu10000: {
    scenarios: {
      users: {
        executor: 'ramping-vus',
        startVUs: 200,
        stages: [
          { duration: '20s', target: 2000 },
          { duration: '20s', target: 10000 },
          { duration: '10s', target: 0 },
        ],
        gracefulRampDown: '5s',
      },
    },
    thresholds: {
      'http_req_failed{surface:octane}': [
        { threshold: 'rate<0.40', abortOnFail: true, delayAbortEval: '15s' },
      ],
    },
  },
  burst10: burst(10),
  burst100: burst(100),
  burst1000: burst(1000),
  burst10000: burst(10000),
  rps10: arrival(10, '40s', 20, 40),
  rps100: arrival(100, '40s', 120, 250),
  rps1000: arrival(1000, '30s', 400, 1200),
  rps10000: arrival(10000, '15s', 800, 4000),
};

function burst(count) {
  return {
    scenarios: {
      same_time: {
        executor: 'shared-iterations',
        vus: count,
        iterations: count,
        maxDuration: '45s',
      },
    },
    thresholds: {
      'http_req_failed{surface:octane}': ['rate<0.25'],
    },
  };
}

function arrival(rate, duration, preAllocatedVUs, maxVUs) {
  return {
    scenarios: {
      arrival: {
        executor: 'constant-arrival-rate',
        rate,
        timeUnit: '1s',
        duration,
        preAllocatedVUs,
        maxVUs,
      },
    },
    thresholds: {
      'http_req_failed{surface:octane}': [
        { threshold: 'rate<0.20', abortOnFail: rate >= 1000, delayAbortEval: '10s' },
      ],
    },
  };
}

const selected = profiles[profile] || profiles.vu10;

export const options = {
  scenarios: selected.scenarios,
  thresholds: selected.thresholds,
  summaryTrendStats: ['avg', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
};

export default function kvm2Predeploy() {
  const q = queries[__ITER % queries.length];
  const api = storefrontParams('api');
  const isBurst = profile.startsWith('burst');
  const hitFrontend = __ENV.HIT_FRONTEND === '1' && !isBurst && __ITER % 4 === 0;

  if (hitFrontend) {
    const page = http.get(`${frontendUrl}/search?q=${q}`, {
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'ar',
      },
      tags: { name: 'frontend-search-page', surface: 'vite' },
      timeout: '30s',
    });
    frontendDuration.add(page.timings.duration);
    recordStatus(page);
    check(page, { 'vite search html': (r) => r.status === 200 });
  }

  const search = http.get(`${baseUrl}/catalog/search?q=${q}&type=all&per_page=12`, {
    ...api,
    tags: { name: 'catalog-search', surface: 'octane' },
  });
  searchDuration.add(search.timings.duration);
  recordStatus(search);
  const ok = checkOk(search) && safeJson(search, 'success') === true;
  searchOk.add(ok);
  check(search, { 'catalog search': () => ok });

  if (!isBurst && __ITER % 3 === 0) {
    const suggestions = http.get(`${baseUrl}/catalog/search/suggestions?q=${q}`, {
      ...storefrontParams('suggestions'),
      tags: { name: 'search-suggestions', surface: 'octane' },
    });
    recordStatus(suggestions);
    check(suggestions, { suggestions: (r) => checkOk(r) });
  }

  if (!isBurst && __ITER % 5 === 0) {
    const filters = http.get(
      `${baseUrl}/catalog/search/filter-suggestions?type=products&category_slug=bedroom`,
      {
        ...storefrontParams('filters'),
        tags: { name: 'filter-suggestions', surface: 'octane' },
      },
    );
    recordStatus(filters);
    check(filters, { 'filter suggestions': (r) => checkOk(r) || r.status === 200 });
  }

  if (!isBurst && __ITER % 7 === 0) {
    const live = http.get(`${baseUrl}/health/live`, {
      ...storefrontParams('health'),
      tags: { name: 'health-live', surface: 'octane' },
    });
    recordStatus(live);
    check(live, { 'health live': (r) => checkOk(r) });
  }

  if (!isBurst) {
    sleep(0.2 + Math.random() * 0.4);
  }
}

export function handleSummary(data) {
  const rps = data.metrics.http_reqs?.values?.rate ?? 0;
  const failed = data.metrics.http_req_failed?.values?.rate ?? 0;
  const summary = {
    profile,
    timestamp_utc: new Date().toISOString(),
    target: {
      api: baseUrl,
      frontend: frontendUrl,
      origin: frontendOrigin,
    },
    rps,
    rpm: rps * 60,
    p50_ms: data.metrics.http_req_duration?.values?.med ?? 0,
    p95_ms: data.metrics.http_req_duration?.values?.['p(95)'] ?? 0,
    p99_ms: data.metrics.http_req_duration?.values?.['p(99)'] ?? 0,
    search_p95_ms: data.metrics.search_duration?.values?.['p(95)'] ?? 0,
    frontend_p95_ms: data.metrics.frontend_duration?.values?.['p(95)'] ?? 0,
    error_rate: failed,
    http_429: data.metrics.http_429?.values?.count ?? 0,
    http_5xx: data.metrics.http_5xx?.values?.count ?? 0,
    iterations: data.metrics.iterations?.values?.count ?? 0,
    vus_max: data.metrics.vus_max?.values?.max ?? 0,
  };

  const lines = [
    `DIYAR Octane/KVM2 pre-deploy  profile=${profile}`,
    `RPS=${rps.toFixed(2)}  RPM=${summary.rpm.toFixed(0)}`,
    `p50=${summary.p50_ms.toFixed(0)}ms  p95=${summary.p95_ms.toFixed(0)}ms  p99=${summary.p99_ms.toFixed(0)}ms`,
    `search_p95=${summary.search_p95_ms.toFixed(0)}ms  vite_p95=${summary.frontend_p95_ms.toFixed(0)}ms`,
    `errors=${(failed * 100).toFixed(2)}%  429=${summary.http_429}  5xx=${summary.http_5xx}`,
  ];

  return {
    stdout: `${lines.join('\n')}\n`,
    '/reports/summary.json': JSON.stringify(summary, null, 2),
  };
}
