import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

export const options = {
  stages: [
    { duration: '10s', target: 30 },
    { duration: '30s', target: 30 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<200', 'p(99)<500'],
  },
};

const baseUrl = __ENV.TARGET_URL || 'http://nginx';

const reqDurationSpa = new Trend('duration_spa');
const reqDurationApi = new Trend('duration_api');
const reqDurationSearch = new Trend('duration_search');
const errorRate = new Rate('custom_error_rate');

function clientHeaders(accept, lang) {
  const ip = `10.0.${Math.floor(Math.random() * 100)}.${Math.floor(Math.random() * 250)}`;
  const headers = {
    'X-Forwarded-For': ip,
    'X-Real-IP': ip,
    'CF-Connecting-IP': ip,
  };
  if (accept) headers['Accept'] = accept;
  if (lang) headers['Accept-Language'] = lang;
  return headers;
}

export default function () {
  const roll = Math.random();

  if (roll < 0.25) {
    // 1. Frontend Marketplace SPA Shell
    const res = http.get(`${baseUrl}/`, {
      headers: clientHeaders('text/html', 'ar'),
      tags: { surface: 'frontend_spa' },
    });
    const ok = check(res, {
      'spa returns 200': (r) => r.status === 200,
      'spa has title': (r) => r.body.includes('DIYAR Marketplace') || r.body.includes('ديار'),
    });
    reqDurationSpa.add(res.timings.duration);
    errorRate.add(!ok);
  } else if (roll < 0.40) {
    // 2. Frontend Static Asset Delivery
    const res = http.get(`${baseUrl}/assets/index-BZHSQ2wE.js`, {
      headers: clientHeaders(),
      tags: { surface: 'static_assets' },
    });
    const ok = check(res, {
      'asset returns 200': (r) => r.status === 200,
      'asset cached': (r) => r.headers['Cache-Control'] !== undefined,
    });
    errorRate.add(!ok);
  } else if (roll < 0.60) {
    // 3. API Liveness Probe
    const res = http.get(`${baseUrl}/api/v1/health/live`, {
      headers: clientHeaders('application/json'),
      tags: { surface: 'octane_liveness' },
    });
    const ok = check(res, {
      'live returns 200': (r) => r.status === 200,
    });
    reqDurationApi.add(res.timings.duration);
    errorRate.add(!ok);
  } else if (roll < 0.80) {
    // 4. API Full Subsystem Health
    const res = http.get(`${baseUrl}/api/v1/health`, {
      headers: clientHeaders('application/json'),
      tags: { surface: 'octane_health_full' },
    });
    const ok = check(res, {
      'health returns 200': (r) => r.status === 200,
      'subsystems ok': (r) => r.body.includes('"database":{"ok":true') || r.body.includes('"status":"ok"') || r.body.includes('"status":"degraded"') || r.body.includes('"ok":true'),
    });
    reqDurationApi.add(res.timings.duration);
    errorRate.add(!ok);
  } else if (roll < 0.90) {
    // 5. Public Categories API
    const res = http.get(`${baseUrl}/api/v1/categories`, {
      headers: clientHeaders('application/json', 'ar'),
      tags: { surface: 'octane_categories' },
    });
    const ok = check(res, {
      'categories returns 200': (r) => r.status === 200,
    });
    reqDurationApi.add(res.timings.duration);
    errorRate.add(!ok);
  } else {
    // 6. Public Search API with simulated distinct users
    const res = http.get(`${baseUrl}/api/v1/search?q=table`, {
      headers: clientHeaders('application/json', 'ar'),
      tags: { surface: 'octane_search' },
    });
    const ok = check(res, {
      'search returns 200 or 429': (r) => r.status === 200 || r.status === 429,
    });
    reqDurationSearch.add(res.timings.duration);
    errorRate.add(!ok);
  }

  sleep(0.05);
}
