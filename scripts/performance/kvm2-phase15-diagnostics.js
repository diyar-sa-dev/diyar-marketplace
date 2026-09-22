import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { apiParams, authedParams, checkOk, loginSession, safeJson } from './common.js';

/**
 * Phase 15 — synthetic representative workload (multi-product + optional auth).
 * Same KVM2 envelope; rate limits ON.
 *
 * WORKLOAD:
 *   detail-guest | detail-auth | mix-realistic | (inherits phase2 via PROFILE)
 */
const baseUrl = (__ENV.BASE_URL || 'http://nginx/api/v1').replace(/\/$/, '');
const profile = __ENV.PROFILE || 'detail-guest';
const workload = __ENV.WORKLOAD || profile;
const stageDuration = __ENV.STAGE_DURATION || '90s';
const reportDir = (__ENV.REPORT_DIR || 'phase15').replace(/\.\./g, '').replace(/[^a-zA-Z0-9._/-]/g, '');
// Session cookies are bound to nginx on the compose network; SPA Origin must match Sanctum stateful domains.
const sessionBase = __ENV.K6_SESSION_BASE || 'http://nginx';
const statefulOrigin = __ENV.FRONTEND_ORIGIN || 'http://127.0.0.1:8193';
const loginIdentifier = __ENV.KVM2_CUSTOMER_IDENTIFIER || '500000010';
const loginPassword = __ENV.KVM2_CUSTOMER_PASSWORD || 'Password123!';

const detailDuration = new Trend('detail_duration', true);
const http429 = new Counter('http_429');
const http5xx = new Counter('http_5xx');
const httpOk = new Rate('http_ok');

