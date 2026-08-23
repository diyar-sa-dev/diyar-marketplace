/** Deterministic demo credentials from DatabaseSeeder — never production secrets. */
export const E2E_PASSWORD = process.env.E2E_DEMO_PASSWORD ?? 'Password123!';

/** Saudi national format: 5 + 8 digits (9 total). */
export const demoUsers = {
  customer: {
    phoneNational: '500000010',
    phoneE164: '966500000010',
    email: 'customer@diyar.local',
    name: 'DIYAR Demo Customer',
  },
  vendor: {
    phoneNational: '500000002',
    phoneE164: '966500000002',
    email: 'vendor@diyar.local',
    name: 'DIYAR Demo Vendor',
  },
  admin: {
    phoneNational: '500000001',
    phoneE164: '966500000001',
    email: 'admin@diyar.local',
    name: 'DIYAR Admin',
  },
  provider: {
    phoneNational: '500000101',
    phoneE164: '966500000101',
    email: 'eiwan@diyar.local',
    name: 'Eiwan Provider',
  },
} as const;
