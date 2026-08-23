/**
 * Shared k6 helpers for DIYAR performance scripts.
 */

export function apiParams(tag = 'catalog') {
  return {
    headers: {
      Accept: 'application/json',
      // Spread rate-limit buckets when testing behind a single NAT / Docker IP.
      'X-Forwarded-For': `10.${200 + (__VU % 50)}.${__VU % 255}.${__ITER % 255}`,
    },
    tags: { name: tag },
    timeout: '60s',
  };
}

export function safeJson(response, path) {
  if (!response || !response.body) {
    return undefined;
  }

  try {
    return response.json(path);
  } catch {
    return undefined;
  }
}

export function checkOk(response) {
  return response && response.status >= 200 && response.status < 300;
}
