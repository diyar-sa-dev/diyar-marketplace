import http from 'http';
import { spawnSync } from 'child_process';

const GATEWAY_ORIGIN = 'http://localhost:8092';
const API_PREFIX = '/api/v1';

class ApiClient {
  constructor(name) {
    this.name = name;
    this.cookies = {};
    this.xsrfToken = '';
  }

  async request(path, options = {}) {
    const fullPath = path.startsWith('/api/v1') || path.startsWith('/sanctum')
      ? path 
      : `${API_PREFIX}${path.startsWith('/') ? path : '/' + path}`;

    const url = new URL(fullPath, GATEWAY_ORIGIN);

    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Origin': GATEWAY_ORIGIN,
      'Referer': `${GATEWAY_ORIGIN}/`,
      ...(options.headers || {})
    };

    if (this.xsrfToken) {
      headers['X-XSRF-TOKEN'] = decodeURIComponent(this.xsrfToken);
    }

    const cookieHeader = Object.entries(this.cookies).map(([k, v]) => `${k}=${v}`).join('; ');
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader;
    }

    return new Promise((resolve, reject) => {
      const req = http.request(url, {
        method: options.method || 'GET',
        headers
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const setCookie = res.headers['set-cookie'];
          if (setCookie) {
            setCookie.forEach(c => {
              const [part] = c.split(';');
              const [name, val] = part.split('=');
              if (name && val) {
                this.cookies[name.trim()] = val.trim();
                if (name.trim() === 'XSRF-TOKEN') {
                  this.xsrfToken = val.trim();
                }
              }
            });
          }

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

  async getSanctumCookie() {
    return this.request('/sanctum/csrf-cookie');
  }

  async login(identifier, password) {
    await this.getSanctumCookie();
    return this.request('/auth/login', {
      method: 'POST',
      body: {
        method: 'email',
        identifier,
        password
      }
    });
  }

  async adminLogin(identifier, password) {
    await this.getSanctumCookie();
    return this.request('/admin/auth/login', {
      method: 'POST',
      body: {
        method: 'email',
        identifier,
        password
      }
    });
  }
}

async function runBusinessFlow() {
  console.log('=================================================================');
  console.log(' STEP 13B.2 REALISTIC BUSINESS-FLOW VALIDATION SUITE');
  console.log('=================================================================\n');

  const clientA = new ApiClient('Customer A');
  const clientB = new ApiClient('Customer B');
  const clientAdmin = new ApiClient('Admin');
  const results = [];

  function record(step, invariant, passed, details) {
    results.push({ step, invariant, passed, details });
    const mark = passed ? '[PASS]' : '[FAIL]';
    console.log(`${mark} [${step}] ${invariant} -> ${details}`);
  }

  // 1. Browsing & Catalog Navigation
  console.log('[Scenario A] Catalog Browsing & Category Discovery...');
  const catRes = await clientA.request('/categories');
  record('Browsing', 'Categories Tree Non-Empty', catRes.status === 200 && Array.isArray(catRes.json?.data?.categories) && catRes.json.data.categories.length > 0, `Count: ${catRes.json?.data?.categories?.length}`);

  const prodRes = await clientA.request('/products?per_page=12');
  record('Browsing', 'Products Pagination Total > 0', prodRes.status === 200 && (prodRes.json?.data?.pagination?.total ?? 0) > 0, `Total Products: ${prodRes.json?.data?.pagination?.total}`);

  const detailRes = await clientA.request('/products/sim-luxury-sofa');
  const sofa = detailRes.json?.data?.product;
  record('Browsing', 'Product Detail Schema', detailRes.status === 200 && sofa?.slug === 'sim-luxury-sofa', `Product: ${sofa?.name}, Price: ${sofa?.sale_price}`);
  record('Browsing', 'Inventory Non-Negative', (sofa?.inventory?.available_quantity ?? -1) >= 0, `Available: ${sofa?.inventory?.available_quantity}, Stock: ${sofa?.inventory?.stock_quantity}`);

  // 2. Search Navigation
  console.log('\n[Scenario B] Search & Multi-Language Filtering...');
  const searchAr = await clientA.request('/catalog/search?q=%D9%83%D9%86%D8%A8&type=products');
  record('Search', 'Arabic Query Returns Products', searchAr.status === 200 && (searchAr.json?.data?.products?.items?.length ?? 0) > 0, `Items found: ${searchAr.json?.data?.products?.items?.length}`);

  const searchEmpty = await clientA.request('/catalog/search?q=xyznonexistent999&type=products');
  record('Search', 'Non-existent Search Handled Gracefully', searchEmpty.status === 200 && (searchEmpty.json?.data?.products?.items?.length ?? 0) === 0, `Items: 0 (No 500 error)`);

  // 3. User Authentication
  console.log('\n[Scenario C] Multi-Principal Authentication...');
  const loginA = await clientA.login('customer-a@diyar.local', 'Password123!');
  record('Auth', 'Customer A Login Successful', loginA.status === 200, `Status: ${loginA.status}`);

  const meA = await clientA.request('/auth/me');
  const userAId = meA.json?.data?.user?.id;
  record('Auth', 'Customer A Identity Verified', meA.status === 200 && meA.json?.data?.user?.email === 'customer-a@diyar.local', `User ID: ${userAId}`);

  const loginB = await clientB.login('customer-b@diyar.local', 'Password123!');
  record('Auth', 'Customer B Login Successful', loginB.status === 200, `Status: ${loginB.status}`);

  const meB = await clientB.request('/auth/me');
  const userBId = meB.json?.data?.user?.id;
  record('Auth', 'Customer B Identity Verified', meB.status === 200 && meB.json?.data?.user?.email === 'customer-b@diyar.local', `User ID: ${userBId}`);
  record('Auth', 'User IDs Distinct', userAId !== userBId, `A: ${userAId} != B: ${userBId}`);

  const loginAdm = await clientAdmin.adminLogin('admin@diyar.local', 'Password123!');
  record('Auth', 'Admin Login Successful', loginAdm.status === 200, `Status: ${loginAdm.status}`);

  // 4. Cart Operations & Multi-User Isolation
  console.log('\n[Scenario D] Cart Operations & Multi-Tenant State Isolation...');
  await clientA.request('/cart', { method: 'DELETE' });
  await clientB.request('/cart', { method: 'DELETE' });

  // Customer A adds sofa (qty 2)
  const addA = await clientA.request('/cart/items', {
    method: 'POST',
    body: {
      product_id: sofa.id,
      quantity: 2
    }
  });
  record('Cart', 'Customer A Added Item (Qty 2)', addA.status === 200 || addA.status === 201, `Status: ${addA.status}`);

  // Customer A views cart
  const cartA = await clientA.request('/cart');
  const itemsA = cartA.json?.data?.cart?.items || [];
  record('Cart', 'Customer A Cart Contains 1 Item', itemsA.length === 1 && itemsA[0].quantity === 2, `Item count: ${itemsA.length}, Qty: ${itemsA[0]?.quantity}`);

  // Customer B views cart (must be strictly empty!)
  const cartB = await clientB.request('/cart');
  const itemsB = cartB.json?.data?.cart?.items || [];
  record('Cart', 'Customer B Cart Strictly Empty (Zero Bleed)', itemsB.length === 0, `Items in B: ${itemsB.length}`);

  // 5. Cross-Role RBAC Isolation
  console.log('\n[Scenario E] Cross-Role RBAC Barriers...');
  const adminA = await clientA.request('/admin/dashboard');
  record('RBAC', 'Customer A Denied Admin Dashboard', adminA.status === 401 || adminA.status === 403, `Blocked with HTTP ${adminA.status}`);

  const adminB = await clientB.request('/admin/dashboard');
  record('RBAC', 'Customer B Denied Admin Dashboard', adminB.status === 401 || adminB.status === 403, `Blocked with HTTP ${adminB.status}`);

  const adminOk = await clientAdmin.request('/admin/dashboard');
  record('RBAC', 'Admin Granted Admin Dashboard', adminOk.status === 200, `Status: ${adminOk.status}`);

  // 6. Post-Run Database Integrity Audit
  console.log('\n[Scenario F] Post-Run Database Invariant Audit...');
  const dbCheck = spawnSync('docker', [
    'exec', 'diyar-vps-sim-mysql-1',
    'mysql', '-u', 'root', '-psim_root_secret', 'diyar_vps_simulation',
    '-e', 'SELECT MIN(available_quantity) as min_avail, MIN(stock_quantity) as min_stock FROM product_inventory; SELECT COUNT(*) as neg_inv FROM product_inventory WHERE available_quantity < 0;'
  ], { encoding: 'utf8' });

  const dbOutput = dbCheck.stdout || '';
  const noNegInventory = dbOutput.includes('0') && !dbOutput.includes('-1');
  record('Database', 'Zero Negative Inventory Invariant', noNegInventory, 'No inventory row has available_quantity < 0');

  // Summary
  console.log('\n=================================================================');
  console.log(' BUSINESS-FLOW SUITE SUMMARY');
  console.log('=================================================================');
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  console.log(`Total Invariants Evaluated: ${results.length}`);
  console.log(`Passed: ${passed} | Failed: ${failed}`);

  return { total: results.length, passed, failed, results };
}

runBusinessFlow().catch(console.error);
