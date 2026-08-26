import http from 'k6/http';
import { check, sleep } from 'k6';
import { authedParams, checkOk, loginSession, safeJson } from './common.js';

/**
 * DIYAR analytics endpoints — measures authenticated admin/vendor/provider analytics p95.
 */
const originUrl = __ENV.ORIGIN_URL || 'http://127.0.0.1:8000';
const baseUrl = __ENV.BASE_URL || 'http://127.0.0.1:8000/api/v1';
const demoPassword = __ENV.E2E_DEMO_PASSWORD || 'Password123!';

export const options = {
  stages: [
    { duration: '15s', target: 5 },
    { duration: '30s', target: 20 },
    { duration: '15s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],
    'http_req_duration{name:admin-funnel}': ['p(95)<800'],
    'http_req_duration{name:vendor-overview}': ['p(95)<800'],
    'http_req_duration{name:provider-overview}': ['p(95)<800'],
  },
};

export function setup() {
  const adminCookie = loginSession(
    originUrl,
    baseUrl,
    '/admin/auth/login',
    {
      method: 'phone',
      identifier: '500000001',
      password: demoPassword,
    },
    'admin',
  );

  const vendorCookie = loginSession(
    originUrl,
    baseUrl,
    '/auth/login',
    {
      method: 'phone',
      identifier: '500000002',
      password: demoPassword,
    },
    'vendor',
  );

  const providerCookie = loginSession(
    originUrl,
    baseUrl,
    '/auth/login',
    {
      method: 'phone',
      identifier: '500000101',
      password: demoPassword,
    },
    'provider',
  );

  return { adminCookie, vendorCookie, providerCookie };
}

export default function analytics(data) {
  const adminParams = authedParams(data.adminCookie, 'admin-funnel');
  const vendorParams = authedParams(data.vendorCookie, 'vendor-overview');
  const providerParams = authedParams(data.providerCookie, 'provider-overview');

  const funnel = http.get(`${baseUrl}/admin/analytics/funnel?period=30d`, adminParams);
  check(funnel, {
    'admin funnel 200': (response) => checkOk(response),
    'admin funnel success': (response) => safeJson(response, 'success') === true,
  });

  const vendorOverview = http.get(`${baseUrl}/dashboard/vendor/analytics/overview?period=30d`, vendorParams);
  check(vendorOverview, {
    'vendor overview 200': (response) => checkOk(response),
    'vendor overview success': (response) => safeJson(response, 'success') === true,
  });

  const providerOverview = http.get(
    `${baseUrl}/dashboard/provider/analytics/overview?period=30d`,
    providerParams,
  );
  check(providerOverview, {
    'provider overview 200': (response) => checkOk(response),
    'provider overview success': (response) => safeJson(response, 'success') === true,
  });

  if (__ITER % 3 === 0) {
    const cohorts = http.get(`${baseUrl}/admin/analytics/cohorts?months=6`, adminParams);
    check(cohorts, {
      'admin cohorts 200': (response) => checkOk(response),
    });
  }

  sleep(0.2);
}

export function handleSummary(data) {
  const overallP95 = data.metrics.http_req_duration?.values?.['p(95)'] ?? 0;
  const overallP99 = data.metrics.http_req_duration?.values?.['p(99)'] ?? 0;
  const rps = data.metrics.http_reqs?.values?.rate ?? 0;

  const tagged = {};
  for (const endpointName of ['admin-funnel', 'vendor-overview', 'provider-overview']) {
    const metric = data.metrics[`http_req_duration{name:${endpointName}}`];
    if (!metric?.values) {
      continue;
    }

    tagged[endpointName] = {
      p95_ms: metric.values['p(95)'] ?? 0,
      p99_ms: metric.values['p(99)'] ?? 0,
      avg_ms: metric.values.avg ?? 0,
    };
  }

  const summary = {
    captured_at_utc: new Date().toISOString(),
    profile: 'analytics-smoke (5→20 VUs, 60s)',
    overall: {
      p95_ms: overallP95,
      p99_ms: overallP99,
      rps,
    },
    endpoints: tagged,
    note: 'Measured in CI via scripts/performance/analytics.js — not a 25K VU production profile.',
  };

  return {
    stdout: [
      'DIYAR k6 analytics summary',
      `Overall p95: ${overallP95.toFixed(2)}ms`,
      `Overall p99: ${overallP99.toFixed(2)}ms`,
      `RPS: ${rps.toFixed(2)}`,
      JSON.stringify(summary, null, 2),
    ].join('\n'),
    'k6-analytics-summary.json': JSON.stringify(summary, null, 2),
  };
}
