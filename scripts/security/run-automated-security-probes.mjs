import http from 'http';

const GATEWAY_ORIGIN = 'http://localhost:8092';

async function request(urlPath, options = {}) {
  const normalizedPath = urlPath.startsWith('/api/v1') 
    ? urlPath 
    : '/api/v1' + (urlPath.startsWith('/') ? urlPath : '/' + urlPath);

  const url = new URL(normalizedPath, GATEWAY_ORIGIN);

  return new Promise((resolve, reject) => {
    const req = http.request(url, {
      method: options.method || 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (e) {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
          json
        });
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

const probeResults = [];

function recordProbe(category, testName, passed, details) {
  probeResults.push({ category, testName, passed, details });
  const statusStr = passed ? '[PASS]' : '[FAIL]';
  console.log(`${statusStr} [${category}] ${testName} - ${details}`);
}

async function runSecurityProbes() {
  console.log('=== Starting Automated Security Probes against DIYAR Simulation Gateway ===\n');

  // 1. Unauthenticated Access Barrier Probes
  const protectedEndpoints = [
    { path: '/admin/dashboard', expected: [401, 403], desc: 'Admin Dashboard' },
    { path: '/admin/affiliate/payouts', expected: [401, 403], desc: 'Admin Affiliate Payouts' },
    { path: '/admin/shipping/rates', expected: [401, 403], desc: 'Admin Shipping Rates' },
    { path: '/auth/me', expected: [401], desc: 'Authenticated User Me' },
    { path: '/profile', expected: [401], desc: 'User Profile' },
    { path: '/orders', expected: [401], desc: 'User Orders' },
    { path: '/cart', expected: [200, 401], desc: 'Cart Endpoint' } // Guest cart allowed or 401
  ];

  for (const ep of protectedEndpoints) {
    const res = await request(ep.path);
    const ok = ep.expected.includes(res.status);
    recordProbe('Access Control', `Unauthenticated ${ep.desc} (${ep.path})`, ok, `HTTP Status: ${res.status}`);
  }

  // 2. SQL Injection Fuzzing on Search & Filter Endpoints
  const sqliPayloads = [
    "' OR '1'='1",
    '" OR "1"="1',
    "' OR 1=1 --",
    "1; SELECT SLEEP(2); --",
    "' UNION SELECT 1,2,3,4,5,6,7,8,9,10 --",
    "1' AND (SELECT 1 FROM (SELECT COUNT(*), CONCAT((SELECT database()), 0x3a, FLOOR(RAND(0)*2)) x FROM information_schema.tables GROUP BY x) a) --",
    "admin' --",
    "\\",
    "null' or 'a'='a"
  ];

  for (const payload of sqliPayloads) {
    const searchUrl = `/catalog/search?q=${encodeURIComponent(payload)}&type=products`;
    const res = await request(searchUrl);
    
    // Check for SQL errors in response
    const bodyStr = res.body.toLowerCase();
    const leakedSql = bodyStr.includes('sqlstate') || 
                      bodyStr.includes('syntax error') || 
                      bodyStr.includes('mariadb') || 
                      bodyStr.includes('unclosed quotation') ||
                      bodyStr.includes('pdoexception');

    const ok = res.status < 500 && !leakedSql;
    recordProbe('SQL Injection', `Search payload: "${payload}"`, ok, `Status: ${res.status}, SQL Leaked: ${leakedSql}`);
  }

  // 3. Dynamic Sorting / Column SQLi Probes
  const sortPayloads = [
    "id;SLEEP(2)",
    "price ASC, (SELECT 1 FROM information_schema.tables)",
    "non_existent_column_injection",
    "price; DROP TABLE products--"
  ];

  for (const sort of sortPayloads) {
    const sortUrl = `/products?sort_by=${encodeURIComponent(sort)}&direction=asc`;
    const res = await request(sortUrl);
    const bodyStr = res.body.toLowerCase();
    const leakedSql = bodyStr.includes('sqlstate') || bodyStr.includes('pdoexception') || bodyStr.includes('syntax error');
    const ok = res.status < 500 && !leakedSql;
    recordProbe('SQL Injection', `Product sort_by: "${sort}"`, ok, `Status: ${res.status}, Handled gracefully`);
  }

  // 4. Path Traversal & File Path Probes
  const traversalPayloads = [
    "../../etc/passwd",
    "..\\..\\windows\\win.ini",
    "....//....//etc/passwd",
    "%2e%2e%2f%2e%2e%2fetc%2fpasswd",
    "sim-luxury-sofa/../../secret"
  ];

  for (const trav of traversalPayloads) {
    const travUrl = `/products/${encodeURIComponent(trav)}`;
    const res = await request(travUrl);
    const leakedFiles = res.body.includes('root:') || res.body.includes('[fonts]');
    const ok = (res.status === 404 || res.status === 400 || res.status === 422) && !leakedFiles;
    recordProbe('Path Traversal', `Product slug: "${trav}"`, ok, `Status: ${res.status}, Traversal Blocked`);
  }

  // 5. Mass Assignment / Privilege Escalation Payload Fuzzing
  const massAssignPayload = {
    email: 'test_probe@example.com',
    password: 'Password123!',
    role: 'admin',
    is_admin: true,
    permissions: ['*'],
    vendor_id: '01a1167f-870c-7036-a6d1-6ad80a94d2bf',
    status: 'active'
  };

  const regRes = await request('/auth/register', {
    method: 'POST',
    body: massAssignPayload
  });

  let roleAssignedAdmin = false;
  if (regRes.json && regRes.json.data && regRes.json.data.user) {
    roleAssignedAdmin = regRes.json.data.user.role === 'admin' || regRes.json.data.user.is_admin === true;
  }
  const massAssignOk = !roleAssignedAdmin;
  recordProbe('Mass Assignment', 'Registration payload tampering with is_admin/role=admin', massAssignOk, `Role escalation prevented: ${!roleAssignedAdmin}`);

  // Summary
  console.log('\n=== Security Probes Summary ===');
  const total = probeResults.length;
  const passedCount = probeResults.filter(p => p.passed).length;
  const failedCount = total - passedCount;
  console.log(`Total Probes: ${total} | Passed: ${passedCount} | Failed: ${failedCount}`);

  return { total, passedCount, failedCount, probeResults };
}

runSecurityProbes().catch(console.error);
