import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { apiParams, checkOk, safeJson } from './common.js';

/**
 * KVM2-equivalent local validation — mixed DIYAR storefront workload via Nginx → Octane.
 * Rate limits ON (DIYAR_LOADTEST_MODE=false). Do not bypass security.
 *
 * PROFILE examples:
 *   baseline, vu10|vu25|vu50|vu100, rps50|rps100|rps150|rps200|rps250,
 *   vu250|vu500|vu1000, burst100|burst250|burst500|burst1000,
 *   soak75, search-focus
 *
 * Env: BASE_URL, PROFILE, STAGE_DURATION (default 3m), SOAK_DURATION (default 10m), PRODUCT_ID
 */
const baseUrl = (__ENV.BASE_URL || 'http://nginx/api/v1').replace(/\/$/, '');
const profile = __ENV.PROFILE || 'baseline';
const stageDuration = __ENV.STAGE_DURATION || '3m';
const soakDuration = __ENV.SOAK_DURATION || '10m';

const searchDuration = new Trend('search_duration', true);
const http429 = new Counter('http_429');
const http5xx = new Counter('http_5xx');
const searchOk = new Rate('search_ok');

const queries = [
  '%D9%83%D9%86%D8%A8',
  '%D8%B3%D8%B1%D9%8A%D8%B1',
  '%D8%AA%D8%B5%D9%85%D9%8A%D9%85',
  'bedroom',
  'sofa',
];

function storefrontParams(tag) {
  const params = apiParams(tag);
  params.headers['Accept-Language'] = 'ar';
  params.headers.Origin = __ENV.FRONTEND_ORIGIN || 'http://127.0.0.1:8193';
  params.headers.Referer = `${params.headers.Origin}/search`;
  params.tags = { ...(params.tags || {}), surface: 'octane', name: tag };
  return params;
}

function recordStatus(res) {
  if (!res) {
    http5xx.add(1);
    return;
  }
  if (res.status === 429) http429.add(1);
  else if (res.status >= 500) http5xx.add(1);
}

