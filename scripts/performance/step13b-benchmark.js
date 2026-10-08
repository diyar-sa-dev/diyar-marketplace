import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';
import { apiParams, checkOk, safeJson } from './common.js';

const baseUrl = (__ENV.BASE_URL || 'http://nginx/api/v1').replace(/\/$/, '');
const mode = __ENV.MODE || 'smoke'; // smoke (5 VU, 10s), moderate (20 VU, 30s), saturation (ramp to 60 VU)

const healthDuration = new Trend('diyar_health_duration', true);
const listDuration = new Trend('diyar_list_duration', true);
const detailDuration = new Trend('diyar_detail_duration', true);
const searchDuration = new Trend('diyar_search_duration', true);
const catDuration = new Trend('diyar_cat_duration', true);
const http5xx = new Counter('diyar_http_5xx');

const modeConfigs = {
  smoke: {
    scenarios: {
      smoke_run: {
        executor: 'constant-vus',
        vus: 5,
        duration: '10s',
      },
    },
  },
  moderate: {
    scenarios: {
      moderate_run: {
        executor: 'constant-vus',
        vus: 20,
        duration: '30s',
      },
    },
  },
  saturation: {
    scenarios: {
      saturation_run: {
        executor: 'ramping-vus',
        startVUs: 10,
        stages: [
          { duration: '15s', target: 30 },
          { duration: '20s', target: 60 },
          { duration: '15s', target: 80 },
          { duration: '10s', target: 0 },
        ],
      },
    },
  },
};

export const options = modeConfigs[mode] || modeConfigs.smoke;

export default function () {
  const roll = __ITER % 10;

  if (roll < 2) {
    // 20% Health check
    const res = http.get(`${baseUrl}/health`, apiParams('health'));
    healthDuration.add(res.timings.duration);
    check(res, { 'health ok': (r) => checkOk(r) && safeJson(r, 'success') === true });
    if (res.status >= 500) http5xx.add(1);
  } else if (roll < 5) {
    // 30% Product listing
    const res = http.get(`${baseUrl}/products?per_page=12`, apiParams('products_list'));
    listDuration.add(res.timings.duration);
    check(res, { 'products list ok': (r) => checkOk(r) && safeJson(r, 'success') === true });
    if (res.status >= 500) http5xx.add(1);
  } else if (roll < 7) {
    // 20% Product detail
    const res = http.get(`${baseUrl}/products/sim-luxury-sofa`, apiParams('product_detail'));
    detailDuration.add(res.timings.duration);
    check(res, { 'product detail ok': (r) => checkOk(r) && safeJson(r, 'success') === true });
    if (res.status >= 500) http5xx.add(1);
  } else if (roll < 9) {
    // 20% Search query
    const res = http.get(`${baseUrl}/catalog/search?q=%D9%83%D9%86%D8%A8&type=products&per_page=12`, apiParams('search'));
    searchDuration.add(res.timings.duration);
    check(res, { 'search ok': (r) => checkOk(r) && safeJson(r, 'success') === true });
    if (res.status >= 500) http5xx.add(1);
  } else {
    // 10% Categories
    const res = http.get(`${baseUrl}/categories`, apiParams('categories'));
    catDuration.add(res.timings.duration);
    check(res, { 'categories ok': (r) => checkOk(r) && safeJson(r, 'success') === true });
    if (res.status >= 500) http5xx.add(1);
  }

  sleep(0.02);
}

export function handleSummary(data) {
  const p50 = data.metrics.http_req_duration?.values?.med ?? 0;
  const p90 = data.metrics.http_req_duration?.values?.['p(90)'] ?? 0;
  const p95 = data.metrics.http_req_duration?.values?.['p(95)'] ?? 0;
  const p99 = data.metrics.http_req_duration?.values?.['p(99)'] ?? 0;
  const max = data.metrics.http_req_duration?.values?.max ?? 0;
  const rps = data.metrics.http_reqs?.values?.rate ?? 0;
  const totalReqs = data.metrics.http_reqs?.values?.count ?? 0;
  const failRate = data.metrics.http_req_failed?.values?.rate ?? 0;

  const result = {
    mode,
    total_requests: totalReqs,
    rps: Number(rps.toFixed(2)),
    p50_ms: Number(p50.toFixed(2)),
    p90_ms: Number(p90.toFixed(2)),
    p95_ms: Number(p95.toFixed(2)),
    p99_ms: Number(p99.toFixed(2)),
    max_ms: Number(max.toFixed(2)),
    fail_rate_pct: Number((failRate * 100).toFixed(2)),
    health_p95: Number((data.metrics.diyar_health_duration?.values?.['p(95)'] ?? 0).toFixed(2)),
    list_p95: Number((data.metrics.diyar_list_duration?.values?.['p(95)'] ?? 0).toFixed(2)),
    detail_p95: Number((data.metrics.diyar_detail_duration?.values?.['p(95)'] ?? 0).toFixed(2)),
    search_p95: Number((data.metrics.diyar_search_duration?.values?.['p(95)'] ?? 0).toFixed(2)),
    cat_p95: Number((data.metrics.diyar_cat_duration?.values?.['p(95)'] ?? 0).toFixed(2)),
  };

  return {
    stdout: JSON.stringify(result, null, 2),
  };
}
