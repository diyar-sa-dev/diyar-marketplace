import http from 'k6/http';
import { check, sleep } from 'k6';
import { apiParams, authedParams, checkOk, loginSession, safeJson } from './common.js';

/**
 * PS30-3 — Room design PUT save smoke (authenticated).
 * Requires: room_designer_enabled, seeded customer, Octane/API up.
 * NOT 25K — low VU smoke only.
 */
const originUrl = __ENV.ORIGIN_URL || 'http://127.0.0.1:8000';
const baseUrl = __ENV.BASE_URL || `${originUrl}/api/v1`;
const loginPhone = __ENV.E2E_CUSTOMER_PHONE || '966500000010';
const loginPassword = __ENV.E2E_CUSTOMER_PASSWORD || 'Password123!';

export const options = {
  scenarios: {
    room_design_save: {
      executor: 'constant-vus',
      vus: Number(__ENV.ROOM_DESIGN_K6_VUS || 3),
      duration: __ENV.ROOM_DESIGN_K6_DURATION || '30s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.1'],
  },
};

const sampleDocument = () => ({
  schema_version: 1,
  room: { width_m: 4.5, depth_m: 4, height_m: 2.8, origin: 'corner' },
  items: [],
});

let currentVersion = 0;

export function setup() {
  const cookie = loginSession(originUrl, baseUrl, '/auth/login', {
    phone: loginPhone,
    password: loginPassword,
  });
  const params = authedParams(cookie, 'rd-setup');
  const create = http.post(
    `${baseUrl}/room-designs`,
    JSON.stringify({ title: 'k6 smoke', document: sampleDocument() }),
    { ...params, headers: { ...params.headers, 'Content-Type': 'application/json' } },
  );
  if (!checkOk(create)) {
    throw new Error(`room-design create failed (${create.status})`);
  }
  const id = safeJson(create, 'data.room_design.id');
  const ver = safeJson(create, 'data.room_design.version');
  return { cookie, designId: id, version: ver };
}

export default function smoke(data) {
  if (!data?.cookie || !data?.designId) {
    return;
  }
  if (currentVersion === 0) {
    currentVersion = data.version;
  }
  const params = authedParams(data.cookie, 'rd-save');
  const doc = sampleDocument();
  doc.room.width_m = 4.5 + (__ITER % 3) * 0.1;

  const save = http.put(
    `${baseUrl}/room-designs/${data.designId}`,
    JSON.stringify({ expected_version: currentVersion, document: doc }),
    { ...params, headers: { ...params.headers, 'Content-Type': 'application/json' } },
  );

  const newVersion = safeJson(save, 'data.room_design.version');
  check(save, {
    'save 200': (r) => checkOk(r),
    'version bumped': () => newVersion > currentVersion,
  });
  if (checkOk(save) && typeof newVersion === 'number') {
    currentVersion = newVersion;
  }

  sleep(0.5);
}

export function handleSummary(data) {
  return {
    stdout: [
      'DIYAR room-design save smoke',
      `http_req_duration p95: ${(data.metrics.http_req_duration?.values?.['p(95)'] ?? 0).toFixed(2)}ms`,
      '25K / production capacity: NOT VERIFIED — smoke hook only.',
    ].join('\n'),
  };
}