function burst(count) {
  return {
    scenarios: {
      same_time: {
        executor: 'shared-iterations',
        vus: count,
        iterations: count,
        maxDuration: '90s',
      },
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
  };
}

function constantVus(vus, duration) {
  return {
    scenarios: {
      users: { executor: 'constant-vus', vus, duration },
    },
  };
}

const profiles = {
  baseline: constantVus(5, '45s'),
  vu10: constantVus(10, stageDuration),
  vu25: constantVus(25, stageDuration),
  vu50: constantVus(50, stageDuration),
  vu100: constantVus(100, stageDuration),
  vu250: constantVus(250, stageDuration),
  vu500: constantVus(500, stageDuration),
  vu1000: {
    scenarios: {
      users: {
        executor: 'ramping-vus',
        startVUs: 50,
        stages: [
          { duration: '30s', target: 250 },
          { duration: stageDuration, target: 1000 },
          { duration: '20s', target: 0 },
        ],
        gracefulRampDown: '15s',
      },
    },
  },
  rps50: arrival(50, stageDuration, 40, 120),
  rps100: arrival(100, stageDuration, 80, 200),
  rps150: arrival(150, stageDuration, 100, 280),
  rps200: arrival(200, stageDuration, 140, 360),
  rps250: arrival(250, stageDuration, 180, 450),
  rps300: arrival(300, stageDuration, 200, 500),
  rps350: arrival(350, stageDuration, 240, 550),
  rps400: arrival(400, stageDuration, 280, 600),
  rps500: arrival(500, stageDuration, 320, 700),
  burst100: burst(100),
  burst250: burst(250),
  burst500: burst(500),
  burst1000: burst(1000),
  soak75: arrival(75, soakDuration, 80, 220),
  'search-focus': constantVus(40, stageDuration),
};

const selected = profiles[profile] || profiles.baseline;

export const options = {
  scenarios: selected.scenarios,
  thresholds: {
    http_req_failed: [{ threshold: 'rate<0.15', abortOnFail: false }],
  },
  summaryTrendStats: ['avg', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
};

export function setup() {
  const params = {
    headers: { Accept: 'application/json', 'Accept-Language': 'ar' },
    timeout: '60s',
  };
  let productId = __ENV.PRODUCT_ID || '';
  if (!productId) {
    const res = http.get(`${baseUrl}/products?per_page=1`, params);
    if (checkOk(res)) {
      const data = safeJson(res, 'data');
      const first = Array.isArray(data) ? data[0] : data?.data?.[0];
      productId = first?.id ? String(first.id) : '';
    }
  }
  return { productId };
}

export default function kvm2MixedWorkload(data) {
  const productId = data?.productId || '';
  const params = storefrontParams('mixed');
  const roll = __ITER % 100;
  const q = queries[__ITER % queries.length];
  const isBurst = profile.startsWith('burst');
  const searchHeavy = profile === 'search-focus';

  if (searchHeavy || roll < 40) {
    const search = http.get(
      `${baseUrl}/catalog/search?q=${q}&type=all&per_page=12&product_page=1&service_page=1`,
      { ...params, tags: { name: 'catalog-search', surface: 'octane' } },
    );
    searchDuration.add(search.timings.duration);
    recordStatus(search);
    const ok = checkOk(search) && safeJson(search, 'success') === true;
    searchOk.add(ok);
    check(search, { 'catalog search': () => ok });
    if (!isBurst && __ITER % 4 === 0) {
      const sug = http.get(`${baseUrl}/catalog/search/suggestions?q=${q}`, params);
      recordStatus(sug);
      check(sug, { suggestions: (r) => checkOk(r) });
    }
  } else if (roll < 60 && productId) {
    const detail = http.get(`${baseUrl}/products/${productId}`, params);
    recordStatus(detail);
    check(detail, { product: (r) => checkOk(r) });
  } else if (roll < 70) {
    const cart = http.get(`${baseUrl}/cart`, params);
    recordStatus(cart);
    check(cart, { cart: (r) => checkOk(r) || r.status === 401 });
  } else if (roll < 75) {
    const cats = http.get(`${baseUrl}/categories?type=product`, params);
    recordStatus(cats);
    check(cats, { categories: (r) => checkOk(r) });
  } else if (roll < 80) {
    const services = http.get(`${baseUrl}/services?per_page=12`, params);
    recordStatus(services);
    check(services, { services: (r) => checkOk(r) });
  } else if (roll < 85) {
    const home = http.get(`${baseUrl}/storefront/home`, params);
    recordStatus(home);
    check(home, { home: (r) => checkOk(r) });
  } else if (roll < 90) {
    const health = http.get(`${baseUrl}/health`, params);
    recordStatus(health);
    check(health, { health: (r) => checkOk(r) });
  } else if (roll < 95) {
    const filters = http.get(
      `${baseUrl}/catalog/search/filter-suggestions?type=products&q=${q}`,
      params,
    );
    recordStatus(filters);
    check(filters, { filters: (r) => checkOk(r) || r.status === 200 });
  } else {
    const vendors = http.get(`${baseUrl}/vendors?per_page=6`, params);
    recordStatus(vendors);
    check(vendors, { vendors: (r) => checkOk(r) });
  }

  if (!isBurst) {
    sleep(0.15 + Math.random() * 0.35);
  }
}

export function handleSummary(data) {
  const rps = data.metrics.http_reqs?.values?.rate ?? 0;
  const failed = data.metrics.http_req_failed?.values?.rate ?? 0;
  const summary = {
    profile,
    workload: profile === 'search-focus' ? 'search-day29' : 'mixed-storefront',
    timestamp_utc: new Date().toISOString(),
    stage_duration: stageDuration,
    base_url: baseUrl,
    rps,
    rpm: rps * 60,
    p50_ms: data.metrics.http_req_duration?.values?.med ?? 0,
    p95_ms: data.metrics.http_req_duration?.values?.['p(95)'] ?? 0,
    p99_ms: data.metrics.http_req_duration?.values?.['p(99)'] ?? 0,
    search_p95_ms: data.metrics.search_duration?.values?.['p(95)'] ?? 0,
    error_rate: failed,
    http_429: data.metrics.http_429?.values?.count ?? 0,
    http_5xx: data.metrics.http_5xx?.values?.count ?? 0,
    iterations: data.metrics.iterations?.values?.count ?? 0,
    vus_max: data.metrics.vus_max?.values?.max ?? 0,
  };

  const outName = `summary-${profile}.json`;
  return {
    stdout: `${JSON.stringify(summary)}\n`,
    [`/reports/${outName}`]: JSON.stringify(summary, null, 2),
  };
}
