/**
 * Shared k6 helpers for DIYAR performance scripts.
 */
import http from 'k6/http';

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

function decodeXsrfToken(rawValue) {
  if (!rawValue) {
    return '';
  }

  try {
    return decodeURIComponent(rawValue);
  } catch {
    return rawValue;
  }
}

function cookiesForUrl(jar, originUrl) {
  return jar.cookiesForURL(originUrl) || {};
}

function cookieHeader(jar, originUrl) {
  const cookies = cookiesForUrl(jar, originUrl);

  return Object.entries(cookies)
    .map(([name, values]) => `${name}=${values[0]}`)
    .join('; ');
}

function xsrfFromJar(jar, originUrl) {
  const cookies = cookiesForUrl(jar, originUrl);
  return decodeXsrfToken(cookies['XSRF-TOKEN']?.[0]);
}

/**
 * Session login for k6 — returns Cookie header string for authenticated API calls.
 */
export function loginSession(originUrl, apiBaseUrl, loginPath, credentials, tag = 'auth') {
  const jar = http.cookieJar();

  const csrfResponse = http.get(`${originUrl}/sanctum/csrf-cookie`, {
    jar,
    tags: { name: `${tag}-csrf` },
    timeout: '30s',
  });

  if (!checkOk(csrfResponse)) {
    throw new Error(`CSRF bootstrap failed (${csrfResponse.status})`);
  }

  const xsrf = xsrfFromJar(jar, originUrl);
  const loginResponse = http.post(`${apiBaseUrl}${loginPath}`, JSON.stringify(credentials), {
    jar,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'X-XSRF-TOKEN': xsrf,
    },
    tags: { name: `${tag}-login` },
    timeout: '30s',
  });

  if (!checkOk(loginResponse)) {
    throw new Error(`Login failed (${loginResponse.status}): ${loginResponse.body}`);
  }

  return cookieHeader(jar, originUrl);
}

export function authedParams(cookieHeaderValue, tag = 'analytics') {
  return {
    headers: {
      Accept: 'application/json',
      Cookie: cookieHeaderValue,
      'X-Requested-With': 'XMLHttpRequest',
      'X-Forwarded-For': `10.${200 + (__VU % 50)}.${__VU % 255}.${__ITER % 255}`,
    },
    tags: { name: tag },
    timeout: '60s',
  };
}
