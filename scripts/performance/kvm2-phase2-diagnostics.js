import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { apiParams, checkOk, safeJson } from './common.js';

/**
 * KVM2 Phase 2 diagnostics — mixed + isolated endpoint classes.
 * Rate limits ON. Do not change application behavior.
 *
 * Env: BASE_URL, PROFILE, WORKLOAD (mixed|search|products|detail|health), STAGE_DURATION
 */
const baseUrl = (__ENV.BASE_URL || 'http://nginx/api/v1').replace(/\/$/, '');
const profile = __ENV.PROFILE || 'vu5';
const workload = __ENV.WORKLOAD || 'mixed';
const stageDuration = __ENV.STAGE_DURATION || '90s';
const reportDir = (__ENV.REPORT_DIR || 'phase1-2').replace(/[^a-zA-Z0-9._-]/g, '');


const searchDuration = new Trend('search_duration', true);
const productsDuration = new Trend('products_duration', true);
const detailDuration = new Trend('detail_duration', true);
const http429 = new Counter('http_429');
const http5xx = new Counter('http_5xx');
const httpOk = new Rate('http_ok');

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
    httpOk.add(false);
    return;
  }
  if (res.status === 429) http429.add(1);
  else if (res.status >= 500) http5xx.add(1);
  httpOk.add(res.status >= 200 && res.status < 400);
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
  vu5: constantVus(5, '45s'),
  vu10: constantVus(10, stageDuration),
  vu25: constantVus(25, stageDuration),
  vu50: constantVus(50, stageDuration),
  rps25: arrival(25, stageDuration, 20, 60),
  rps50: arrival(50, stageDuration, 40, 120),
  rps75: arrival(75, stageDuration, 60, 160),
  rps100: arrival(100, stageDuration, 80, 200),
  rps125: arrival(125, stageDuration, 100, 240),
  rps150: arrival(150, stageDuration, 120, 280),
  rps200: arrival(200, stageDuration, 150, 360),
  rps250: arrival(250, stageDuration, 180, 450),
  search: constantVus(25, stageDuration),
  products: constantVus(25, stageDuration),
  detail: constantVus(25, stageDuration),
  health: constantVus(10, '30s'),
};

const selected = profiles[profile] || profiles.vu5;

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
      const first = Array.isArray(data) ? data[0] : data?.items?.[0] || data?.data?.[0];
      productId = first?.id ? String(first.id) : '';
    }
  }
  return { productId };
}

export default function kvm2Phase2(data) {
  const productId = data?.productId || '';
  const params = storefrontParams(workload);
  const q = queries[__ITER % queries.length];

  if (workload === 'search' || profile === 'search') {
    const search = http.get(
      `${baseUrl}/catalog/search?q=${q}&type=all&per_page=12&product_page=1&service_page=1`,
      { ...params, tags: { name: 'catalog-search' } },
    );
    searchDuration.add(search.timings.duration);
    recordStatus(search);
    check(search, { search: (r) => checkOk(r) });
  } else if (workload === 'products' || profile === 'products') {
    const products = http.get(`${baseUrl}/products?per_page=12`, { ...params, tags: { name: 'products' } });
    productsDuration.add(products.timings.duration);
    recordStatus(products);
    check(products, { products: (r) => checkOk(r) });
  } else if (workload === 'detail' || profile === 'detail') {
    if (!productId) {
      const products = http.get(`${baseUrl}/products?per_page=1`, params);
      recordStatus(products);
      return;
    }
    const detail = http.get(`${baseUrl}/products/${productId}`, { ...params, tags: { name: 'product-detail' } });
    detailDuration.add(detail.timings.duration);
    recordStatus(detail);
    check(detail, { detail: (r) => checkOk(r) });
  } else if (workload === 'health' || profile === 'health') {
    const health = http.get(`${baseUrl}/health`, { ...params, tags: { name: 'health' } });
    recordStatus(health);
    check(health, { health: (r) => checkOk(r) });
  } else {
    const roll = __ITER % 100;
    if (roll < 40) {
      const search = http.get(
        `${baseUrl}/catalog/search?q=${q}&type=all&per_page=12&product_page=1&service_page=1`,
        { ...params, tags: { name: 'catalog-search' } },
      );
      searchDuration.add(search.timings.duration);
      recordStatus(search);
      check(search, { search: (r) => checkOk(r) });
    } else if (roll < 65) {
      const products = http.get(`${baseUrl}/products?per_page=12`, { ...params, tags: { name: 'products' } });
      productsDuration.add(products.timings.duration);
      recordStatus(products);
      check(products, { products: (r) => checkOk(r) });
    } else if (roll < 80 && productId) {
      const detail = http.get(`${baseUrl}/products/${productId}`, { ...params, tags: { name: 'product-detail' } });
      detailDuration.add(detail.timings.duration);
      recordStatus(detail);
      check(detail, { detail: (r) => checkOk(r) });
    } else if (roll < 90) {
      const cats = http.get(`${baseUrl}/categories?type=product`, params);
      recordStatus(cats);
      check(cats, { categories: (r) => checkOk(r) });
    } else {
      const health = http.get(`${baseUrl}/health`, params);
      recordStatus(health);
      check(health, { health: (r) => checkOk(r) });
    }
  }

  sleep(0.15 + Math.random() * 0.25);
}

export function handleSummary(data) {
  const rps = data.metrics.http_reqs?.values?.rate ?? 0;
  const failed = data.metrics.http_req_failed?.values?.rate ?? 0;
  const summary = {
    profile,
    workload,
    timestamp_utc: new Date().toISOString(),
    stage_duration: stageDuration,
    base_url: baseUrl,
    rps,
    requested_rps: profile.startsWith('rps') ? Number(profile.replace('rps', '')) : null,
    p50_ms: data.metrics.http_req_duration?.values?.med ?? 0,
    p95_ms: data.metrics.http_req_duration?.values?.['p(95)'] ?? 0,
    p99_ms: data.metrics.http_req_duration?.values?.['p(99)'] ?? 0,
    search_p95_ms: data.metrics.search_duration?.values?.['p(95)'] ?? 0,
    products_p95_ms: data.metrics.products_duration?.values?.['p(95)'] ?? 0,
    detail_p95_ms: data.metrics.detail_duration?.values?.['p(95)'] ?? 0,
    error_rate: failed,
    http_429: data.metrics.http_429?.values?.count ?? 0,
    http_5xx: data.metrics.http_5xx?.values?.count ?? 0,
    iterations: data.metrics.iterations?.values?.count ?? 0,
    vus_max: data.metrics.vus_max?.values?.max ?? 0,
  };
  return {
    stdout: `${JSON.stringify(summary)}\n`,
    [`/reports/${reportDir}/summary-${profile}.json`]: JSON.stringify(summary, null, 2),
  };
}