function storefrontParams(tag) {
  const params = apiParams(tag);
  params.headers['Accept-Language'] = __ENV.ACCEPT_LANGUAGE || 'ar';
  params.headers.Origin = statefulOrigin;
  params.headers.Referer = `${statefulOrigin}/search`;
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

function constantVus(vus, duration) {
  return { scenarios: { users: { executor: 'constant-vus', vus, duration } } };
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

function stampedeScenario(vus, duration) {
  return {
    scenarios: {
      stampede: {
        executor: 'constant-vus',
        vus,
        duration,
      },
    },
  };
}

const profiles = {
  'detail-guest': constantVus(25, stageDuration),
  'detail-auth': constantVus(25, stageDuration),
  'detail-auth-vu5': constantVus(5, stageDuration),
  'detail-auth-vu10': constantVus(10, stageDuration),
  'detail-auth-vu50': constantVus(50, stageDuration),
  'detail-auth-cold': constantVus(25, stageDuration),
  'detail-auth-warm': constantVus(25, stageDuration),
  'stampede-detail': stampedeScenario(50, '45s'),
  'mix-realistic': constantVus(25, stageDuration),
  vu25: constantVus(25, stageDuration),
  vu50: constantVus(50, stageDuration),
  rps50: arrival(50, stageDuration, 40, 120),
  rps75: arrival(75, stageDuration, 60, 160),
  rps100: arrival(100, stageDuration, 80, 200),
  rps125: arrival(125, stageDuration, 100, 240),
  rps150: arrival(150, stageDuration, 120, 280),
  rps200: arrival(200, stageDuration, 150, 360),
};

const selected = profiles[profile] || profiles['detail-guest'];

export const options = {
  scenarios: selected.scenarios,
  thresholds: { http_req_failed: [{ threshold: 'rate<0.15', abortOnFail: false }] },
  summaryTrendStats: ['avg', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
};

/** Skewed pick: ~40% head, ~30% mid, rest long tail (synthetic, not factual traffic). */
function pickProductId(ids, iter) {
  if (!ids || ids.length === 0) return '';
  if (ids.length === 1) return ids[0];
  const bucket = iter % 10;
  if (bucket < 4) return ids[0];
  if (bucket < 7 && ids.length > 1) return ids[1];
  return ids[iter % ids.length];
}

export function setup() {
  const params = { headers: { Accept: 'application/json', 'Accept-Language': 'ar' }, timeout: '60s' };
  const ids = [];
  for (let page = 1; page <= 3; page += 1) {
    const res = http.get(`${baseUrl}/products?per_page=12&page=${page}`, params);
    if (!checkOk(res)) break;
    const items = safeJson(res, 'data.items') || [];
    for (const item of items) {
      if (item?.id) ids.push(String(item.id));
    }
    if (items.length < 12) break;
  }

  let authCookie = '';
  const needsAuth = workload === 'detail-auth'
    || workload === 'mix-realistic'
    || profile.startsWith('detail-auth');
  if (needsAuth) {
    authCookie = loginSession(sessionBase, baseUrl, '/auth/login', {
      method: 'phone',
      identifier: loginIdentifier,
      password: loginPassword,
    }, 'kvm2-customer', statefulOrigin);
  }

  const stampedeProductId = ids[0] || '';

  return { productIds: ids, authCookie, stampedeProductId };
}

function fetchDetail(productId, guest, authCookie) {
  const params = guest
    ? storefrontParams('product-detail-guest')
    : authedParams(authCookie, 'product-detail-auth');
  const res = http.get(`${baseUrl}/products/${productId}`, params);
  detailDuration.add(res.timings.duration);
  recordStatus(res);
  check(res, { detail: (r) => checkOk(r) });
}

export default function phase15(data) {
  const authCookie = data?.authCookie || '';
  const ids = data?.productIds || [];
  const productId = pickProductId(ids, __ITER);

  if (profile === 'stampede-detail') {
    const sid = data?.stampedeProductId || productId;
    if (!sid) return;
    fetchDetail(sid, true, authCookie);
    return;
  }

  if (workload === 'detail-guest' || profile === 'detail-guest') {
    if (!productId) return;
    fetchDetail(productId, true, authCookie);
  } else if (
    workload === 'detail-auth'
    || profile === 'detail-auth'
    || profile.startsWith('detail-auth-')
  ) {
    if (!productId || !authCookie) return;
    fetchDetail(productId, false, authCookie);
  } else if (workload === 'mix-realistic' || profile === 'mix-realistic') {
    const roll = __ITER % 100;
    if (roll < 35) {
      const list = http.get(`${baseUrl}/products?per_page=12`, storefrontParams('products'));
      recordStatus(list);
    } else if (roll < 55) {
      const q = ['sofa', '%D9%83%D9%86%D8%A8', 'bedroom'][__ITER % 3];
      const search = http.get(
        `${baseUrl}/catalog/search?q=${q}&type=all&per_page=12&product_page=1&service_page=1`,
        storefrontParams('catalog-search'),
      );
      recordStatus(search);
    } else if (roll < 85 && productId) {
      fetchDetail(productId, true, authCookie);
    } else if (productId && authCookie) {
      fetchDetail(productId, false, authCookie);
    }
  } else {
    if (!productId) return;
    fetchDetail(productId, true, authCookie);
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
    p50_ms: data.metrics.http_req_duration?.values?.med ?? 0,
    p95_ms: data.metrics.http_req_duration?.values?.['p(95)'] ?? 0,
    p99_ms: data.metrics.http_req_duration?.values?.['p(99)'] ?? 0,
    detail_p95_ms: data.metrics.detail_duration?.values?.['p(95)'] ?? 0,
    error_rate: failed,
    http_429: data.metrics.http_429?.values?.count ?? 0,
    http_5xx: data.metrics.http_5xx?.values?.count ?? 0,
    product_pool_size: data.setup_data?.productIds?.length ?? null,
  };
  return {
    stdout: `${JSON.stringify(summary)}\n`,
    [`/reports/${reportDir}/summary-${profile}.json`]: JSON.stringify(summary, null, 2),
  };
}
