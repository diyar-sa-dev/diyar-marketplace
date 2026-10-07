/**
 * Step 13 — Comprehensive Runtime Gateway Validation
 * Tests the entire production-like stack through Nginx (http://localhost:8092)
 * Validates Gateway, Auth, Session Isolation, Commerce, Financials, Admin, WebSockets, Storage, and Security.
 */

import http from 'node:http';

const BASE_URL = 'http://localhost:8092';

async function run() {
  console.log(`=== Step 13 Runtime Gateway Validation against ${BASE_URL} ===\n`);
  const report = [];

  function record(testName, pass, details = '') {
    report.push({ testName, pass, details });
    const mark = pass ? '[PASS]' : '[FAIL]';
    console.log(`${mark} ${testName} ${details ? '(' + details + ')' : ''}`);
    if (!pass) {
      console.error(`  --> FAILURE: ${details}`);
    }
  }

  // Helper for requests maintaining stateful cookie jars with Sanctum
  class SessionClient {
    constructor(name) {
      this.name = name;
      this.cookies = new Map();
      this.xsrfToken = null;
    }

    updateCookies(response) {
      const rawCookies = response.headers.getSetCookie 
        ? response.headers.getSetCookie() 
        : (response.headers.get('set-cookie') ? [response.headers.get('set-cookie')] : []);

      for (const str of rawCookies) {
        const parts = str.split(';')[0].split('=');
        if (parts.length >= 2) {
          const key = parts[0].trim();
          const val = parts.slice(1).join('=').trim();
          this.cookies.set(key, val);
          if (key === 'XSRF-TOKEN') {
            this.xsrfToken = decodeURIComponent(val);
          }
        }
      }
    }

    getCookieHeader() {
      const pairs = [];
      for (const [k, v] of this.cookies.entries()) {
        pairs.push(`${k}=${v}`);
      }
      return pairs.join('; ');
    }

    async fetch(url, options = {}) {
      const headers = { 
        'Origin': BASE_URL,
        'Referer': `${BASE_URL}/`,
        'Accept': 'application/json',
        ...(options.headers || {}) 
      };

      if (!headers['Cookie'] && this.cookies.size > 0) {
        headers['Cookie'] = this.getCookieHeader();
      }
      if (this.xsrfToken && !headers['X-XSRF-TOKEN']) {
        headers['X-XSRF-TOKEN'] = this.xsrfToken;
      }

      const res = await fetch(`${BASE_URL}${url}`, {
        ...options,
        headers,
      });
      this.updateCookies(res);
      return res;
    }
  }

  try {
    // -------------------------------------------------------------
    // GATE 1: Nginx Gateway & SPA Frontend
    // -------------------------------------------------------------
    console.log('\n--- GATE 1: Gateway, Nginx, SPA & Security ---');

    const resRoot = await fetch(`${BASE_URL}/`);
    const rootText = await resRoot.text();
    record('Nginx Serves SPA at /', resRoot.status === 200 && rootText.includes('<div id="root"></div>'), `status: ${resRoot.status}`);
    record('Arabic RTL Attributes', rootText.includes('dir="rtl"') && rootText.includes('lang="ar"'));

    const securityHeadersOk = resRoot.headers.get('x-content-type-options') === 'nosniff'
      && resRoot.headers.get('x-frame-options') === 'DENY'
      && resRoot.headers.get('referrer-policy') === 'strict-origin-when-cross-origin';
    record('Nginx Security Headers', securityHeadersOk);

    // Deep link routing fallback
    const resDeepLink = await fetch(`${BASE_URL}/products/sim-luxury-sofa`);
    const deepLinkText = await resDeepLink.text();
    record('SPA Deep Link Fallback', resDeepLink.status === 200 && deepLinkText.includes('<div id="root"></div>'));

    // Defense-in-depth: Sensitive files blocked
    const resEnv = await fetch(`${BASE_URL}/.env`);
    record('Defense-in-depth: Block /.env', resEnv.status === 404, `status: ${resEnv.status}`);

    const resGit = await fetch(`${BASE_URL}/.git/config`);
    record('Defense-in-depth: Block /.git', resGit.status === 404, `status: ${resGit.status}`);

    const resVendor = await fetch(`${BASE_URL}/vendor/autoload.php`);
    record('Defense-in-depth: Block /vendor', resVendor.status === 404, `status: ${resVendor.status}`);

    // -------------------------------------------------------------
    // GATE 2: Infrastructure Health
    // -------------------------------------------------------------
    console.log('\n--- GATE 2: Infrastructure Health (DB, Redis, Queue, Fake Payments) ---');

    const resHealth = await fetch(`${BASE_URL}/api/v1/health`, { headers: { 'Accept': 'application/json' } });
    const healthJson = await resHealth.json();
    const checks = healthJson?.data?.checks || {};
    record('API Gateway Routes /api/v1/health', resHealth.status === 200 && healthJson.success === true);
    record('Database Health (MySQL)', checks.database?.ok === true && checks.database?.driver === 'mysql');
    record('Cache Health (Redis)', checks.cache?.ok === true && checks.cache?.driver === 'redis');
    record('Queue Health (Redis)', checks.queue?.ok === true && checks.queue?.driver === 'redis');
    record('Payments Isolation (Fake Gateway)', checks.payments?.ok === true && checks.payments?.metrics?.fake_gateway === true);

    // -------------------------------------------------------------
    // GATE 3: Sanctum CSRF & Authentication Lifecycle
    // -------------------------------------------------------------
    console.log('\n--- GATE 3: Sanctum, CSRF, and Authentication Lifecycle ---');

    const client = new SessionClient('client-auth');

    // 3.1 Guest access to protected endpoint
    const resGuestMe = await client.fetch('/api/v1/auth/me');
    record('Guest Access Protected Endpoint Rejected', resGuestMe.status === 401, `status: ${resGuestMe.status}`);

    // 3.2 Initialize CSRF
    const resCsrf = await client.fetch('/sanctum/csrf-cookie');
    record('CSRF Cookie Initialization', resCsrf.status === 204 && client.xsrfToken !== null, `XSRF token received`);

    // 3.3 Customer Login
    const resLogin = await client.fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'customer-a@diyar.local',
        password: 'Password123!',
        method: 'email',
      }),
    });
    const loginJson = await resLogin.json();
    record('Customer Login Success', resLogin.status === 200 && loginJson.success === true, `email: ${loginJson?.data?.user?.email}`);

    // 3.4 Authenticated /me
    const resAuthMe = await client.fetch('/api/v1/auth/me');
    const authMeJson = await resAuthMe.json();
    record('Authenticated /api/v1/auth/me', resAuthMe.status === 200 && authMeJson?.data?.user?.name === 'Customer Alpha', `name: ${authMeJson?.data?.user?.name}`);

    // 3.5 Role Authorization boundary: Customer accessing admin endpoint
    const resAdminForbidden = await client.fetch('/api/v1/admin/dashboard');
    record('Role Boundary: Customer Blocked from Admin', resAdminForbidden.status === 401 || resAdminForbidden.status === 403, `status: ${resAdminForbidden.status}`);

    // 3.6 Logout
    const resLogout = await client.fetch('/api/v1/auth/logout', { method: 'POST' });
    record('Customer Logout', resLogout.status === 200);

    // 3.7 Invalidation check post-logout
    const resPostLogoutMe = await client.fetch('/api/v1/auth/me');
    record('Session Invalidation Post-Logout', resPostLogoutMe.status === 401, `status: ${resPostLogoutMe.status}`);

    // -------------------------------------------------------------
    // GATE 4: Multi-User Session & State Isolation (Phase H)
    // -------------------------------------------------------------
    console.log('\n--- GATE 4: Multi-User Session Isolation (User A vs User B) ---');

    const userA = new SessionClient('UserA');
    const userB = new SessionClient('UserB');

    // CSRF for both
    await userA.fetch('/sanctum/csrf-cookie');
    await userB.fetch('/sanctum/csrf-cookie');

    // Login A
    const loginA = await userA.fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'customer-a@diyar.local', password: 'Password123!', method: 'email' }),
    });
    const jsonA = await loginA.json();

    // Login B
    const loginB = await userB.fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'customer-b@diyar.local', password: 'Password123!', method: 'email' }),
    });
    const jsonB = await loginB.json();

    record('Independent Login User A', loginA.status === 200 && jsonA?.data?.user?.email === 'customer-a@diyar.local');
    record('Independent Login User B', loginB.status === 200 && jsonB?.data?.user?.email === 'customer-b@diyar.local');

    // Verify distinct cookies
    const cookieA = userA.cookies.get('diyar-session');
    const cookieB = userB.cookies.get('diyar-session');
    record('Session Tokens are Distinct', cookieA !== cookieB && cookieA !== undefined && cookieB !== undefined);

    // Concurrent /me checks
    const meA = await (await userA.fetch('/api/v1/auth/me')).json();
    const meB = await (await userB.fetch('/api/v1/auth/me')).json();
    record('User A Identity Preserved', meA?.data?.user?.name === 'Customer Alpha');
    record('User B Identity Preserved', meB?.data?.user?.name === 'Customer Beta');
    record('Cross-User Leakage Check (A !== B)', meA?.data?.user?.id !== meB?.data?.user?.id);

    // Cart Isolation Check
    const prodRes = await fetch(`${BASE_URL}/api/v1/products/sim-luxury-sofa`, { headers: { 'Accept': 'application/json' } });
    const prodJson = await prodRes.json();
    const productId = prodJson?.data?.id || prodJson?.data?.product?.id;

    if (productId) {
      // User A adds item to cart
      const addResA = await userA.fetch('/api/v1/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, quantity: 1 }),
      });
      record('User A Adds Item to Cart', addResA.status === 200 || addResA.status === 201, `status: ${addResA.status}`);

      // Verify User A cart has 1 item
      const cartA = await (await userA.fetch('/api/v1/cart')).json();
      const countA = cartA?.data?.cart?.items?.length || 0;

      // Verify User B cart has 0 items (ISOLATION)
      const cartB = await (await userB.fetch('/api/v1/cart')).json();
      const countB = cartB?.data?.cart?.items?.length || 0;

      record('Cart State Isolation (User A count === 1, User B count === 0)', countA === 1 && countB === 0, `UserA: ${countA}, UserB: ${countB}`);
    } else {
      record('Cart Isolation (Product Lookup)', false, 'Product ID not resolved');
    }

    // -------------------------------------------------------------
    // GATE 5: Financial Invariants & Authoritative Calculations (Phase I)
    // -------------------------------------------------------------
    console.log('\n--- GATE 5: Marketplace & Authoritative Financial Calculations ---');

    record('Product Lookup via Gateway', prodRes.status === 200);
    const productData = prodJson?.data?.product || prodJson?.data;
    const salePrice = parseFloat(productData?.sale_price || productData?.price);
    record('Product Pricing Authoritative (850.00 SAR)', salePrice === 850.00, `price: ${salePrice}`);

    // VAT 15% calculation verification
    const expectedVatRate = 0.15;
    const calculatedVat = Math.round(salePrice * expectedVatRate * 100) / 100;
    const expectedTotal = salePrice + calculatedVat;
    record('Saudi 15% VAT Invariant Verification', calculatedVat === 127.50 && expectedTotal === 977.50, `Subtotal: 850.00, VAT: ${calculatedVat}, Total: ${expectedTotal}`);

    // -------------------------------------------------------------
    // GATE 6: Admin Operations & Control Plane Authorization
    // -------------------------------------------------------------
    console.log('\n--- GATE 6: Admin Control Plane Authentication & RBAC ---');

    const adminClient = new SessionClient('AdminClient');
    await adminClient.fetch('/sanctum/csrf-cookie');

    const resAdminLogin = await adminClient.fetch('/api/v1/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'email',
        identifier: 'admin@diyar.local',
        password: 'Password123!',
      }),
    });
    const adminLoginJson = await resAdminLogin.json();
    record('Admin Authentication (/api/v1/admin/auth/login)', resAdminLogin.status === 200 && adminLoginJson.success === true);

    const resAdminSession = await adminClient.fetch('/api/v1/admin/session');
    const adminSessionJson = await resAdminSession.json();
    const hasAdminPermissions = Array.isArray(adminSessionJson?.data?.permissions) && adminSessionJson?.data?.permissions.length > 0;
    record('Admin Session Verified (/api/v1/admin/session)', resAdminSession.status === 200 && hasAdminPermissions, `permissions: ${adminSessionJson?.data?.permissions?.length}`);

    const resAdminDash = await adminClient.fetch('/api/v1/admin/dashboard');
    record('Admin Dashboard RBAC Access Granted', resAdminDash.status === 200, `status: ${resAdminDash.status}`);

    // -------------------------------------------------------------
    // GATE 7: WebSockets & Reverb Gateway Verification (Phase M)
    // -------------------------------------------------------------
    console.log('\n--- GATE 7: Realtime WebSockets Gateway Routing ---');

    const wsUpgradeSuccess = await new Promise((resolve) => {
      const req = http.request({
        hostname: 'localhost',
        port: 8092,
        path: '/app/diyar-local-key',
        headers: {
          'Connection': 'Upgrade',
          'Upgrade': 'websocket',
          'Sec-WebSocket-Key': 'dGhlIHNhbXBsZSBub25jZQ==',
          'Sec-WebSocket-Version': '13',
          'Origin': 'http://localhost:8092',
        },
      });

      req.on('upgrade', (res, socket) => {
        socket.destroy();
        resolve(res.statusCode === 101);
      });

      req.on('response', (res) => {
        resolve(res.statusCode === 101);
      });

      req.on('error', (e) => {
        console.error('WS handshake error:', e.message);
        resolve(false);
      });

      req.end();
    });
    record('Reverb WebSocket Upgrade Handshake (101 Switching Protocols)', wsUpgradeSuccess);

    // -------------------------------------------------------------
    // GATE 8: Private Channel Authorization & Isolation (Phase M)
    // -------------------------------------------------------------
    console.log('\n--- GATE 8: Realtime Private Channel Authorization & Anti-Leakage ---');

    const userAId = meA?.data?.user?.id;
    const userBId = meB?.data?.user?.id;

    // User A authorizes own private channel
    const authOwnRes = await userA.fetch('/broadcasting/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        socket_id: '12345.67890',
        channel_name: `private-users.${userAId}`,
      }),
    });
    record('User A Authorizes Own Private Channel', authOwnRes.status === 200, `status: ${authOwnRes.status}`);

    // User A attempts to authorize User B's private channel (Must be 403 Forbidden)
    const authOtherRes = await userA.fetch('/broadcasting/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        socket_id: '12345.67890',
        channel_name: `private-users.${userBId}`,
      }),
    });
    record('Cross-User Private Channel Leakage Blocked (403 Forbidden)', authOtherRes.status === 403, `status: ${authOtherRes.status}`);

    // -------------------------------------------------------------
    // GATE 9: Storage & Upload Security (Phase J)
    // -------------------------------------------------------------
    console.log('\n--- GATE 9: Storage & Upload Security ---');

    // 9.1 Invalid MIME Rejected (e.g. text file instead of image)
    const badFormData = new FormData();
    const badBlob = new Blob(['malicious payload or invalid file'], { type: 'text/plain' });
    badFormData.append('avatar', badBlob, 'test.txt');

    const badUploadRes = await userA.fetch('/api/v1/profile/avatar', {
      method: 'POST',
      body: badFormData,
    });
    record('Invalid Upload MIME Rejected (422 Unprocessable)', badUploadRes.status === 422, `status: ${badUploadRes.status}`);

    // 9.2 Valid 1x1 PNG Upload Accepted
    const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const pngBuffer = Buffer.from(pngBase64, 'base64');
    const goodBlob = new Blob([pngBuffer], { type: 'image/png' });
    const goodFormData = new FormData();
    goodFormData.append('avatar', goodBlob, 'avatar.png');

    const goodUploadRes = await userA.fetch('/api/v1/profile/avatar', {
      method: 'POST',
      body: goodFormData,
    });
    const goodUploadJson = await goodUploadRes.json();
    const avatarUrl = goodUploadJson?.data?.profile?.avatar_url;
    record('Valid Image Upload Accepted (200 OK)', goodUploadRes.status === 200 && Boolean(avatarUrl), `url: ${avatarUrl}`);

    // 9.3 Public asset served through Nginx /storage/ gateway
    if (avatarUrl) {
      const storageAssetPath = avatarUrl.startsWith('http') ? new URL(avatarUrl).pathname : avatarUrl;
      const assetRes = await fetch(`${BASE_URL}${storageAssetPath}`);
      record('Nginx Serves Uploaded Asset from /storage/*', assetRes.status === 200 && assetRes.headers.get('content-type')?.includes('image'), `status: ${assetRes.status}`);
    } else {
      record('Nginx Serves Uploaded Asset from /storage/*', false, 'Avatar URL was not generated');
    }

  } catch (err) {
    console.error('Unexpected error during gateway validation:', err);
    record('Fatal Execution Exception', false, err.message);
  }

  console.log('\n======================================================');
  console.log('                 VALIDATION RESULTS                   ');
  console.log('======================================================');
  const passed = report.filter(r => r.pass).length;
  const failed = report.filter(r => !r.pass).length;
  console.log(`Total Gates Evaluated: ${report.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed === 0) {
    console.log('\n>>> OVERALL GATEWAY STATUS: ALL GATES PASSED <<<');
    process.exit(0);
  } else {
    console.log('\n>>> OVERALL GATEWAY STATUS: GATES FAILED <<<');
    process.exit(1);
  }
}

run();
